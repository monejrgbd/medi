// Shared Google service-account auth for Supabase edge functions (Deno).
//
// Two service accounts live in Vault, selected by `secretName`:
//   - google_vertex_sa_json (default): Vertex/Gemini, in the original project.
//   - google_run_sa_json: the `upheld-radar` project SA, used for Speech-to-Text
//     v2 (Chirp 3 dictation) and for minting the ECAPA Cloud Run ID token.
//
// - getAccessToken: OAuth2 access token (scope cloud-platform) for googleapis.
// - getIdToken: Google-signed ID token for a target audience (a Cloud Run
//   service URL), to call an authenticated (--no-allow-unauthenticated) service.
// Both are cached per service account (and per audience for ID tokens).

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

export const VERTEX_SA = "google_vertex_sa_json"; // Gemini / Vertex (original project)
export const RUN_SA = "google_run_sa_json";       // ECAPA Cloud Run invoke (upheld-radar)
export const STT_SA = "google_stt_sa_json";       // Speech-to-Text v2 / Chirp 3 (upheld-radar)

const accessTokenCache = new Map<string, { token: string; project: string; expiresAt: number }>();
const idTokenCache = new Map<string, { token: string; expiresAt: number }>();

function b64url(bytes: Uint8Array | string): string {
  const str = typeof bytes === "string" ? bytes : String.fromCharCode(...bytes);
  return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function loadServiceAccount(supabase: any, secretName: string): Promise<ServiceAccount> {
  const { data, error } = await supabase.rpc("private_get_vault_secret", { p_name: secretName });
  if (error || !data) {
    throw new Error(`Google service account '${secretName}' not in Vault: ${error?.message ?? "not found"}`);
  }
  const sa = JSON.parse(data) as ServiceAccount;
  if (!sa.project_id || !sa.client_email || !sa.private_key) {
    throw new Error(`Service account '${secretName}' JSON missing required fields`);
  }
  return sa;
}

async function importPrivateKey(sa: ServiceAccount): Promise<CryptoKey> {
  const pem = sa.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function signJWT(sa: ServiceAccount, claims: Record<string, unknown>): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const toSign = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
  const key = await importPrivateKey(sa);
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(toSign),
  );
  return `${toSign}.${b64url(new Uint8Array(sig))}`;
}

async function exchange(assertion: string): Promise<any> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function getAccessToken(
  supabase: any,
  secretName: string = VERTEX_SA,
): Promise<{ token: string; project: string }> {
  const now = Date.now();
  const cached = accessTokenCache.get(secretName);
  if (cached && cached.expiresAt - 300_000 > now) {
    return { token: cached.token, project: cached.project };
  }
  const sa = await loadServiceAccount(supabase, secretName);
  const nowSec = Math.floor(now / 1000);
  const jwt = await signJWT(sa, {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    iat: nowSec,
    exp: nowSec + 3600,
  });
  const data = await exchange(jwt);
  accessTokenCache.set(secretName, {
    token: data.access_token,
    project: sa.project_id,
    expiresAt: now + data.expires_in * 1000,
  });
  return { token: data.access_token, project: sa.project_id };
}

// Mint a Google-signed ID token for `audience` (a Cloud Run service URL).
export async function getIdToken(
  supabase: any,
  audience: string,
  secretName: string = VERTEX_SA,
): Promise<string> {
  const now = Date.now();
  const cacheKey = `${secretName}::${audience}`;
  const cached = idTokenCache.get(cacheKey);
  if (cached && cached.expiresAt - 300_000 > now) return cached.token;
  const sa = await loadServiceAccount(supabase, secretName);
  const nowSec = Math.floor(now / 1000);
  const jwt = await signJWT(sa, {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: nowSec,
    exp: nowSec + 3600,
    target_audience: audience,
  });
  const data = await exchange(jwt);
  if (!data.id_token) throw new Error("No id_token in Google token response");
  idTokenCache.set(cacheKey, { token: data.id_token, expiresAt: now + 3600 * 1000 });
  return data.id_token;
}

export async function getProjectId(supabase: any, secretName: string = VERTEX_SA): Promise<string> {
  return (await loadServiceAccount(supabase, secretName)).project_id;
}
