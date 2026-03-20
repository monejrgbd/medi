"use client";

import { useState, useTransition } from "react";
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
  const [diagnosis, setDiagnosis] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showDiagnosis, setShowDiagnosis] = useState(true);

  const [followUpEnabled, setFollowUpEnabled] = useState(demoMode);
  const [followUpDays, setFollowUpDays] = useState<number | null>(demoMode ? 7 : 14);
  const [followUpInstructions, setFollowUpInstructions] = useState(
    ""
  );


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

      const result = await completeVisit(visitId, trimmed, followUp, showDiagnosis);
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
          placeholder="e.g. Acute pharyngitis, likely viral. Supportive care advised. Return if symptoms worsen or persist beyond 5 days."
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

        {/* Diagnosis visibility toggle */}
        <div className="mt-4 rounded-lg border border-gray-200 p-3">
          <p className="text-sm font-medium text-ink mb-2">
            Allow the patient to see this diagnosis?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowDiagnosis(true)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                showDiagnosis
                  ? "bg-hilt-blue text-white"
                  : "border border-gray-200 text-slate hover:bg-gray-50"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setShowDiagnosis(false)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                !showDiagnosis
                  ? "bg-red-600 text-white"
                  : "border border-gray-200 text-slate hover:bg-gray-50"
              }`}
            >
              No
            </button>
          </div>
          <p className="text-xs text-slate mt-1.5">
            {showDiagnosis
              ? "The patient will see this diagnosis in their visit summary."
              : "The patient will not see this diagnosis. Only staff can view it."}
          </p>
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
