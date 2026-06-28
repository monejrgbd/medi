import type { ChatMessage, ModelCall, ProviderAdapter, StreamChunk } from "./types.ts";
// Auth (service account -> access token) is shared with process-voice (STT v2)
// and the Cloud Run ID-token minter; see ../_shared/google-auth.ts.
import { getAccessToken } from "../_shared/google-auth.ts";

async function getRegion(supabase: any): Promise<string> {
  // Try env first, fall back to Vault, default us-central1
  const envRegion = Deno.env.get("GOOGLE_VERTEX_REGION");
  if (envRegion) return envRegion;
  const { data } = await supabase.rpc("private_get_vault_secret", {
    p_name: "google_vertex_region",
  });
  return data || "us-central1";
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
    return {
      json: JSON.parse(rawText),
      rawText,
      usage: data.usageMetadata
        ? { input_tokens: data.usageMetadata.promptTokenCount ?? 0, output_tokens: data.usageMetadata.candidatesTokenCount ?? 0 }
        : undefined,
    };
  }
}
