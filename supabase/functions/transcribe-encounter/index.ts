// Internal function — deploy with --no-verify-jwt
// AI ambient scribe: transcribes the uploaded encounter audio segments with
// Google Speech-to-Text (latest_long + speaker diarization), assembles a
// diarized transcript, writes it to clinical_documents.scribe_transcript,
// meters PAYG billing, and triggers the existing generate-document-content
// SOAP pipeline. Idempotent and cursor-resumable (scribe_timeout_cron re-fires
// stuck rows; processing resumes from scribe_recordings.transcribed_segments).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INTERNAL_SECRET = Deno.env.get("INTERNAL_EDGE_SECRET");
const GOOGLE_API_KEY = Deno.env.get("GOOGLE_CLOUD_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Wall-clock budget per invocation; persist progress and let the cron resume.
const TIME_BUDGET_MS = 90_000;

// BCP-47 codes for Google Speech-to-Text (copied from process-voice).
const LANGUAGE_MAP: Record<string, string> = {
  en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE", pt: "pt-BR",
  it: "it-IT", ja: "ja-JP", ko: "ko-KR", zh: "zh-CN", nl: "nl-NL",
  ru: "ru-RU", ar: "ar-SA", hi: "hi-IN", tr: "tr-TR", vi: "vi-VN",
  th: "th-TH", id: "id-ID", pl: "pl-PL", sv: "sv-SE", uk: "uk-UA",
};

interface ScribeRow {
  id: string;
  org_id: string;
  visit_id: string;
  document_id: string | null;
  status: string;
  audio_prefix: string;
  language: string;
  segment_count: number;
  transcribed_segments: number;
  duration_ms: number | null;
}

type SB = ReturnType<typeof createClient>;

function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 8192;
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK) {
    parts.push(String.fromCharCode(...bytes.subarray(i, i + CHUNK)));
  }
  return btoa(parts.join(""));
}

interface GWord { word?: string; speakerTag?: number }

// Build a speaker-attributed block from one recognize response. Speaker tags
// are only stable within a single call, so labels are mapped per-segment by
// first appearance (Speaker A / Speaker B) and are explicitly approximate.
function renderSegment(result: unknown): string {
  const r = result as { results?: Array<{ alternatives?: Array<{ transcript?: string; words?: GWord[] }> }> };
  const results = r.results ?? [];
  if (results.length === 0) return "";

  // Prefer the diarized word list (Google consolidates it into the last result
  // that carries words).
  let words: GWord[] = [];
  for (const res of results) {
    const w = res.alternatives?.[0]?.words;
    if (w && w.length > 0) words = w;
  }

  if (words.length > 0 && words.some((w) => w.speakerTag !== undefined)) {
    const labelByTag = new Map<number, string>();
    const order = ["Speaker A", "Speaker B", "Speaker C", "Speaker D"];
    const lines: string[] = [];
    let curTag: number | undefined;
    let buf: string[] = [];
    const flush = () => {
      if (buf.length === 0) return;
      const tag = curTag ?? 0;
      if (!labelByTag.has(tag)) {
        labelByTag.set(tag, order[labelByTag.size] ?? `Speaker ${labelByTag.size + 1}`);
      }
      lines.push(`${labelByTag.get(tag)}: ${buf.join(" ").trim()}`);
      buf = [];
    };
    for (const w of words) {
      if (w.speakerTag !== curTag) {
        flush();
        curTag = w.speakerTag;
      }
      if (w.word) buf.push(w.word);
    }
    flush();
    if (lines.length > 0) return lines.join("\n");
  }

  // Fallback: no diarization returned — plain concatenated transcript.
  return results
    .map((res) => res.alternatives?.[0]?.transcript ?? "")
    .filter(Boolean)
    .join(" ")
    .trim();
}

