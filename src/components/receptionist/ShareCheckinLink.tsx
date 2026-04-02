"use client";

import { useState, useTransition } from "react";
import { generateCheckinLink } from "@/app/(dashboard)/d/_actions/checkin-link";
import { toast } from "sonner";

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
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    const trimFirst = firstName.trim();
    const trimLast = lastName.trim();
    if (!trimFirst || !trimLast) {
      toast.error("Please enter first and last name");
      return;
    }

    startTransition(async () => {
      const result = await generateCheckinLink(locationId, trimFirst, trimLast);
      if (result.success && result.link) {
        setLink(result.link);
      } else {
        toast.error(result.error || "Failed to generate link");
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && firstName.trim() && lastName.trim()) handleGenerate();
                  }}
                />
              </div>
            </div>

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
                className="flex-1 rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
