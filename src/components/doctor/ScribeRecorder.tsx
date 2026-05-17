"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { uploadScribeSegment } from "@/app/(dashboard)/d/_actions/scribe";

// Each segment is a complete, self-contained WebM: we stop and restart the
// MediaRecorder every SEGMENT_MS rather than using timeslice (timeslice yields
// headerless cluster fragments Google STT cannot decode). The sub-second gap
// at each boundary is clinically irrelevant for a synthesized note.
const SEGMENT_MS = 45_000;

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
  const [segments, setSegments] = useState(0);
  const [stopping, setStopping] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingRef = useRef(true);
  const segIndexRef = useRef(0);
  const startedAtRef = useRef(Date.now());
  const segTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeRef = useRef("audio/webm");

  const uploadSegment = useCallback(
    async (index: number, blob: Blob) => {
      const fd = new FormData();
      fd.append("audio", blob, `${index}.webm`);
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const r = await uploadScribeSegment(recordingId, index, fd);
          if (r.success) return;
        } catch {
          /* retry */
        }
        await new Promise((res) => setTimeout(res, 500 * (attempt + 1)));
      }
      // Persistent failure: skip this segment (edge fn transcribes whatever
      // segments landed; a gap becomes an inaudible marker).
      console.error("scribe segment upload failed", index);
    },
    [recordingId]
  );

  const startSegment = useCallback(() => {
    const stream = streamRef.current;
    if (!stream || !recordingRef.current) return;

    const rec = new MediaRecorder(stream, { mimeType: mimeRef.current });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    rec.onstop = async () => {
      const blob = new Blob(chunks, { type: mimeRef.current });
      if (blob.size > 0) {
        segIndexRef.current += 1;
        const idx = segIndexRef.current;
        setSegments(idx);
        await uploadSegment(idx, blob);
      }
      if (recordingRef.current) {
        startSegment();
      } else {
        onStopped(segIndexRef.current, Date.now() - startedAtRef.current);
      }
    };
    recorderRef.current = rec;
    rec.start();
    segTimerRef.current = setTimeout(() => {
      if (rec.state === "recording") rec.stop();
    }, SEGMENT_MS);
  }, [onStopped, uploadSegment]);

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
        startedAtRef.current = Date.now();
        tickRef.current = setInterval(
          () => setElapsed(Date.now() - startedAtRef.current),
          1000
        );
        startSegment();
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
      if (segTimerRef.current) clearTimeout(segTimerRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // Mount-only: recorder loop manages its own lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleStop() {
    if (stopping) return;
    setStopping(true);
    recordingRef.current = false;
    if (segTimerRef.current) clearTimeout(segTimerRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    const rec = recorderRef.current;
    if (rec && rec.state === "recording") {
      rec.stop(); // onstop uploads the final segment then calls onStopped
    } else {
      onStopped(segIndexRef.current, Date.now() - startedAtRef.current);
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
      <p className="text-xs text-slate">
        Recording the encounter, {segments} segment{segments === 1 ? "" : "s"} captured
      </p>

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
