// Identity provider interface for the AI scribe. Current backend: self-hosted
// ECAPA on Cloud Run (--no-allow-unauthenticated), called with a Google-signed
// ID token whose audience is the service URL. A managed alternative (Resemble)
// could implement the same two functions behind this module without touching
// callers.
import { getIdToken, RUN_SA } from "./google-auth.ts";

const ECAPA_SERVICE_URL = Deno.env.get("ECAPA_SERVICE_URL");

export interface Utterance {
  speaker: string;
  start: number; // milliseconds
  end: number;   // milliseconds
}

export interface VoiceprintRef {
  staff_user_id: string;
  display_name: string;
  embedding: number[];
  model_version: string;
}

export interface SpeakerMatch {
  staff_user_id: string;
  display_name: string;
  confidence: number;
}

async function callEcapa(supabase: any, path: string, body: unknown): Promise<any> {
  if (!ECAPA_SERVICE_URL) throw new Error("ECAPA_SERVICE_URL not configured");
  const base = ECAPA_SERVICE_URL.replace(/\/$/, "");
  // Cloud Run authenticated invocation: ID token audience = the service base URL,
  // minted from the upheld-radar service account that has run.invoker on it.
  const idToken = await getIdToken(supabase, base, RUN_SA);
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`ECAPA ${path} ${res.status}: ${await res.text().catch(() => "")}`);
  }
  return res.json();
}

// Enroll a clinician from a single-speaker clip (signed audio URL).
export async function enrollVoiceprint(
  supabase: any,
  audioUrl: string,
): Promise<{ embedding: number[]; model_version: string }> {
  return callEcapa(supabase, "/enroll", { audio_url: audioUrl });
}

// Identify which diarized speaker clusters match enrolled clinicians.
// Returns { model_version, threshold, speakers: { [clusterLabel]: SpeakerMatch | null } }.
export async function identifySpeakers(
  supabase: any,
  audioUrl: string,
  utterances: Utterance[],
  voiceprints: VoiceprintRef[],
  threshold?: number,
): Promise<{ model_version: string; threshold: number; speakers: Record<string, SpeakerMatch | null> }> {
  return callEcapa(supabase, "/identify", {
    audio_url: audioUrl,
    utterances,
    voiceprints,
    threshold,
  });
}
