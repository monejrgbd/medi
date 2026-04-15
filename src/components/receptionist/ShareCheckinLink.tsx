"use client";

import { useState, useTransition } from "react";
import { generateCheckinLink } from "@/app/(dashboard)/d/_actions/checkin-link";
import { toast } from "sonner";

type AiConfig = "standard" | "skip" | "premium";
type CheckinModeSelection =
  | "location_default"
  | "approve_to_start"
  | "approve_on_arrival"
  | "self_service_on_arrival";

const CHECKIN_MODE_LABELS: Record<CheckinModeSelection, { label: string; hint: string }> = {
  location_default: {
    label: "Use location default",
    hint: "Follow whatever the location is configured for.",
  },
  approve_to_start: {
    label: "Approve before chat",
    hint: "Receptionist must approve the patient in person before the AI chat starts.",
  },
  approve_on_arrival: {
    label: "Approve on arrival",
    hint: "Patient can chat from anywhere, then taps I Have Arrived for a receptionist to approve into the queue.",
  },
  self_service_on_arrival: {
    label: "Self-service on arrival",
    hint: "Patient chats from anywhere and enters the queue by tapping I Have Arrived. No receptionist step.",
  },
};

interface ShareCheckinLinkProps {
  locationId: string;
  onClose: () => void;
  demoMode?: boolean;
}

export default function ShareCheckinLink({
  locationId,
  onClose,
  demoMode = false,
}: ShareCheckinLinkProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [aiConfig, setAiConfig] = useState<AiConfig>("standard");
  const [nameMatchMode, setNameMatchMode] = useState<"name" | "none">("name");
  const [aiInstructions, setAiInstructions] = useState("");
  const [checkinMode, setCheckinMode] = useState<CheckinModeSelection>("location_default");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    if (nameMatchMode === "name") {
      const trimFirst = firstName.trim();
      const trimLast = lastName.trim();
      if (!trimFirst || !trimLast) {
        toast.error("Please enter first and last name");
        return;
      }
    }

    if (demoMode) {
      setError("Check in links cannot be generated in the demo");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await generateCheckinLink(
        locationId,
        firstName.trim(),
        lastName.trim(),
        aiConfig === "premium" ? "premium" : null,
        aiConfig === "skip",
        aiInstructions.trim() || null,
        nameMatchMode,
        checkinMode === "location_default" ? null : checkinMode
      );
      if (result.success && result.link) {
        setLink(result.link);
      } else {
        // Budget errors stay inline so user can switch AI config
        setError(result.error || "Failed to generate link");
      }
    });
  }

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-bold text-ink mb-1">Share Custom Check in Link</h2>
        <p className="text-xs text-slate mb-4">
          Generate a one time link with a custom check in configuration for a specific patient, independent of the location defaults.
        </p>

        {!link ? (
          <>
            <div className="space-y-3 mb-4">
              {/* Name Matching Mode */}
              <div>
                <label className="text-xs font-medium text-slate mb-1.5 block">
                  Name Matching
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNameMatchMode("name")}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      nameMatchMode === "name"
                        ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
                        : "bg-gray-50 text-slate hover:bg-gray-100"
                    }`}
                  >
                    Match Name
                  </button>
                  <button
                    type="button"
                    onClick={() => setNameMatchMode("none")}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      nameMatchMode === "none"
                        ? "bg-gray-200 text-gray-700 ring-1 ring-gray-400"
                        : "bg-gray-50 text-slate hover:bg-gray-100"
                    }`}
                  >
                    No Matching
                  </button>
                </div>
              </div>

              {nameMatchMode === "name" && (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate mb-1 block">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value.slice(0, 100))}
                      placeholder="Patient first name"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate mb-1 block">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value.slice(0, 100))}
                      placeholder="Patient last name"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* AI Config */}
              <div>
                <label className="text-xs font-medium text-slate mb-1.5 block">
                  AI Configuration
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setAiConfig("standard"); setError(null); }}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      aiConfig === "standard"
                        ? "bg-green-100 text-green-700 ring-1 ring-green-300"
                        : "bg-gray-50 text-slate hover:bg-gray-100"
                    }`}
                  >
                    Standard AI
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAiConfig("skip"); setError(null); }}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      aiConfig === "skip"
                        ? "bg-gray-200 text-gray-700 ring-1 ring-gray-400"
                        : "bg-gray-50 text-slate hover:bg-gray-100"
                    }`}
                  >
                    Skip AI
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAiConfig("premium"); setError(null); }}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      aiConfig === "premium"
                        ? "bg-purple-100 text-purple-700 ring-1 ring-purple-300"
                        : "bg-gray-50 text-slate hover:bg-gray-100"
                    }`}
                  >
                    Premium AI
                  </button>
                </div>
              </div>

              {/* Check-in Mode */}
              <div>
                <label className="text-xs font-medium text-slate mb-1.5 block">
                  Check-in Flow
                </label>
                <select
                  value={checkinMode}
                  onChange={(e) => setCheckinMode(e.target.value as CheckinModeSelection)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink focus:border-hilt-blue focus:outline-none"
                >
                  {(Object.keys(CHECKIN_MODE_LABELS) as CheckinModeSelection[]).map((k) => (
                    <option key={k} value={k}>
                      {CHECKIN_MODE_LABELS[k].label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-ash">{CHECKIN_MODE_LABELS[checkinMode].hint}</p>
              </div>

              {/* Session Instructions */}
              {aiConfig !== "skip" && (
                <div>
                  <label className="text-xs font-medium text-slate mb-1 block">
                    Session Instructions <span className="font-normal text-ash">(optional)</span>
                  </label>
                  <textarea
                    value={aiInstructions}
                    onChange={(e) => setAiInstructions(e.target.value.slice(0, 2000))}
                    placeholder="Add instructions for this session only..."
                    rows={2}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none resize-none"
                  />
                  <p className="mt-0.5 text-[10px] text-ash text-right">{aiInstructions.length}/2000</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isPending}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-slate hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isPending || (nameMatchMode === "name" && (!firstName.trim() || !lastName.trim()))}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 transition-colors ${
                  aiConfig === "premium"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : aiConfig === "skip"
                      ? "bg-gray-600 hover:bg-gray-700"
                      : "bg-hilt-blue hover:bg-blue-700"
                }`}
              >
                {isPending ? "Generating..." : "Generate Link"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-xs font-medium text-green-800 mb-2">
                {nameMatchMode === "name"
                  ? <>Link generated for {firstName.trim()} {lastName.trim()}</>
                  : <>Link generated (no name matching)</>
                }
                {aiConfig === "premium" && <span className="ml-1 text-purple-700">(Premium AI)</span>}
                {aiConfig === "skip" && <span className="ml-1 text-gray-600">(No AI)</span>}
                {aiInstructions.trim() && <span className="ml-1 text-amber-700">(Session instructions)</span>}
                {checkinMode !== "location_default" && (
                  <span className="ml-1 text-blue-700">({CHECKIN_MODE_LABELS[checkinMode].label})</span>
                )}
              </p>
              <div className="rounded-md bg-white border border-gray-200 px-3 py-2 text-xs text-ink break-all font-mono">
                {link}
              </div>
              <p className="mt-2 text-[10px] text-green-700">
                This link expires in 48 hours and can only be used once.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-slate hover:bg-gray-50"
              >
                Done
              </button>
              <button
                onClick={handleCopy}
                className="flex-1 rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
