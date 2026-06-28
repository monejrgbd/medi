"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchMyVoiceprint, deleteMyVoiceprint } from "@/app/(dashboard)/d/_actions/voiceprint";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ENROLL_SECONDS = 15;

type State = "loading" | "idle" | "recording" | "processing" | "error";

interface Status {
  enrolled: boolean;
  enrolledAt?: string;
  displayName?: string;
}

export default function VoiceEnrollment() {
  const [state, setState] = useState<State>("loading");
  const [status, setStatus] = useState<Status>({ enrolled: false });
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void refresh();
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function refresh() {
    setState("loading");
    const r = await fetchMyVoiceprint();
    if (r && r.success) {
      setStatus({ enrolled: !!r.enrolled, enrolledAt: r.enrolled_at, displayName: r.display_name });
    }
    setState("idle");
  }

  async function startRecording() {
    setMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mime });
        if (blob.size === 0) {
          setState("idle");
          return;
        }
        await submit(blob);
      };
      recorderRef.current = rec;
      rec.start();
      setState("recording");
      stopTimerRef.current = setTimeout(() => {
        if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      }, ENROLL_SECONDS * 1000);
    } catch {
      setState("error");
      setMessage("Microphone access is required.");
    }
  }

  function stopRecording() {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  async function submit(blob: Blob) {
    setState("processing");
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setState("error");
        setMessage("Please sign in again.");
        return;
      }
      const fd = new FormData();
      fd.append("audio", blob, "enroll.webm");
      fd.append("consent", "true");
      const res = await fetch(`${SUPABASE_URL}/functions/v1/enroll-voiceprint`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setState("error");
        setMessage(data.error || "Enrollment failed. Please try again.");
        return;
      }
      setConsent(false);
      setMessage("Your voice is enrolled.");
      await refresh();
    } catch {
      setState("error");
      setMessage("Enrollment failed. Please try again.");
    }
  }

  async function onDelete() {
    setState("processing");
    setMessage(null);
    const r = await deleteMyVoiceprint();
    if (r && r.success) {
      setMessage("Your voiceprint was deleted.");
      await refresh();
    } else {
      setState("error");
      setMessage("Could not delete the voiceprint.");
    }
  }

  if (state === "loading") {
    return <div className="text-sm text-slate">Loading voice settings...</div>;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-base font-semibold text-ink">Scribe voice ID</h2>
      <p className="mt-1 text-sm text-slate">
        Enroll your voice once so the AI scribe can label your turns as the
        clinician in recorded encounters. Speak normally for about {ENROLL_SECONDS} seconds
        in a quiet room.
      </p>

      {status.enrolled ? (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-emerald-800">Enrolled</p>
            {status.enrolledAt && (
              <p className="text-xs text-emerald-700">
                Since {new Date(status.enrolledAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onDelete}
            disabled={state === "processing"}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Delete voiceprint
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="flex items-start gap-2 text-xs text-slate">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I consent to creating a voiceprint of my voice to identify me during
              recorded patient encounters. The recording sample is not stored, only a
              derived voiceprint, and I can delete it at any time.
            </span>
          </label>

          {state === "recording" ? (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-full bg-red-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
              Stop and enroll
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={!consent || state === "processing"}
              className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
            >
              {state === "processing" ? "Enrolling..." : "Record and enroll"}
            </button>
          )}
        </div>
      )}

      {message && <p className="mt-3 text-xs text-slate">{message}</p>}
    </div>
  );
}
