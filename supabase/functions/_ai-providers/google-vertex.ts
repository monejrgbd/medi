import type { ChatMessage, ModelCall, ProviderAdapter, StreamChunk } from "./types.ts";

// Module-level token cache — lives for the Deno isolate's lifetime.
// Cold starts mint a new token (~200ms).
interface TokenCache {
  token: string;
  project: string;
  expiresAt: number;
}
let tokenCache: TokenCache | null = null;

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

function b64url(bytes: Uint8Array | string): string {
  const str = typeof bytes === "string"
    ? bytes
    : String.fromCharCode(...bytes);
  return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function loadServiceAccount(supabase: any): Promise<ServiceAccount> {
  const { data, error } = await supabase.rpc("private_get_vault_secret", {
    p_name: "google_vertex_sa_json",
  });
  if (error || !data) {
    throw new Error(`Vertex service account not in Vault: ${error?.message ?? "not found"}`);
  }
  const sa = JSON.parse(data) as ServiceAccount;
  if (!sa.project_id || !sa.client_email || !sa.private_key) {
    throw new Error("Vertex service account JSON missing required fields");
  }
  return sa;
}

async function getRegion(supabase: any): Promise<string> {
  // Try env first, fall back to Vault, default us-central1
  const envRegion = Deno.env.get("GOOGLE_VERTEX_REGION");
  if (envRegion) return envRegion;
  const { data } = await supabase.rpc("private_get_vault_secret", {
    p_name: "google_vertex_region",
  });
  return data || "us-central1";
}

async function signJWT(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const toSign = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;

  // Parse PKCS8 PEM private key
  const pemContents = sa.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(toSign)
  );

  return `${toSign}.${b64url(new Uint8Array(signature))}`;
}

async function getAccessToken(supabase: any): Promise<{ token: string; project: string }> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt - 300_000 > now) {
    return { token: tokenCache.token, project: tokenCache.project };
  }

  const sa = await loadServiceAccount(supabase);
  const jwt = await signJWT(sa);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    throw new Error(`Vertex token exchange failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();

  tokenCache = {
    token: data.access_token,
    project: sa.project_id,
    expiresAt: now + data.expires_in * 1000,
  };

  return { token: tokenCache.token, project: tokenCache.project };
}

function buildContents(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

export class GoogleVertexAdapter implements ProviderAdapter {
  constructor(private supabase: any) {}

  async *streamChat(opts: {
    call: ModelCall;
    system: string;
    // systemCachePrefix is intentionally ignored for Vertex.
    // Implicit caching is enabled by default on all Google Cloud projects and
    // automatically gives a 90% discount on cached tokens for Gemini 3.x and
    // Gemini 2.5+ — same discount as Anthropic's explicit cache_control, but
    // without any per-request plumbing or per-visit state tracking. Explicit
    // caching via /v1/cachedContents would only duplicate what implicit already
    // provides for our short system prompts.
    systemCachePrefix?: number;
    messages: ChatMessage[];
  }): AsyncIterable<StreamChunk> {
    let token: string;
    let project: string;
    let region: string;

    try {
      const auth = await getAccessToken(this.supabase);
      token = auth.token;
      project = auth.project;
      region = await getRegion(this.supabase);
    } catch (e) {
      yield { type: "error", error: (e as Error).message };
      return;
    }

    const url =
      `https://${region}-aiplatform.googleapis.com/v1/projects/${project}/locations/${region}` +
      `/publishers/google/models/${opts.call.model}:streamGenerateContent?alt=sse`;

    let response: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: buildContents(opts.messages),
            systemInstruction: { parts: [{ text: opts.system }] },
            generationConfig: {
              temperature: Math.min(Math.max(opts.call.temperature, 0), 2),
              maxOutputTokens: opts.call.max_tokens,
            },
          }),
        });
        if (response.ok) break;
        if (response.status !== 500 && response.status !== 503) break;
        response = null;
      } catch {
        response = null;
      }
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }

    if (!response || !response.ok) {
      yield {
        type: "error",
        error: `Vertex ${response?.status ?? "network"}: ${response ? await response.text() : "no response"}`,
      };
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (!data) continue;
        try {
          const event = JSON.parse(data);
          const text = event.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) yield { type: "delta", text };
        } catch {
          // skip
        }
      }
    }
    yield { type: "done" };
  }

  async structuredOutput(opts: {
    call: ModelCall;
    system: string;
    systemCachePrefix?: number;  // ignored, see streamChat note
    messages: ChatMessage[];
  }): Promise<{ json: unknown; rawText: string }> {
    const { token, project } = await getAccessToken(this.supabase);
    const region = await getRegion(this.supabase);

    const url =
      `https://${region}-aiplatform.googleapis.com/v1/projects/${project}/locations/${region}` +
      `/publishers/google/models/${opts.call.model}:generateContent`;

    let response: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: buildContents(opts.messages),
            systemInstruction: { parts: [{ text: opts.system }] },
            generationConfig: {
              temperature: Math.min(Math.max(opts.call.temperature, 0), 2),
              maxOutputTokens: opts.call.max_tokens,
              responseMimeType: "application/json",
            },
          }),
        });
        if (response.ok) break;
        response = null;
      } catch {
        response = null;
      }
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }

    if (!response) throw new Error("Vertex request failed after retries");
    if (!response.ok) throw new Error(`Vertex ${response.status}: ${await response.text()}`);

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return { json: JSON.parse(rawText), rawText };
  }
}
