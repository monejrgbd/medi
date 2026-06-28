// Browser-called, so this deploys WITH JWT verification (do NOT pass
// --no-verify-jwt). A clinician records a short clip; we upload it, get an ECAPA
// embedding from the Cloud Run service, store it via create_voiceprint using the
// CALLER's JWT (so auth.uid() = the clinician), then delete the temp clip. The
// enrollment audio is never persisted.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enrollVoiceprint } from "../_shared/identity.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ success: false, error: "Not authenticated" }, 401);

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const consent = formData.get("consent") === "true";

    if (!audioFile) return json({ success: false, error: "No audio provided" }, 400);
    if (!consent) return json({ success: false, error: "Consent required" }, 400);
    if (!audioFile.type.startsWith("audio/webm") && !audioFile.type.startsWith("audio/ogg")) {
      return json({ success: false, error: "Invalid audio format. Use WebM or OGG." }, 400);
    }
    // Enrollment clip should be short (10 to 15s); cap at 10MB.
    if (audioFile.size <= 0 || audioFile.size > 10 * 1024 * 1024) {
      return json({ success: false, error: "Audio out of range" }, 400);
    }

    // Service-role client: storage + ECAPA (which reads the Vault SA for the ID token).
    const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    // User-context client: create_voiceprint must run as the calling clinician.
    const user = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const tempPath = `enroll-temp/${crypto.randomUUID()}.webm`;
    const { error: upErr } = await service.storage
      .from("scribe-audio")
      .upload(tempPath, audioFile, { contentType: "audio/webm" });
    if (upErr) return json({ success: false, error: "Upload failed" }, 500);

    try {
      const { data: signed, error: signErr } = await service.storage
        .from("scribe-audio")
        .createSignedUrl(tempPath, 600);
      if (signErr || !signed?.signedUrl) {
        return json({ success: false, error: "Could not prepare audio" }, 500);
      }

      const { embedding, model_version } = await enrollVoiceprint(service, signed.signedUrl);

      const { data, error } = await user.rpc("create_voiceprint", {
        p_embedding: embedding,
        p_model_version: model_version,
        p_consent: true,
      });
      if (error) return json({ success: false, error: "Failed to save voiceprint" }, 500);
      if (data && data.success === false) return json({ success: false, error: data.error }, 400);

      return json({ success: true, voiceprint_id: data?.voiceprint_id });
    } finally {
      // Transcribe-and-discard: the enrollment audio is never kept.
      await service.storage.from("scribe-audio").remove([tempPath]).catch(() => {});
    }
  } catch (err) {
    console.error("enroll-voiceprint error:", err);
    return json({ success: false, error: "Enrollment failed" }, 500);
  }
});