async function transcribeSegment(
  supabase: SB,
  path: string,
  languageCode: string
): Promise<string> {
  const { data, error } = await supabase.storage.from("scribe-audio").download(path);
  if (error || !data) return "[segment inaudible: download failed]";

  const bytes = new Uint8Array(await data.arrayBuffer());
  const audioBase64 = bytesToBase64(bytes);

  const resp = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: {
          encoding: "WEBM_OPUS",
          languageCode,
          model: "latest_long",
          enableAutomaticPunctuation: true,
          diarizationConfig: {
            enableSpeakerDiarization: true,
            minSpeakerCount: 2,
            maxSpeakerCount: 2,
          },
        },
        audio: { content: audioBase64 },
      }),
    }
  );

  if (!resp.ok) {
    console.error("Google STT error", resp.status, await resp.text().catch(() => ""));
    return "[segment inaudible: transcription unavailable]";
  }
  const json = await resp.json();
  const text = renderSegment(json);
  return text || "[segment inaudible: no speech detected]";
}

async function failRecording(
  supabase: SB,
  rec: ScribeRow,
  message: string
): Promise<void> {
  try {
    await supabase
      .from("scribe_recordings")
      .update({ status: "failed", error: message.slice(0, 500), updated_at: new Date().toISOString() })
      .eq("id", rec.id);
    if (rec.document_id) {
      await supabase
        .from("clinical_documents")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", rec.document_id);
    }
    await supabase.from("audit_trail").insert({
      org_id: rec.org_id,
      entity_type: "scribe_recording",
      entity_id: rec.id,
      actor_id: "00000000-0000-0000-0000-000000000000",
      actor_type: "system",
      action: "scribe_failed",
      details: { reason: message.slice(0, 200) },
    });
  } catch (e) {
    console.error("failRecording cleanup error", e);
  }
}

