"use client";

import { useState, useEffect } from "react";
import { fetchPatientHistory } from "@/app/(dashboard)/d/_actions/doctor";

interface HistoryVisit {
  visit_id: string;
  date: string;
  location_name: string;
  summary: string | null;
  diagnosis: string | null;
  doctor_name: string | null;
  status: string;
}

interface VisitHistoryAccordionProps {
  patientId: string;
}

export default function VisitHistoryAccordion({
  patientId,
}: VisitHistoryAccordionProps) {
  const [visits, setVisits] = useState<HistoryVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const result = await fetchPatientHistory(patientId);
      if (result.success) {
        setVisits(result.visits ?? []);
        setHasMore(result.has_more ?? false);
        setNextCursor(result.next_cursor ?? null);
      }
      setLoading(false);
    })();
  }, [patientId]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);

    const result = await fetchPatientHistory(patientId, nextCursor);
    if (result.success) {
      setVisits((prev) => [...prev, ...(result.visits ?? [])]);
      setHasMore(result.has_more ?? false);
      setNextCursor(result.next_cursor ?? null);
    }
    setLoadingMore(false);
  }

  if (loading) {
    return (
      <p className="text-sm text-slate text-center py-8">
        Loading history...
      </p>
    );
  }

  if (visits.length === 0) {
    return (
      <p className="text-sm text-slate text-center py-8">
        No past visits found.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {visits.map((v) => (
        <div
          key={v.visit_id}
          className="rounded-lg border border-gray-200 bg-white overflow-hidden"
        >
          <button
            onClick={() =>
              setExpandedId(expandedId === v.visit_id ? null : v.visit_id)
            }
            className="w-full px-4 py-3 text-left flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium text-ink">
                {new Date(v.date).toLocaleDateString()} &middot;{" "}
                {v.location_name}
              </p>
              <p className="text-xs text-slate">
                {v.doctor_name || "—"} &middot;{" "}
                {v.status === "completed" ? "Completed" : v.status}
              </p>
            </div>
            <span className="text-xs text-slate">
              {expandedId === v.visit_id ? "−" : "+"}
            </span>
          </button>

          {expandedId === v.visit_id && (
            <div className="border-t border-gray-100 px-4 py-3 space-y-2">
              {v.summary && (
                <div>
                  <p className="text-xs font-medium text-slate">Summary</p>
                  <p className="text-sm text-ink">{v.summary}</p>
                </div>
              )}
              {v.diagnosis && (
                <div>
                  <p className="text-xs font-medium text-slate">Diagnosis</p>
                  <p className="text-sm text-ink">{v.diagnosis}</p>
                </div>
              )}
              {!v.summary && !v.diagnosis && (
                <p className="text-xs text-ash">No details available.</p>
              )}
            </div>
          )}
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
