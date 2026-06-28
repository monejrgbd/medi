"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { uploadScribeSegment, uploadScribeFull } from "@/app/(dashboard)/d/_actions/scribe";

// One continuous MediaRecorder with a short timeslice. AssemblyAI processes the
// whole encounter as a single job (so speaker clusters stay consistent), so at
// Stop we assemble every chunk into one full.webm and upload it — that is the
// file AssemblyAI and the ECAPA voice-ID service consume. The per-timeslice
// chunks are uploaded as they arrive purely for crash-resilience: they are
// fragments of ONE stream, so the edge function can byte-concatenate them if a
// crash prevents the Stop assembly. (Chrome/Firefox only; Safari records mp4,
// which MediaRecorder cannot produce as webm here — unchanged from before.)
const TIMESLICE_MS = 20_000;

interface ScribeRecorderProps {
  recordingId: string;
  onStopped: (segmentCount: number, durationMs: number) => void;
  onMicDenied: () => void;
}

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export default function ScribeRecorder({
  recordingId,
  onStopped,
  onMicDenied,
}: ScribeRecorderProps) {
  const [elapsed, setElapsed] = useState(0);
  const [stopping, setStopping] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeRef = useRef("audio/webm");
  const finishedRef = useRef(false);

  // Guarantee onStopped fires exactly once (Stop click + recorder onstop can race).
  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onStopped(chunksRef.current.length, Date.now() - startedAtRef.current);
  }, [onStopped]);

  const uploadChunk = useCallback(
    async (index: number, blob: Blob) => {
      // Re-wrap: timeslice chunks after the first can have an empty MIME type,
      // which the upload action's audio/webm check would reject.
      const fd = new FormData();
      fd.append("audio", new Blob([blob], { type: "audio/webm" }), `${index}.webm`);
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const r = await uploadScribeSegment(recordingId, index, fd);
          if (r.success) return;
        } catch {
          /* retry */
        }
        await new Promise((res) => setTimeout(res, 500 * (attempt + 1)));
      }
      console.error("scribe chunk upload failed", index);
    },
    [recordingId]
  );

  const uploadFull = useCallback(
    async (blob: Blob) => {
      const fd = new FormData();
      fd.append("audio", blob, "full.webm");
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const r = await uploadScribeFull(recordingId, fd);
          if (r.success) return;
        } catch {
          /* retry */
        }
        await new Promise((res) => setTimeout(res, 600 * (attempt + 1)));
      }
      // Persistent failure: the edge function falls back to byte-concatenating
      // the resilience chunks uploaded above.
      console.error("scribe full upload failed");
    },
    [recordingId]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        mimeRef.current = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";

        const rec = new MediaRecorder(stream, { mimeType: mimeRef.current });
        recorderRef.current = rec;
        rec.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunksRef.current.push(e.data);
            void uploadChunk(chunksRef.current.length, e.data);
          }
        };
        rec.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: mimeRef.current });
          if (blob.size > 0) await uploadFull(blob);
          finish();
        };

        startedAtRef.current = Date.now();
        tickRef.current = setInterval(
          () => setElapsed(Date.now() - startedAtRef.current),
          1000
        );
        rec.start(TIMESLICE_MS);
      } catch {
        onMicDenied();
      }
    })();

    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);

    return () => {
      cancelled = true;
      window.removeEventListener("beforeunload", warn);
      if (tickRef.current) clearInterval(tickRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // Mount-only: the recorder manages its own lifecycle; callbacks are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleStop() {
    if (stopping) return;
    setStopping(true);
    if (tickRef.current) clearInterval(tickRef.current);
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.stop(); // onstop assembles + uploads full.webm, then calls finish()
    } else {
      finish();
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
        <span className="text-2xl font-semibold tabular-nums text-ink">
          {fmt(elapsed)}
        </span>
      </div>
      <p className="text-xs text-slate">Recording the encounter</p>

      <button
        type="button"
        onClick={handleStop}
        disabled={stopping}
        className="rounded-full bg-red-500 px-8 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition-colors"
      >
        {stopping ? "Finishing..." : "Stop & generate note"}
      </button>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 max-w-sm text-center">
        <p className="text-xs text-amber-800">
          Keep this tab open. Recording lives on this device and cannot be
          recovered if you navigate away.
        </p>
      </div>
    </div>
  );
}
