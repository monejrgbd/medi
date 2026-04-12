"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchPendingDocumentApprovals } from "@/app/(dashboard)/d/_actions/documents";

interface PendingApproval {
  id: string;
  visit_id: string | null;
  template_key: string;
  display_name: string;
  patient_name: string;
  creator_name: string;
  created_at: string;
}

function ShimmerRow() {
  return (
    <div className="flex items-center justify-between py-3 animate-pulse">
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-40 rounded bg-gray-100" />
        <div className="h-3 w-28 rounded bg-gray-100" />
      </div>
      <div className="h-8 w-16 rounded-lg bg-gray-100" />
    </div>
  );
}

export default function PendingDocumentApprovals({
  onReview,
}: {
  onReview: (approval: PendingApproval) => void;
}) {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);

  const loadApprovals = useCallback(async () => {
    const result = await fetchPendingDocumentApprovals();
    if (result.success) {
      setApprovals((result.approvals as PendingApproval[]) ?? []);
    }
    setLoading(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    loadApprovals();
  }, [loadApprovals]);

  // Poll every 15s
  useEffect(() => {
    const interval = setInterval(() => {
      loadApprovals();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadApprovals]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-36 rounded bg-gray-100 animate-pulse" />
          <div className="h-5 w-5 rounded-full bg-gray-100 animate-pulse" />
        </div>
        <div className="divide-y divide-gray-100">
          <ShimmerRow />
          <ShimmerRow />
        </div>
      </div>
    );
  }

  // If empty, render nothing — parent conditionally shows this component
  if (approvals.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      {/* Header with count badge */}
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-ink">
          Documents Awaiting Signature
        </h3>
        <span className="inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold min-w-[20px] h-5 px-1.5">
          {approvals.length}
        </span>
      </div>

      {/* Approval list */}
      <div className="divide-y divide-gray-100">
        {approvals.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 flex-1 mr-3">
              <p className="text-sm font-medium text-ink truncate">
                {item.display_name || item.template_key}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate truncate">
                  {item.patient_name}
                </span>
                {item.creator_name && (
                  <>
                    <span className="text-xs text-ash">from</span>
                    <span className="text-xs text-slate truncate">
                      {item.creator_name}
                    </span>
                  </>
                )}
                <span className="text-xs text-ash">
                  {new Date(item.created_at).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
            <button
              onClick={() => onReview(item)}
              className="rounded-lg bg-hilt-blue px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors flex-shrink-0"
            >
              Review
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
