"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

type Mode = "voice" | "buttons" | "text";
type VoiceState = "idle" | "recording" | "processing" | "error" | "denied" | "hidden";

interface PhysicalExamCaptureProps {
  value: string;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const MODE_TABS: { key: Mode; label: string }[] = [
  { key: "voice", label: "Dictate" },
  { key: "buttons", label: "Tap findings" },
  { key: "text", label: "Type" },
];

/* ── Body system definitions ── */
type SystemKey = "heent" | "cardio" | "abdomen" | "neuro" | "msk" | "skin" | "psych";

interface BodySystem {
  key: SystemKey;
  label: string;
  normalText: string;
}

const BODY_SYSTEMS: BodySystem[] = [
  {
    key: "heent",
    label: "HEENT",
    normalText: "HEENT: NCAT, PERRLA, oropharynx clear, neck supple",
  },
  {
    key: "cardio",
    label: "Cardio/Resp",
    normalText:
      "Cardiovascular: RRR, no murmurs. Respiratory: CTAB, no wheezes, rales, or rhonchi",
  },
  {
    key: "abdomen",
    label: "Abdomen",
    normalText:
      "Abdomen: soft, non-tender, non-distended, normoactive bowel sounds",
  },
  {
    key: "neuro",
    label: "Neuro",
    normalText: "Neurological: A&O x3, CN II-XII intact, no focal deficits",
  },
  {
    key: "msk",
    label: "MSK",
    normalText: "Musculoskeletal: full ROM, no joint swelling or deformity",
  },
  {
    key: "skin",
    label: "Skin",
    normalText: "Skin: no rashes, lesions, or concerning findings",
  },
  {
    key: "psych",
    label: "Psych",
    normalText: "Psychiatric: cooperative, appropriate affect, normal mood",
  },
];

type SystemState = "unselected" | "normal" | "abnormal";

interface SystemEntry {
  state: SystemState;
  abnormalText: string;
}

export default function PhysicalExamCapture({
  value,
  mode,
  onModeChange,
  onChange,
  disabled,
}: PhysicalExamCaptureProps) {
  /* ── Voice state ── */
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  /* ── Buttons state ── */
  const [systems, setSystems] = useState<Record<SystemKey, SystemEntry>>(() => {
    const init: Record<string, SystemEntry> = {};
    for (const s of BODY_SYSTEMS) {
      init[s.key] = { state: "unselected", abnormalText: "" };
    }
    return init as Record<SystemKey, SystemEntry>;
  });
  const [expandedSystem, setExpandedSystem] = useState<SystemKey | null>(null);

  // Check MediaDevices on mount
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setVoiceState("hidden");
    }
  }, []);

  /* ── Voice recording (reuses VoiceInputButton pattern) ── */
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
    } catch {
      setVoiceState("denied");
      setTimeout(() => setVoiceState("idle"), 5000);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  async function processAudio(blob: Blob) {
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        setVoiceState("error");
        setTimeout(() => setVoiceState("idle"), 5000);
        return;
      }

      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      formData.append("language", "en");
      // For doctor voice, we pass the access token as session_token for rate limiting
      formData.append("session_token", accessToken);
      formData.append("visit_id", "doctor-dictation");

      const res = await fetch(`${SUPABASE_URL}/functions/v1/process-voice`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Transcription failed");
      }

      const data = await res.json();
      if (data.text) {
        const newValue = value ? value + " " + data.text : data.text;
        onChange(newValue);
      }
      setVoiceState("idle");
    } catch {
      setVoiceState("error");
      setTimeout(() => {
        setVoiceState("idle");
      }, 5000);
    }
  }

  function handleVoiceToggle() {
    if (voiceState === "recording") {
      stopRecording();
    } else if (voiceState === "idle") {
      startRecording();
    }
  }

  /* ── Buttons mode logic ── */
  const rebuildButtonsValue = useCallback(
    (updated: Record<SystemKey, SystemEntry>) => {
      const lines: string[] = [];
      for (const sys of BODY_SYSTEMS) {
        const entry = updated[sys.key];
        if (entry.state === "normal") {
          lines.push(sys.normalText);
        } else if (entry.state === "abnormal" && entry.abnormalText.trim()) {
          lines.push(`${sys.label}: ${entry.abnormalText.trim()}`);
        }
      }
      onChange(lines.join("\n"));
    },
    [onChange]
  );

  function handleSystemToggle(key: SystemKey, choice: "normal" | "abnormal") {
    setSystems((prev) => {
      const current = prev[key];
      // If already selected with same choice, deselect
      if (current.state === choice) {
        const updated = {
          ...prev,
          [key]: { state: "unselected" as SystemState, abnormalText: "" },
        };
        setExpandedSystem(null);
        rebuildButtonsValue(updated);
        return updated;
      }

      const updated = {
        ...prev,
        [key]: {
          state: choice as SystemState,
          abnormalText: choice === "abnormal" ? current.abnormalText : "",
        },
      };

      if (choice === "abnormal") {
        setExpandedSystem(key);
      } else {
        setExpandedSystem(null);
      }

      rebuildButtonsValue(updated);
      return updated;
    });
  }

  function handleAbnormalText(key: SystemKey, text: string) {
    setSystems((prev) => {
      const updated = { ...prev, [key]: { ...prev[key], abnormalText: text } };
      rebuildButtonsValue(updated);
      return updated;
    });
  }

  function pillColor(entry: SystemEntry): string {
    if (entry.state === "normal") return "bg-green-100 text-green-700 border-green-300";
    if (entry.state === "abnormal") return "bg-amber-100 text-amber-700 border-amber-300";
    return "bg-gray-100 text-slate border-gray-200 hover:bg-gray-200";
  }

  /* ── Render ── */
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Mode tabs */}
      <div className="flex border-b border-gray-100">
        {MODE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onModeChange(tab.key)}
            disabled={disabled}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
              mode === tab.key
                ? "text-hilt-blue border-b-2 border-hilt-blue bg-blue-50/50"
                : "text-slate hover:text-ink"
            } disabled:opacity-50`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Voice mode */}
        {mode === "voice" && (
          <div className="flex flex-col items-center gap-4">
            {voiceState === "hidden" ? (
              <p className="text-xs text-ash text-center py-4">
                Microphone not available in this browser.
              </p>
            ) : (
              <>
                <button
                  type="button"
                  onMouseDown={handleVoiceToggle}
                  onMouseUp={() => {
                    if (voiceState === "recording") stopRecording();
                  }}
                  onTouchStart={handleVoiceToggle}
                  onTouchEnd={() => {
                    if (voiceState === "recording") stopRecording();
                  }}
                  disabled={disabled || voiceState === "processing" || voiceState === "denied" || voiceState === "error"}
                  className={`h-24 w-24 rounded-full flex items-center justify-center transition-all shadow-md ${
                    voiceState === "recording"
                      ? "bg-red-500 text-white animate-pulse scale-110"
                      : voiceState === "processing"
                        ? "bg-gray-200 text-gray-400 cursor-wait"
                        : "bg-hilt-blue text-white hover:bg-blue-700 active:scale-95"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {voiceState === "processing" ? (
                    <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3z"
                      />
                    </svg>
                  )}
                </button>

                <p className="text-xs text-slate text-center">
                  {voiceState === "recording"
                    ? "Recording... release to stop"
                    : voiceState === "processing"
                      ? "Transcribing..."
                      : voiceState === "denied"
                        ? "Microphone access required"
                        : voiceState === "error"
                          ? "Voice input temporarily unavailable"
                          : "Hold to dictate"}
                </p>
              </>
            )}

            {/* Show current transcript */}
            {value && (
              <div className="w-full mt-2 rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-medium text-slate mb-1">Transcript</p>
                <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{value}</p>
              </div>
            )}
          </div>
        )}

        {/* Buttons mode */}
        {mode === "buttons" && (
          <div>
            <p className="text-xs text-ash mb-3">
              Tap a system, then choose Normal or Abnormal.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {BODY_SYSTEMS.map((sys) => {
                const entry = systems[sys.key];
                return (
                  <div key={sys.key} className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedSystem(expandedSystem === sys.key ? null : sys.key)
                      }
                      disabled={disabled}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${pillColor(entry)} disabled:opacity-50`}
                    >
                      {sys.label}
                      {entry.state === "normal" && " \u2713"}
                      {entry.state === "abnormal" && " !"}
                    </button>

                    {/* Dropdown */}
                    {expandedSystem === sys.key && (
                      <div className="absolute top-full left-0 mt-1 z-10 rounded-lg border border-gray-200 bg-white shadow-lg p-2 min-w-[140px]">
                        <button
                          type="button"
                          onClick={() => handleSystemToggle(sys.key, "normal")}
                          disabled={disabled}
                          className={`w-full rounded-lg px-3 py-1.5 text-xs font-medium text-left transition-colors ${
                            entry.state === "normal"
                              ? "bg-green-100 text-green-700"
                              : "text-slate hover:bg-gray-50"
                          }`}
                        >
                          Normal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSystemToggle(sys.key, "abnormal")}
                          disabled={disabled}
                          className={`w-full rounded-lg px-3 py-1.5 text-xs font-medium text-left transition-colors mt-1 ${
                            entry.state === "abnormal"
                              ? "bg-amber-100 text-amber-700"
                              : "text-slate hover:bg-gray-50"
                          }`}
                        >
                          Abnormal
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Abnormal text inputs */}
            {BODY_SYSTEMS.filter((s) => systems[s.key].state === "abnormal").map(
              (sys) => (
                <div key={sys.key} className="mb-3">
                  <label className="text-xs font-medium text-slate mb-1 block">
                    {sys.label} findings
                  </label>
                  <input
                    type="text"
                    value={systems[sys.key].abnormalText}
                    onChange={(e) => handleAbnormalText(sys.key, e.target.value)}
                    placeholder={`Describe ${sys.label.toLowerCase()} findings...`}
                    disabled={disabled}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none disabled:opacity-50"
                  />
                </div>
              )
            )}

            {/* Preview of built value */}
            {value && (
              <div className="mt-3 rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-medium text-slate mb-1">Preview</p>
                <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{value}</p>
              </div>
            )}
          </div>
        )}

        {/* Text mode */}
        {mode === "text" && (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type physical exam findings (shorthand is fine, AI will expand)"
            rows={6}
            disabled={disabled}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none resize-y disabled:opacity-50"
          />
        )}
      </div>
    </div>
  );
}
