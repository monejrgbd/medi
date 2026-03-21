"use client";

import { useState, useTransition } from "react";
import { releaseToDoctor } from "@/app/(dashboard)/d/_actions/nurse";

interface NurseReleaseDialogProps {
  visitId: string;
  initialNotes: string;
  onClose: () => void;
  onComplete: () => void;
}

export default function NurseReleaseDialog({
  visitId,
  initialNotes,
  onClose,
  onComplete,
}: NurseReleaseDialogProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    const trimmed = notes.trim();
    if (!trimmed) {
      setError("Nurse notes are required before releasing to the doctor");
      return;
    }
    if (trimmed.length < 10) {
      setError("Please provide more detail in your notes (at least 10 characters)");
      return;
    }
    if (trimmed.length > 10000) {
      setError("Notes exceed 10,000 characters");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await releaseToDoctor(visitId, trimmed);
      if (result.success) {
        onComplete();
      } else {
        setError(result.error || "Failed to release to doctor");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-ink mb-2">
          Release to Doctor
        </h2>
        <p className="text-sm text-slate mb-4">
          The patient will be placed back in the queue for a doctor to claim.
          Your notes will be visible to the doctor.
        </p>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Summarize your findings, vitals recorded, vaccines given, and any concerns for the doctor..."
          rows={6}
          maxLength={10000}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink placeholder:text-ash focus:border-teal-500 focus:outline-none resize-y"
        />
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-slate">
            {notes.length.toLocaleString()} / 10,000
          </p>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-slate hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Releasing..." : "Release to Doctor"}
          </button>
        </div>
      </div>
    </div>
  );
}
