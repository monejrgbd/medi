"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import StructuredCard from "./StructuredCard";

interface SummaryReviewProps {
  visitId: string;
  sessionToken: string;
  summary: string;
  structuredCard?: Record<string, unknown> | null;
  onApprove: () => void;
  onReject: () => void;
}

export default function SummaryReview({
  visitId,
  sessionToken,
  summary,
  structuredCard,
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
