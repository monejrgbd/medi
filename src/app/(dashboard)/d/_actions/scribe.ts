"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validUUID(id: string): boolean {
  return UUID_RE.test(id);
}

/** Doctor activates the scribe on a claimed patient (logs consent). */
export async function startScribeRecording(visitId: string, language = "en") {
  await requireAuth();
  if (!visitId || !validUUID(visitId))
    return { success: false, error: "Invalid visit ID" };
  const lang = /^[a-z]{2}$/.test(language) ? language : "en";

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_scribe_recording", {
    p_visit_id: visitId,
    p_language: lang,
  });

  if (error) return { success: false, error: "Failed to start scribe" };
  if (data && !data.success) return { success: false, error: data.error };
  return {
    success: true,
    recordingId: data.recording_id as string,
    audioPrefix: data.audio_prefix as string,
    lowCredits: Boolean(data.low_credits),
  };
}

/** Upload one recorded audio segment to the scribe-audio bucket. */
export async function uploadScribeSegment(
  recordingId: string,
  segmentIndex: number,
  formData: FormData
) {
  await requireAuth();
  if (!recordingId || !validUUID(recordingId))
    return { success: false, error: "Invalid recording ID" };
  if (
    !Number.isInteger(segmentIndex) ||
    segmentIndex < 1 ||
    segmentIndex > 5000
  )
    return { success: false, error: "Invalid segment index" };

  const file = formData.get("audio") as File | null;
  if (!file) return { success: false, error: "No audio provided" };
  if (!file.type.startsWith("audio/webm"))
    return { success: false, error: "Invalid audio format" };
  if (file.size <= 0 || file.size > 26214400)
    return { success: false, error: "Audio segment too large" };

  const supabase = await createClient();

  // RLS (org_member_read) restricts this to the caller's own org recording.
  const { data: rec, error: recErr } = await supabase
    .from("scribe_recordings")
    .select("audio_prefix, status")
    .eq("id", recordingId)
    .single();

  if (recErr || !rec)
    return { success: false, error: "Recording not found" };
  if (rec.status !== "consented" && rec.status !== "recording")
    return { success: false, error: "Recording is not active" };

  const name = String(segmentIndex).padStart(4, "0") + ".webm";
  const path = `${rec.audio_prefix}/${name}`;

  const { error: upErr } = await supabase.storage
    .from("scribe-audio")
    .upload(path, file, { contentType: "audio/webm", upsert: true });

  if (upErr) return { success: false, error: "Upload failed" };
  return { success: true };
}

/** Doctor pressed Stop — create the SOAP doc and kick transcription. */
export async function finalizeScribeRecording(
  recordingId: string,
  segmentCount: number,
  durationMs: number
) {
  await requireAuth();
  if (!recordingId || !validUUID(recordingId))
    return { success: false, error: "Invalid recording ID" };
  if (!Number.isInteger(segmentCount) || segmentCount < 0)
    return { success: false, error: "Invalid segment count" };
  const dur =
    Number.isInteger(durationMs) && durationMs >= 0 ? durationMs : 0;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("finalize_scribe_recording", {
    p_recording_id: recordingId,
    p_segment_count: segmentCount,
    p_duration_ms: dur,
  });

  if (error) return { success: false, error: "Failed to finalize recording" };
  if (data && !data.success) return { success: false, error: data.error };
  return { success: true, documentId: data.document_id as string };
}

/** Doctor abandoned before Stop, or mic was denied. */
export async function cancelScribeRecording(
  recordingId: string,
  reason = "canceled"
) {
  await requireAuth();
  if (!recordingId || !validUUID(recordingId))
    return { success: false, error: "Invalid recording ID" };
  const r = reason === "mic_denied" ? "mic_denied" : "canceled";

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_scribe_recording", {
    p_recording_id: recordingId,
    p_reason: r,
  });

  if (error) return { success: false, error: "Failed to cancel recording" };
  if (data && !data.success) return { success: false, error: data.error };
  return { success: true, status: data.status as string };
}

/** Poll recording + joined document status for the UI. */
export async function fetchScribeRecording(recordingId: string) {
  await requireAuth();
  if (!recordingId || !validUUID(recordingId))
    return { success: false, error: "Invalid recording ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_scribe_recording", {
    p_recording_id: recordingId,
  });

  if (error) return { success: false, error: "Failed to fetch recording" };
  if (data && !data.success) return { success: false, error: data.error };
  return { success: true, recording: data.recording };
}
