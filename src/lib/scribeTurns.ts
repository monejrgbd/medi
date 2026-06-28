// Shared model + rendering for the AI scribe's structured transcript.
//
// The scribe transcript is stored on clinical_documents.scribe_turns as an
// ordered array of contiguous speaker turns. The flat clinical_documents
// .scribe_transcript (fed to the SOAP generator and shown as a fallback) is
// DERIVED from the turns by deriveScribeTranscript, so an edit only has to
// mutate the turns and re-derive. This module is the single source of truth for
// that derivation; the transcribe-encounter edge function (Deno, cannot import
// from src/) keeps an inline copy that MUST match this logic.

import { SPEAKER_ROLES } from "./constants";

export interface ScribeTurn {
  idx: number;
  speaker: string; // AssemblyAI diarization cluster: "A", "B", "C", ...
  role: string; // one of SPEAKER_ROLES value (clinician | patient | caregiver | other_clinician | unclear)
  label: string | null; // a name (e.g. "Dr. Chen") when known from voiceprint/visit; else null
  text: string;
  start: number; // ms
  end: number; // ms
  confidence: number | null; // voice-match confidence (0-1) when identified, else null
  low_confidence: boolean; // true => attribution was inferred and should be reviewed
}

export function roleLabel(role: string): string {
  return SPEAKER_ROLES.find((r) => r.value === role)?.label ?? "Speaker (unclear)";
}

// Map each distinct speaker cluster to a display name:
//   - named (label set):        "Dr. Chen (Clinician)", "Maria (Caregiver)"
//   - unnamed, unique role:      "Patient"
//   - unnamed, role shared:      "Caregiver 1", "Caregiver 2"
export function buildSpeakerDisplayMap(turns: ScribeTurn[]): Record<string, string> {
  const speakers: { speaker: string; role: string; label: string | null }[] = [];
  const seen = new Set<string>();
  for (const t of turns) {
    if (!seen.has(t.speaker)) {
      seen.add(t.speaker);
      speakers.push({ speaker: t.speaker, role: t.role, label: t.label });
    }
  }

  // Group unnamed speakers by role to decide whether to number them.
  const unnamedByRole: Record<string, string[]> = {};
  for (const s of speakers) {
    if (!s.label) (unnamedByRole[s.role] ??= []).push(s.speaker);
  }

  const map: Record<string, string> = {};
  for (const s of speakers) {
    if (s.label) {
      map[s.speaker] = `${s.label} (${roleLabel(s.role)})`;
    } else {
      const group = unnamedByRole[s.role] ?? [];
      map[s.speaker] =
        group.length > 1
          ? `${roleLabel(s.role)} ${group.indexOf(s.speaker) + 1}`
          : roleLabel(s.role);
    }
  }
  return map;
}

export const SCRIBE_TRANSCRIPT_HEADER =
  "In-person clinician and patient encounter transcript. Speaker identity is " +
  "verified by voice where a clinician is enrolled; turns flagged for review " +
  "were inferred from context and may need correction.";

// Flat transcript derived from the turns (display fallback + SOAP input).
export function deriveScribeTranscript(turns: ScribeTurn[]): string {
  if (!turns || turns.length === 0) return "";
  const names = buildSpeakerDisplayMap(turns);
  const body = turns
    .map((t) => `${names[t.speaker] ?? roleLabel(t.role)}: ${t.text}`.trim())
    .join("\n");
  return `${SCRIBE_TRANSCRIPT_HEADER}\n\n${body}`;
}

const ROLE_VALUES = new Set<string>(SPEAKER_ROLES.map((r) => r.value));

// Defensive normalization of a turns array coming from the client before it is
// persisted. Drops anything that is not a well-formed turn.
export function sanitizeScribeTurns(input: unknown): ScribeTurn[] {
  if (!Array.isArray(input)) return [];
  const out: ScribeTurn[] = [];
  for (let i = 0; i < input.length; i++) {
    const t = input[i] as Record<string, unknown>;
    if (!t || typeof t !== "object") continue;
    const text = typeof t.text === "string" ? t.text : "";
    const speaker = typeof t.speaker === "string" && t.speaker ? t.speaker : "A";
    const role = typeof t.role === "string" && ROLE_VALUES.has(t.role) ? t.role : "unclear";
    const label =
      typeof t.label === "string" && t.label.trim().length > 0
        ? t.label.trim().slice(0, 120)
        : null;
    out.push({
      idx: i,
      speaker,
      role,
      label,
      text: text.slice(0, 20000),
      start: Number.isFinite(t.start as number) ? Number(t.start) : 0,
      end: Number.isFinite(t.end as number) ? Number(t.end) : 0,
      confidence:
        typeof t.confidence === "number" && Number.isFinite(t.confidence)
          ? t.confidence
          : null,
      low_confidence: Boolean(t.low_confidence),
    });
  }
  return out;
}
