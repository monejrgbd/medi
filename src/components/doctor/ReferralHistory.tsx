"use client";

import { useState, useEffect } from "react";
import { fetchReferralHistory } from "@/app/(dashboard)/d/_actions/referral";
import ReferralStatusTracker from "./ReferralStatusTracker";

interface Referral {
  id: string;
  patient_name: string;
  specialty: string;
  status: string;
  destination: string;
  created_at: string;
}

function StatusBadge({ status }: { status: string }) {
  let className: string;

  switch (status) {
    case "sent":
      className =
        "bg-blue-100 text-blue-700";
      break;
    case "viewed":
      className =
        "bg-gray-100 text-gray-600";
      break;
    case "patient_arrived":
      className =
        "bg-green-100 text-green-700";
      break;
    case "completed":
      className =
        "bg-green-200 text-green-800";
      break;
    case "expired":
      className =
        "bg-red-100 text-red-700";
      break;
    default:
      className =
        "bg-gray-100 text-gray-600";
  }

  const label =
    status === "patient_arrived"
      ? "Arrived"
      : status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

export default function ReferralHistory() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    (async () => {
      const result = await fetchReferralHistory();
      if (result.success) {
        const items = result.referrals ?? [];
        setReferrals(items);
        setHasMore(result.has_more ?? false);
        if (items.length > 0) setCursor(items[items.length - 1].created_at);
      }
      setLoading(false);
    })();
  }, []);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);

    const result = await fetchReferralHistory(cursor);
    if (result.success) {
      const items = result.referrals ?? [];
      setReferrals((prev) => [...prev, ...items]);
      setHasMore(result.has_more ?? false);
      if (items.length > 0) setCursor(items[items.length - 1].created_at);
    }
    setLoadingMore(false);
  }

  if (loading) {
    return (
      <p className="text-sm text-slate text-center py-8">
        Loading referrals...
      </p>
    );
  }

  if (referrals.length === 0) {
    return (
      <p className="text-sm text-slate text-center py-8">
        No referrals sent yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {referrals.map((r) => (
        <div
          key={r.id}
          className="rounded-xl border border-gray-200 bg-white p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-ink">
                  {r.patient_name}
                </h3>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                  {r.specialty}
                </span>
                <StatusBadge status={r.status} />
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-slate">
                <span>{r.destination}</span>
                <span>
                  {new Date(r.created_at).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 px-2">
            <ReferralStatusTracker status={r.status} />
          </div>
        </div>
      ))}

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-slate hover:bg-gray-50 disabled:opacity-50"
        >
          {loadingMore ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
