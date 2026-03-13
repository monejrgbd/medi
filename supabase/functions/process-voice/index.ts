import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_CLOUD_API_KEY");
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
    if (!GOOGLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Voice input not configured" }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

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

    // Call Google Speech-to-Text API
    const languageCode = LANGUAGE_MAP[language] || "en-US";

    const speechResponse = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            encoding: "WEBM_OPUS",
            languageCode,
            model: "latest_short",
            enableAutomaticPunctuation: true,
          },
          audio: {
            content: audioBase64,
          },
        }),
      }
    );

    if (!speechResponse.ok) {
      console.error("Google Speech API error:", speechResponse.status);
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

    const topAlternative = results[0].alternatives[0];

    return new Response(
      JSON.stringify({
        text: topAlternative.transcript || "",
        confidence: topAlternative.confidence || 0,
      }),
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
