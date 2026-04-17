"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import StructuredCard from "./StructuredCard";

import { MedicalInfo } from "@/types/medical";

interface SummaryReviewProps {
  visitId: string;
  sessionToken: string;
  summary: string;
  structuredCard?: Record<string, unknown> | null;
  medicalInfo?: MedicalInfo | null;
  onApprove: () => void;
  onReject: () => void;
}

export default function SummaryReview({
  visitId,
  sessionToken,
  summary,
  structuredCard,
  medicalInfo,
  onApprove,
  onReject,
}: SummaryReviewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasAttemptedEarly, setHasAttemptedEarly] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [timerDone, setTimerDone] = useState(false);
  const { t } = useLanguage();
  const mountTime = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = useCallback(() => {
    const elapsed = Math.floor((Date.now() - mountTime.current) / 1000);
    const remaining = Math.max(0, 15 - elapsed);
    setSecondsLeft(remaining);
    if (remaining === 0) {
      setTimerDone(true);
      return;
    }
    intervalRef.current = setInterval(() => {
      const now = Math.floor((Date.now() - mountTime.current) / 1000);
      const left = Math.max(0, 15 - now);
      setSecondsLeft(left);
      if (left === 0) {
        setTimerDone(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function handleApprove() {
    // If timer hasn't elapsed and this is the first attempt, show warning + countdown
    const elapsed = Math.floor((Date.now() - mountTime.current) / 1000);
    if (elapsed < 15 && !hasAttemptedEarly) {
      setHasAttemptedEarly(true);
      startCountdown();
      return;
    }
    // If countdown is still running after early attempt, block
    if (hasAttemptedEarly && !timerDone) return;

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("approve_summary", {
      p_visit_id: visitId,
      p_session_token: sessionToken,
    });

    setLoading(false);

    if (rpcError || !data?.success) {
      setError("Failed to submit. Please try again.");
      return;
    }

    onApprove();
  }

  async function handleReject() {
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("reject_summary", {
      p_visit_id: visitId,
      p_session_token: sessionToken,
    });

    setLoading(false);

    if (rpcError || !data?.success) {
      setError("Something went wrong. Please try again.");
      return;
    }

    onReject();
  }

  return (
    <div className="w-full max-w-md">
      <h2 className="text-lg font-bold text-ink mb-1">
        {t("summary.title")}
      </h2>
      <p className="text-xs text-ash mb-4">
        {t("summary.subtitle")}
      </p>

      {structuredCard ? (
        <div className="mb-4">
          <StructuredCard data={structuredCard as Record<string, string | string[] | null>} />
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-4 mb-4">
          <p className="text-sm text-ink whitespace-pre-wrap">{summary}</p>
        </div>
      )}

      {/* Always show plain text summary below card if both exist */}
      {structuredCard && summary && (
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 mb-4">
          <p className="text-xs text-slate font-medium mb-1">Summary</p>
          <p className="text-sm text-ink">{summary}</p>
        </div>
      )}

      {/* Medical info confirmation */}
      {medicalInfo && (() => {
        const sections: { label: string; items: string[]; isAllergy?: boolean }[] = [];

        if (medicalInfo.medications.length > 0)
          sections.push({ label: "Medications", items: medicalInfo.medications.map(m => m.name) });
        if (medicalInfo.allergies.length > 0)
          sections.push({ label: "Allergies", items: medicalInfo.allergies.map(a => a.name), isAllergy: true });
        if (medicalInfo.chronic_conditions.length > 0)
          sections.push({ label: "Chronic conditions", items: medicalInfo.chronic_conditions.map(c => c.name) });
        if (medicalInfo.pets.length > 0)
          sections.push({ label: "Pets at home", items: medicalInfo.pets.map(p => p.name) });

        if (medicalInfo.custom_fields) {
          for (const [, field] of Object.entries(medicalInfo.custom_fields)) {
            if (field.values.length > 0) {
              sections.push({ label: field.label, items: field.values });
            }
          }
        }

        if (sections.length === 0) return null;

        return (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-4">
            <p className="text-xs font-semibold text-ink mb-3">Your medical information on file</p>
            <div className={`grid gap-3 ${sections.length >= 4 ? "sm:grid-cols-4" : sections.length === 3 ? "sm:grid-cols-3" : sections.length === 2 ? "sm:grid-cols-2" : ""}`}>
              {sections.map((section, i) => (
                <div key={i}>
                  <p className={`text-[11px] font-medium mb-1 ${section.isAllergy ? "text-red-600" : "text-slate"}`}>
                    {section.label}
                  </p>
                  <ul className="space-y-0.5">
                    {section.items.map((item, j) => (
                      <li key={j} className="text-xs text-ink">{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <p className="text-[11px] text-ash italic mb-4">
        {t("summary.disclaimer")}
      </p>

      {hasAttemptedEarly && !timerDone && (
        <div className="mb-3 text-center">
          <p className="text-sm text-amber-700">{t("summary.read_first")}</p>
          <p className="text-xs text-ash mt-1">
            {t("summary.wait_seconds").replace("{seconds}", String(secondsLeft))}
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 mb-3 text-center">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleReject}
          disabled={loading}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-slate hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {t("summary.reject")}
        </button>
        <button
          onClick={handleApprove}
          disabled={loading || (hasAttemptedEarly && !timerDone)}
          className="flex-1 rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? t("summary.submitting") : t("summary.approve")}
        </button>
      </div>
    </div>
  );
}
