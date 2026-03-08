"use client";

import { useState } from "react";
import { fetchSimilarPatients } from "@/app/(dashboard)/d/_actions/receptionist";

interface PendingVisit {
  visit_id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  birthday: string;
  created_at: string;
  has_previous_visits: boolean;
  match_type: string;
}

interface SimilarPatient {
  patient_id: string;
  first_name: string;
  last_name: string;
  birthday: string;
  similarity_score: number;
}

interface ApprovalCardProps {
  visit: PendingVisit;
  orgId: string;
  onApprove: (visitId: string) => void;
  onDeny: (visitId: string) => void;
  approving: boolean;
  denying: boolean;
}

export default function ApprovalCard({
  visit,
  orgId,
  onApprove,
  onDeny,
  approving,
  denying,
}: ApprovalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [similarPatients, setSimilarPatients] = useState<SimilarPatient[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  async function handleExpand() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (similarPatients.length > 0) return;

    setLoadingSimilar(true);
    const result = await fetchSimilarPatients(
      orgId,
      visit.first_name,
      visit.last_name,
      visit.birthday
    );
    if (result.success && result.patients) {
      // Filter out self
      setSimilarPatients(
        result.patients.filter(
          (p: SimilarPatient) => p.patient_id !== visit.patient_id
        )
      );
    }
    setLoadingSimilar(false);
  }

  const isReturning = visit.match_type === "returning";
  const busy = approving || denying;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-ink">
              {visit.first_name} {visit.last_name}
            </h3>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                isReturning
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {isReturning ? "RETURNING" : "NEW"}
            </span>
          </div>
          <p className="text-sm text-slate">DOB: {visit.birthday}</p>
        </div>
        <p className="text-xs text-ash">
          {new Date(visit.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {!isReturning && (
        <button
          onClick={handleExpand}
          className="mb-3 text-xs text-hilt-blue hover:underline"
        >
          {expanded ? "Hide" : "Show"} similar patients
        </button>
      )}

      {expanded && (
        <div className="mb-3 rounded-lg bg-gray-50 p-3">
          {loadingSimilar ? (
            <p className="text-xs text-ash">Loading...</p>
          ) : similarPatients.length === 0 ? (
            <p className="text-xs text-ash">No similar patients found.</p>
          ) : (
            <div className="space-y-1">
              <p className="text-xs font-medium text-ink mb-1">
                Similar patients in system:
              </p>
              {similarPatients.map((p) => (
                <div
                  key={p.patient_id}
                  className="flex justify-between text-xs text-slate"
                >
                  <span>
                    {p.first_name} {p.last_name} — {p.birthday}
                  </span>
                  <span className="text-ash">
                    {Math.round(p.similarity_score * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onApprove(visit.visit_id)}
          disabled={busy}
          className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
        >
          {approving ? "Approving..." : "Approve"}
        </button>
        <button
          onClick={() => onDeny(visit.visit_id)}
          disabled={busy}
          className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
        >
          {denying ? "Denying..." : "Deny"}
        </button>
      </div>
    </div>
  );
}
