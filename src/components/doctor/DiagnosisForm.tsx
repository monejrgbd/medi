"use client";

import { useState, useTransition, useRef, useCallback } from "react";
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
  const [showConfirm, setShowConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 320) + "px";
    }
  }, []);

  const [followUpEnabled, setFollowUpEnabled] = useState(demoMode);
  const [followUpDays, setFollowUpDays] = useState<number | null>(demoMode ? 7 : 14);
  const [followUpInstructions, setFollowUpInstructions] = useState(
    ""
  );

  const [showCareInstructions, setShowCareInstructions] = useState(false);
  const [careInstructions, setCareInstructions] = useState("");


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
    setShowConfirm(true);
  }

  function handleConfirm(allow: boolean) {
    setShowDiagnosis(allow);
    setShowConfirm(false);
    startTransition(async () => {
      const followUp = followUpEnabled && followUpDays
        ? {
            timeframe_days: followUpDays,
            ai_instructions: followUpInstructions.trim() || undefined,
          }
        : undefined;

      const result = await completeVisit(visitId, diagnosis.trim(), followUp, allow, careInstructions.trim() || undefined);
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
          ref={textareaRef}
          value={diagnosis}
          onChange={(e) => {
            setDiagnosis(e.target.value);
            autoResize();
          }}
          placeholder="e.g. Acute pharyngitis, likely viral. Supportive care advised. Return if symptoms worsen or persist beyond 5 days."
          rows={2}
          maxLength={10000}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none resize-none overflow-hidden"
        />

        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-slate">
            {diagnosis.length.toLocaleString()} / 10,000
          </p>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        {/* Care Instructions (collapsible) */}
        <div className="mt-4">
          {!showCareInstructions ? (
            <button
              type="button"
              onClick={() => setShowCareInstructions(true)}
              className="text-sm text-hilt-blue hover:underline"
            >
              Add care instructions
            </button>
          ) : (
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Care Instructions (optional)
              </label>
              <textarea
                value={careInstructions}
                onChange={(e) => setCareInstructions(e.target.value)}
                placeholder="Instructions for the patient, e.g. rest for 48 hours, take medication twice daily..."
                rows={3}
                maxLength={10000}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none resize-none"
              />
              <p className="text-xs text-slate mt-1">
                {careInstructions.length.toLocaleString()} / 10,000
              </p>
            </div>
          )}
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
            disabled={isPending}
            className="flex-1 rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Completing..." : "Complete Visit"}
          </button>
        </div>
      </div>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold text-ink mb-2">
              Allow the patient to see this diagnosis?
            </h3>
            <p className="text-sm text-slate mb-5">
              The patient will receive a visit summary. Would you like the
              diagnosis to be included?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleConfirm(false)}
                disabled={isPending}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-slate hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Completing..." : "No, hide it"}
              </button>
              <button
                onClick={() => handleConfirm(true)}
                disabled={isPending}
                className="flex-1 rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Completing..." : "Yes, show it"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
