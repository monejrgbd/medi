"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  startScribeRecording,
  finalizeScribeRecording,
  cancelScribeRecording,
  fetchScribeRecording,
} from "@/app/(dashboard)/d/_actions/scribe";
import ScribeRecorder from "./ScribeRecorder";

type Phase =
  | "consent"
  | "recording"
  | "finalizing"
  | "transcribing"
  | "draft_ready"
  | "error";

interface ScribePanelProps {
  visitId: string;
  onClose: () => void;
  onOpenSoapEditor: (documentId: string) => void;
}

const CONSENT_TEXT =
  "I have informed the patient that this visit will be recorded for clinical " +
  "documentation and obtained their verbal consent.";

const POLL_MS = 3000;
const MAX_POLLS = 100; // ~5 min ceiling

export default function ScribePanel({
  visitId,
  onClose,
  onOpenSoapEditor,
}: ScribePanelProps) {
  const [phase, setPhase] = useState<Phase>("consent");
  const [attested, setAttested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lowCredits, setLowCredits] = useState(false);

  const recordingIdRef = useRef<string | null>(null);
  const documentIdRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPoll = () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    pollRef.current = null;
  };

  useEffect(() => () => clearPoll(), []);

  async function handleConsent() {
    if (!attested || busy) return;
    setBusy(true);
    setError(null);
    const r = await startScribeRecording(visitId, "en");
    setBusy(false);
    if (!r.success || !r.recordingId) {
      setError(r.error || "Could not start the scribe");
      setPhase("error");
      return;
    }
    recordingIdRef.current = r.recordingId;
    setLowCredits(Boolean(r.lowCredits));
    setPhase("recording");
  }

  const poll = useCallback(
    async (attempt: number) => {
      const rid = recordingIdRef.current;
      if (!rid) return;
      if (attempt > MAX_POLLS) {
        setError(
          "The note is still processing. You can find it under Documents shortly."
        );
        setPhase("error");
        return;
      }
      const r = await fetchScribeRecording(rid);
      if (r.success && r.recording) {
        const rec = r.recording as {
          status: string;
          document_id: string | null;
          document_status: string | null;
          error: string | null;
        };
        if (rec.document_id) documentIdRef.current = rec.document_id;

        if (
          rec.document_status === "drafting" ||
          rec.document_status === "drafted" ||
          rec.document_status === "editing"
        ) {
          setPhase("draft_ready");
          return;
        }
        if (rec.status === "failed" || rec.document_status === "failed") {
          setError(
            rec.error === "no_audio"
              ? "No audio was captured."
              : "Transcription failed. You can still open the note and write it manually."
          );
          setPhase("error");
          return;
        }
      }
      pollRef.current = setTimeout(() => poll(attempt + 1), POLL_MS);
    },
    []
  );

  const handleStopped = useCallback(
    async (segmentCount: number, durationMs: number) => {
      const rid = recordingIdRef.current;
      if (!rid) return;
      setPhase("finalizing");
      const r = await finalizeScribeRecording(rid, segmentCount, durationMs);
      if (!r.success) {
        setError(
          r.error === "no_audio"
            ? "No audio was captured, nothing to transcribe."
            : r.error || "Could not finalize the recording"
        );
        setPhase("error");
        return;
      }
      documentIdRef.current = r.documentId ?? null;
      setPhase("transcribing");
      poll(0);
    },
    [poll]
  );

  const handleMicDenied = useCallback(async () => {
    const rid = recordingIdRef.current;
    if (rid) await cancelScribeRecording(rid, "mic_denied");
    setError("Microphone access is required to record the encounter.");
    setPhase("error");
  }, []);

  async function handleClose() {
    clearPoll();
    const rid = recordingIdRef.current;
    if (rid && (phase === "recording" || phase === "consent")) {
      await cancelScribeRecording(rid, "canceled");
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h2 className="text-base font-bold text-ink">AI Scribe</h2>
          <button
            onClick={handleClose}
            className="text-slate hover:text-ink"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {phase === "consent" && (
            <div className="space-y-4">
              <p className="text-sm text-slate">
                The scribe records this visit, transcribes it, and drafts a SOAP
                note for you to review and sign. It works whether or not AI
                intake was used.
              </p>
              <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={attested}
                  onChange={(e) => setAttested(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
                />
                <span className="text-xs leading-relaxed text-ink">
                  {CONSENT_TEXT}
                </span>
              </label>
              <button
                onClick={handleConsent}
                disabled={!attested || busy}
                className="w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {busy ? "Starting..." : "Start recording"}
              </button>
            </div>
          )}

          {phase === "recording" && recordingIdRef.current && (
            <>
              {lowCredits && (
                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <p className="text-xs text-amber-800">
                    Credits are low. The note will still be produced; top up to
                    avoid interruptions.
                  </p>
                </div>
              )}
              <ScribeRecorder
                recordingId={recordingIdRef.current}
                onStopped={handleStopped}
                onMicDenied={handleMicDenied}
              />
            </>
          )}

          {(phase === "finalizing" || phase === "transcribing") && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <svg className="h-8 w-8 animate-spin text-hilt-blue" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-slate">
                {phase === "finalizing"
                  ? "Finishing the recording..."
                  : "Transcribing the encounter and drafting the note. This can take a minute."}
              </p>
            </div>
          )}

          {phase === "draft_ready" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="rounded-full bg-green-100 p-3">
                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-ink">
                The SOAP draft is ready to review.
              </p>
              <button
                onClick={() => {
                  if (documentIdRef.current)
                    onOpenSoapEditor(documentIdRef.current);
                }}
                className="w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Open SOAP draft
              </button>
            </div>
          )}

          {phase === "error" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <p className="text-sm text-red-600">{error}</p>
              {documentIdRef.current && (
                <button
                  onClick={() => onOpenSoapEditor(documentIdRef.current!)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-hilt-blue hover:bg-blue-50 transition-colors"
                >
                  Open note editor anyway
                </button>
              )}
              <button
                onClick={handleClose}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-slate hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
