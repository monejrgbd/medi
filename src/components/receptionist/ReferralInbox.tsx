"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchReferralInbox,
  searchReferralInbox,
} from "@/app/(dashboard)/d/_actions/referral";
import ReferralDetail from "./ReferralDetail";

interface ReferralItem {
  id: string;
  patient_name: string;
  specialty: string;
  status: string;
  from_org_name: string;
  from_doctor_name: string;
  created_at: string;
}

interface ReferralInboxProps {
  locationId: string;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  sent: { label: "Sent", className: "bg-blue-100 text-blue-800" },
  viewed: { label: "Viewed", className: "bg-gray-100 text-gray-700" },
  patient_arrived: {
    label: "Patient Arrived",
    className: "bg-green-100 text-green-800",
  },
  completed: {
    label: "Completed",
    className: "bg-green-200 text-green-900",
  },
  expired: { label: "Expired", className: "bg-red-100 text-red-700" },
};

export default function ReferralInbox({ locationId }: ReferralInboxProps) {
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadInbox = useCallback(async () => {
    setLoading(true);
    const result = await fetchReferralInbox(locationId);
    if (result.success) {
      setReferrals(result.referrals ?? []);
      setHasMore(result.has_more ?? false);
    }
    setLoading(false);
  }, [locationId]);

  useEffect(() => {
    loadInbox();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [loadInbox]);

  async function handleLoadMore() {
    if (referrals.length === 0 || loadingMore) return;
    setLoadingMore(true);
    const lastReferral = referrals[referrals.length - 1];
    const result = await fetchReferralInbox(
      locationId,
      lastReferral.created_at
    );
    if (result.success) {
      setReferrals((prev) => [...prev, ...(result.referrals ?? [])]);
      setHasMore(result.has_more ?? false);
    }
    setLoadingMore(false);
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length === 0) {
      setIsSearchActive(false);
      loadInbox();
      return;
    }

    if (value.trim().length < 3) return;

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setIsSearchActive(true);
      const result = await searchReferralInbox(locationId, value.trim());
      if (result.success) {
        setReferrals(result.referrals ?? []);
        setHasMore(false);
      }
      setIsSearching(false);
    }, 300);
  }

  function handleToggle(referralId: string) {
    setExpandedId((prev) => (prev === referralId ? null : referralId));
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-ash">Loading referrals...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by patient name..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-ink placeholder:text-ash focus:border-hilt-blue focus:ring-1 focus:ring-hilt-blue"
        />
        {isSearching && (
          <p className="text-xs text-ash mt-1">Searching...</p>
        )}
      </div>

      {/* Referral list */}
      {referrals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-ash">
            {isSearchActive ? "No referrals matched your search." : "No referrals received."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {referrals.map((referral) => {
            const badge = STATUS_BADGE[referral.status] ?? {
              label: referral.status,
              className: "bg-gray-100 text-gray-700",
            };
            const isExpanded = expandedId === referral.id;

            return (
              <div
                key={referral.id}
                className="rounded-xl border border-gray-200 bg-white"
              >
                <button
                  onClick={() => handleToggle(referral.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-ink truncate">
                          {referral.patient_name}
                        </h3>
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        <span className="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                          {referral.specialty}
                        </span>
                      </div>
                      <p className="text-sm text-slate">
                        From {referral.from_org_name} — Dr.{" "}
                        {referral.from_doctor_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="text-xs text-ash">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                      <svg
                        className={`h-4 w-4 text-ash transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                    <ReferralDetail
                      referralId={referral.id}
                      locationId={locationId}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {hasMore && !isSearchActive && (
        <div className="mt-4 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
