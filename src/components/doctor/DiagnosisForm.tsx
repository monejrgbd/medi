"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { completeVisit } from "@/app/(dashboard)/d/_actions/doctor";
import FollowUpForm from "./FollowUpForm";

interface DiagnosisFormProps {
  visitId: string;
  onClose: () => void;
  onComplete: () => void;
  demoMode?: boolean;
}

export default function DiagnosisForm({
  visitId,
  onClose,
  onComplete,
  demoMode = false,
}: DiagnosisFormProps) {
  const [diagnosis, setDiagnosis] = useState(demoMode ? "Demo visit, patient assessed." : "");
  const autoSubmitRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [followUpEnabled, setFollowUpEnabled] = useState(demoMode);
  const [followUpDays, setFollowUpDays] = useState(demoMode ? 7 : 14);
  const [followUpInstructions, setFollowUpInstructions] = useState(
    demoMode ? "Hello, please do not forget to book on the agreed time." : ""
  );

  // Demo: auto-submit after 20s
  useEffect(() => {
    if (!demoMode) return;
    const timer = setTimeout(() => {
      if (!autoSubmitRef.current) {
        autoSubmitRef.current = true;
        handleSubmit();
      }
    }, 20_000);
    return () => clearTimeout(timer);
  }, [demoMode]);

  function handleSubmit() {
    const trimmed = diagnosis.trim();
    if (!trimmed) {
      setError("Diagnosis is required");
      return;
    }
    if (trimmed.length > 10000) {
      setError("Diagnosis exceeds 10,000 characters");
      return;
    }

    setError(null);
    startTransition(async () => {
      const followUp = followUpEnabled
        ? {
            timeframe_days: followUpDays,
            ai_instructions: followUpInstructions.trim() || undefined,
          }
        : undefined;

      const result = await completeVisit(visitId, trimmed, followUp);
      if (result.success) {
        onComplete();
      } else {
        setError(result.error || "Failed to complete visit");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-ink mb-4">
          Complete Visit — Enter Diagnosis
        </h2>

        <textarea
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="Enter your diagnosis and notes..."
          rows={8}
          maxLength={10000}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none resize-y"
        />

        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-slate">
            {diagnosis.length.toLocaleString()} / 10,000
          </p>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <FollowUpForm
          enabled={followUpEnabled}
          onEnabledChange={setFollowUpEnabled}
          days={followUpDays}
          onDaysChange={setFollowUpDays}
          instructions={followUpInstructions}
          onInstructionsChange={setFollowUpInstructions}
        />

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
            disabled={isPending || !diagnosis.trim()}
            className="flex-1 rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Completing..." : "Complete Visit"}
          </button>
        </div>
      </div>
    </div>
  );
}
