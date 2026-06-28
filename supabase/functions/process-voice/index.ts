import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAccessToken, STT_SA } from "../_shared/google-auth.ts";

// Patient dictation -> Google Speech-to-Text v2 (Chirp 3). v2 requires an OAuth
// Bearer token (service account), NOT the v1 ?key= API key, so we reuse the
// shared SA flow in _shared/google-auth.ts. The SA needs the roles/speech.client
// IAM role. Region defaults to the `us` multi-region.
const GOOGLE_STT_REGION = Deno.env.get("GOOGLE_STT_REGION") || "us";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Simple in-memory rate limiter: session_token -> { count, resetAt }
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // per minute per session

function checkRateLimit(sessionToken: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(sessionToken);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(sessionToken, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Map language codes to BCP-47 codes for Google Speech-to-Text
// Covers all 20 TOP_LANGUAGES from LanguagePicker
const LANGUAGE_MAP: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  pt: "pt-BR",
  it: "it-IT",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
  nl: "nl-NL",
  ru: "ru-RU",
  ar: "ar-SA",
  hi: "hi-IN",
  tr: "tr-TR",
  vi: "vi-VN",
  th: "th-TH",
  id: "id-ID",
  pl: "pl-PL",
  sv: "sv-SE",
  uk: "uk-UA",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    // Parse multipart form data
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const language = (formData.get("language") as string) || "en";
    const sessionToken = formData.get("session_token") as string;
    const visitId = formData.get("visit_id") as string;

    if (!audioFile || !sessionToken || !visitId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Validate MIME type
    if (!audioFile.type.startsWith("audio/webm") && !audioFile.type.startsWith("audio/ogg")) {
      return new Response(
        JSON.stringify({ error: "Invalid audio format. Use WebM or OGG." }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Validate size (10MB max)
    if (audioFile.size > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "Audio file too large. Maximum 10MB." }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Rate limit
    if (!checkRateLimit(sessionToken)) {
      return new Response(
        JSON.stringify({ error: "Please wait before sending another voice message." }),
        { status: 429, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Validate session
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: sessionData } = await supabase.rpc("get_patient_session", {
      p_session_token: sessionToken,
    });

    if (!sessionData?.success) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    if (sessionData.visit_id !== visitId) {
      return new Response(
        JSON.stringify({ error: "Session mismatch" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Convert audio to base64
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);
    const CHUNK = 8192;
    const chunks: string[] = [];
    for (let i = 0; i < audioBytes.length; i += CHUNK) {
      chunks.push(String.fromCharCode(...audioBytes.subarray(i, i + CHUNK)));
    }
    const audioBase64 = btoa(chunks.join(""));

    // Auth: OAuth Bearer token + project from the shared service-account flow.
    let token: string;
    let project: string;
    try {
      // STT v2 runs in upheld-radar via the serviceacc SA (also used for TTS).
      const auth = await getAccessToken(supabase, STT_SA);
      token = auth.token;
      project = auth.project;
    } catch (e) {
      console.error("STT v2 auth failed:", (e as Error).message);
      return new Response(
        JSON.stringify({ error: "Voice input not configured" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const languageCode = LANGUAGE_MAP[language] || "en-US";

    // Speech-to-Text v2: default recognizer (`_`), Chirp 3 model, auto decoding
    // (detects WEBM/OGG Opus). languageCodes accepts the BCP-47 list.
    const recognizeUrl =
      `https://${GOOGLE_STT_REGION}-speech.googleapis.com/v2/projects/${project}` +
      `/locations/${GOOGLE_STT_REGION}/recognizers/_:recognize`;

    const speechResponse = await fetch(recognizeUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        config: {
          model: "chirp_3",
          languageCodes: [languageCode],
          features: { enableAutomaticPunctuation: true },
          autoDecodingConfig: {},
        },
        content: audioBase64,
      }),
    });

    if (!speechResponse.ok) {
      console.error("Google STT v2 error:", speechResponse.status, await speechResponse.text().catch(() => ""));
      return new Response(
        JSON.stringify({ error: "Voice input temporarily unavailable" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const speechResult = await speechResponse.json();
    const results = speechResult.results;

    if (!results || results.length === 0) {
      return new Response(
        JSON.stringify({ text: "", confidence: 0 }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // v2 response: results[].alternatives[].transcript/confidence. Chirp 3 may
    // omit confidence; default to 1 so callers that gate on it still proceed.
    const transcript = results
      .map((r: any) => r.alternatives?.[0]?.transcript ?? "")
      .filter(Boolean)
      .join(" ")
      .trim();
    const confidence = results[0]?.alternatives?.[0]?.confidence ?? 1;

    return new Response(
      JSON.stringify({ text: transcript, confidence }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("process-voice error:", err);
    return new Response(
      JSON.stringify({ error: "Voice input temporarily unavailable" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