Deno.serve(async (req) => {
  try {
    if (req.headers.get("x-internal-secret") !== INTERNAL_SECRET || !INTERNAL_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }
    if (!GOOGLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Transcription not configured" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    const { recording_id } = await req.json();
    if (!recording_id) {
      return new Response(JSON.stringify({ error: "Missing recording_id" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: recData, error: recErr } = await supabase
      .from("scribe_recordings")
      .select("id, org_id, visit_id, document_id, status, audio_prefix, language, segment_count, transcribed_segments, duration_ms")
      .eq("id", recording_id)
      .single();

    if (recErr || !recData) {
      return new Response(JSON.stringify({ success: false, error: "Recording not found" }), {
        status: 404, headers: { "Content-Type": "application/json" },
      });
    }
    const rec = recData as ScribeRow;

    // Idempotency guard: only act while transcribing (cron may re-fire).
    if (rec.status !== "transcribing") {
      return new Response(JSON.stringify({ success: true, skipped: rec.status }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    }
    if (!rec.document_id) {
      await failRecording(supabase, rec, "no_document");
      return new Response(JSON.stringify({ success: false, error: "No document" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    // List segments (zero-padded names sort lexically = chronologically).
    const { data: objects, error: listErr } = await supabase.storage
      .from("scribe-audio")
      .list(rec.audio_prefix, { limit: 1000, sortBy: { column: "name", order: "asc" } });

    if (listErr) {
      await failRecording(supabase, rec, "segment_list_failed");
      return new Response(JSON.stringify({ success: false, error: "List failed" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }
    const segments = (objects ?? [])
      .filter((o) => o.name.endsWith(".webm"))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (segments.length === 0) {
      await failRecording(supabase, rec, "no_segments");
      return new Response(JSON.stringify({ success: false, error: "No segments" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const languageCode = LANGUAGE_MAP[rec.language] || "en-US";

    // Resume from cursor. Prior partial transcript is preserved in scribe_transcript.
    let cursor = rec.transcribed_segments ?? 0;
    let assembled = "";
    if (cursor > 0) {
      const { data: docPrev } = await supabase
        .from("clinical_documents")
        .select("scribe_transcript")
        .eq("id", rec.document_id)
        .single();
      assembled = (docPrev?.scribe_transcript as string | null) ?? "";
    }

    const start = Date.now();
    let i = cursor;
    for (; i < segments.length; i++) {
      const path = `${rec.audio_prefix}/${segments[i].name}`;
      const text = await transcribeSegment(supabase, path, languageCode);
      assembled += (assembled ? "\n\n" : "") + `--- [segment ${i + 1}] ---\n${text}`;

      // Persist progress so a timeout/cron resume continues from here.
      if (Date.now() - start > TIME_BUDGET_MS && i + 1 < segments.length) {
        await supabase
          .from("clinical_documents")
          .update({ scribe_transcript: assembled, updated_at: new Date().toISOString() })
          .eq("id", rec.document_id);
        await supabase
          .from("scribe_recordings")
          .update({ transcribed_segments: i + 1, updated_at: new Date().toISOString() })
          .eq("id", rec.id);
        return new Response(
          JSON.stringify({ success: true, partial: true, done: i + 1, total: segments.length }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const header =
      "Automated transcription of the live in-person clinician and patient encounter. " +
      "Speaker labels are approximate (automatic diarization) and may be wrong or swapped; " +
      "verify against your recollection.";
    const finalTranscript = `${header}\n\n${assembled}`.slice(0, 24000);

    // Write the transcript onto the SOAP document.
    const { error: writeErr } = await supabase
      .from("clinical_documents")
      .update({ scribe_transcript: finalTranscript, updated_at: new Date().toISOString() })
      .eq("id", rec.document_id);
    if (writeErr) {
      await failRecording(supabase, rec, "transcript_write_failed");
      return new Response(JSON.stringify({ success: false, error: "Write failed" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    // Billing: PAYG/trials metered, subscription plans unlimited no-op.
    // Non-blocking — never lose the clinical note over billing.
    const audioMinutes = rec.duration_ms && rec.duration_ms > 0
      ? rec.duration_ms / 60000
      : (segments.length * 45) / 60;
    let billError: string | null = null;
    try {
      const { data: bill } = await supabase.rpc("deduct_scribe_credits", {
        p_org_id: rec.org_id,
        p_visit_id: rec.visit_id,
        p_audio_minutes: audioMinutes,
      });
      if (bill && bill.success === false) billError = bill.error ?? "billing_failed";
    } catch (e) {
      billError = "billing_error";
      console.error("deduct_scribe_credits error", e);
    }

    await supabase
      .from("scribe_recordings")
      .update({
        status: "transcribed",
        transcribed_segments: segments.length,
        stt_minutes: Math.ceil(audioMinutes),
        error: billError,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rec.id);

    await supabase.from("audit_trail").insert({
      org_id: rec.org_id,
      entity_type: "scribe_recording",
      entity_id: rec.id,
      actor_id: "00000000-0000-0000-0000-000000000000",
      actor_type: "system",
      action: "scribe_transcribed",
      details: {
        document_id: rec.document_id,
        segments: segments.length,
        minutes: Math.ceil(audioMinutes),
        billing: billError ?? "ok",
      },
    });

    // Trigger the existing SOAP generator (edge-to-edge internal call). Only
    // flip to drafting from draft/editing so a concurrent regenerate is safe.
    const { data: flipped } = await supabase
      .from("clinical_documents")
      .update({ status: "drafting", updated_at: new Date().toISOString() })
      .eq("id", rec.document_id)
      .in("status", ["draft", "editing"])
      .select("id");

    if (flipped && flipped.length > 0) {
      await supabase.from("audit_trail").insert({
        org_id: rec.org_id,
        entity_type: "clinical_document",
        entity_id: rec.document_id,
        actor_id: "00000000-0000-0000-0000-000000000000",
        actor_type: "system",
        action: "document_draft_requested",
        details: { source: "scribe", recording_id: rec.id },
      });
      // Fire-and-forget; generate-document-content guards on status==='drafting'.
      fetch(`${SUPABASE_URL}/functions/v1/generate-document-content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
          "x-internal-secret": INTERNAL_SECRET,
        },
        body: JSON.stringify({ document_id: rec.document_id }),
      }).catch((e) => console.error("generate-document-content trigger failed", e));
    }

    return new Response(
      JSON.stringify({ success: true, document_id: rec.document_id, segments: segments.length }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("transcribe-encounter unhandled error", err);
    try {
      const body = await req.clone().json().catch(() => null);
      if (body?.recording_id) {
        const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
        const { data } = await supabase
          .from("scribe_recordings")
          .select("id, org_id, visit_id, document_id, status, audio_prefix, language, segment_count, transcribed_segments, duration_ms")
          .eq("id", body.recording_id)
          .single();
        if (data) await failRecording(supabase, data as ScribeRow, `unhandled: ${(err as Error).message}`);
      }
    } catch { /* best effort */ }
    return new Response(JSON.stringify({ success: false, error: "Internal error" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});
