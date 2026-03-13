"use client";

import { useState, useRef, useEffect } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface VoiceInputButtonProps {
  onTranscription: (text: string) => void;
  language: string;
  sessionToken: string;
  visitId: string;
  disabled?: boolean;
}

type VoiceState = "idle" | "recording" | "processing" | "error" | "denied" | "hidden";

export default function VoiceInputButton({
  onTranscription,
  language,
  sessionToken,
  visitId,
  disabled,
}: VoiceInputButtonProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [tooltip, setTooltip] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Check if MediaDevices API is available on mount
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setVoiceState("hidden");
    }
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size === 0) {
          setVoiceState("idle");
          return;
        }

        setVoiceState("processing");
        await processAudio(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setVoiceState("recording");
      setTooltip(null);
    } catch {
      setVoiceState("denied");
      setTooltip("Microphone access required");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  async function processAudio(blob: Blob) {
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      formData.append("language", language);
      formData.append("session_token", sessionToken);
      formData.append("visit_id", visitId);

      const res = await fetch(`${SUPABASE_URL}/functions/v1/process-voice`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) {
          setTooltip("Please wait before recording again");
          setVoiceState("idle");
          return;
        }
        throw new Error(data.error || "Transcription failed");
      }

      const data = await res.json();
      if (data.text) {
        onTranscription(data.text);
      }
      setVoiceState("idle");
    } catch {
      setVoiceState("error");
      setTooltip("Voice input temporarily unavailable");
      // Auto-recover after 5 seconds
      setTimeout(() => {
        setVoiceState("idle");
        setTooltip(null);
      }, 5000);
    }
  }

  function handleClick() {
    if (voiceState === "recording") {
      stopRecording();
    } else if (voiceState === "idle") {
      startRecording();
    }
  }

  if (voiceState === "hidden") return null;

  const isDisabled = disabled || voiceState === "processing" || voiceState === "denied" || voiceState === "error";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={`shrink-0 rounded-xl px-3 py-2.5 transition-all ${
          voiceState === "recording"
            ? "bg-red-500 text-white animate-pulse"
            : isDisabled
            ? "bg-gray-100 text-gray-300 cursor-not-allowed"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
        title={tooltip || (voiceState === "recording" ? "Stop recording" : "Voice input")}
      >
        {voiceState === "processing" ? (
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3z"
            />
          </svg>
        )}
      </button>

      {tooltip && (
        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-[10px] text-white">
          {tooltip}
        </div>
      )}
    </div>
  );
}
