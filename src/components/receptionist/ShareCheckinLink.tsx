"use client";

import { useState, useTransition } from "react";
import { generateCheckinLink } from "@/app/(dashboard)/d/_actions/checkin-link";
import { toast } from "sonner";

type AiConfig = "standard" | "skip" | "premium";

interface ShareCheckinLinkProps {
  locationId: string;
  onClose: () => void;
}

export default function ShareCheckinLink({
  locationId,
  onClose,
}: ShareCheckinLinkProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [aiConfig, setAiConfig] = useState<AiConfig>("standard");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    const trimFirst = firstName.trim();
    const trimLast = lastName.trim();
    if (!trimFirst || !trimLast) {
      toast.error("Please enter first and last name");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await generateCheckinLink(
        locationId,
        trimFirst,
        trimLast,
        aiConfig === "premium" ? "advanced" : null,
        aiConfig === "skip"
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
        <h2 className="text-lg font-bold text-ink mb-1">Share Check-in Link</h2>
        <p className="text-xs text-slate mb-4">
          Generate a one time link for a patient to start check in from home. They will skip the approval step.
        </p>

        {!link ? (
          <>
            <div className="space-y-3 mb-4">
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
                disabled={isPending || !firstName.trim() || !lastName.trim()}
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
                Link generated for {firstName.trim()} {lastName.trim()}
                {aiConfig === "premium" && <span className="ml-1 text-purple-700">(Premium AI)</span>}
                {aiConfig === "skip" && <span className="ml-1 text-gray-600">(No AI)</span>}
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
