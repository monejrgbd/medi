"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import StructuredCard from "./StructuredCard";

interface MedicalInfo {
  medications: { name: string }[];
  allergies: { name: string }[];
  chronic_conditions: { name: string }[];
}

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
  const { t } = useLanguage();

  async function handleApprove() {
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
      {medicalInfo && (medicalInfo.medications.length > 0 || medicalInfo.allergies.length > 0 || medicalInfo.chronic_conditions.length > 0) && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-4">
          <p className="text-xs font-semibold text-ink mb-3">Your medical information on file</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-medium text-slate mb-1">Medications</p>
              {medicalInfo.medications.length === 0 ? (
                <p className="text-xs text-ash">None</p>
              ) : (
                <ul className="space-y-0.5">
                  {medicalInfo.medications.map((m, i) => (
                    <li key={i} className="text-xs text-ink">{m.name}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className={`text-[11px] font-medium mb-1 ${medicalInfo.allergies.length > 0 ? "text-red-600" : "text-slate"}`}>Allergies</p>
              {medicalInfo.allergies.length === 0 ? (
                <p className="text-xs text-ash">None</p>
              ) : (
                <ul className="space-y-0.5">
                  {medicalInfo.allergies.map((a, i) => (
                    <li key={i} className="text-xs text-ink">{a.name}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate mb-1">Chronic conditions</p>
              {medicalInfo.chronic_conditions.length === 0 ? (
                <p className="text-xs text-ash">None</p>
              ) : (
                <ul className="space-y-0.5">
                  {medicalInfo.chronic_conditions.map((c, i) => (
                    <li key={i} className="text-xs text-ink">{c.name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <p className="text-[11px] text-ash italic mb-4">
        {t("summary.disclaimer")}
      </p>

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
          disabled={loading}
          className="flex-1 rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? t("summary.submitting") : t("summary.approve")}
        </button>
      </div>
    </div>
  );
}
