"use client";

import { useState } from "react";
import { fetchSimilarPatients } from "@/app/(dashboard)/d/_actions/receptionist";
import FollowUpIndicator from "./FollowUpIndicator";

interface FollowUpInfo {
  id: string;
  doctor_name: string;
  due_date: string;
  ai_instructions_preview: string | null;
  visit_id: string;
  visit_date: string;
  visit_summary_preview: string | null;
}

interface ReferralMatch {
  referral_id: string;
  specialty: string;
  from_org_name: string;
  from_doctor_name: string;
}

interface PendingVisit {
  visit_id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  birthday: string;
  created_at: string;
  has_previous_visits: boolean;
  match_type: string;
  collision_flag?: boolean;
  phone_verified?: boolean;
  phone_masked?: string | null;
  phone_verification_pending?: boolean;
  active_follow_ups: FollowUpInfo[];
  referral_match?: ReferralMatch | null;
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
  onApprove: (visitId: string, followUpInfo?: { followUpOfVisitId: string; followUpId: string }) => void;
  onDeny: (visitId: string) => void;
  onVerifyPhone?: (visitId: string) => void;
  onConfirmReturning?: (visitId: string) => void;
  onCollisionResolved?: (visitId: string) => void;
  approving: boolean;
  denying: boolean;
  verifying?: boolean;
  confirming?: boolean;
  showCollisionDialog?: boolean;
}

export default function ApprovalCard({
  visit,
  orgId,
  onApprove,
  onDeny,
  onVerifyPhone,
  onConfirmReturning,
  approving,
  denying,
  verifying,
  confirming,
  showCollisionDialog,
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
      setSimilarPatients(
        result.patients.filter(
          (p: SimilarPatient) => p.patient_id !== visit.patient_id
        )
      );
    }
    setLoadingSimilar(false);
  }

  const isReturning = visit.match_type === "returning";
  const busy = approving || denying || !!verifying || !!confirming;
  const isPending = visit.phone_verification_pending;
  const isCollision = visit.collision_flag;
  const isPhoneVerified = visit.phone_verified;

  // Determine badge
  let badgeLabel = isReturning ? "RETURNING" : "NEW";
  let badgeClass = isReturning
    ? "bg-blue-100 text-blue-800"
    : "bg-green-100 text-green-800";

  if (isCollision && isPhoneVerified) {
    badgeLabel = "VERIFIED RETURNING";
    badgeClass = "bg-green-100 text-green-800";
  } else if (isCollision && !isPhoneVerified && !isPending) {
    badgeLabel = "NEEDS VERIFICATION";
    badgeClass = "bg-amber-100 text-amber-800";
  } else if (isPending) {
    badgeLabel = "VERIFYING...";
    badgeClass = "bg-blue-100 text-blue-800";
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-ink">
              {visit.first_name} {visit.last_name}
            </h3>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}
            >
              {badgeLabel}
            </span>
          </div>
          <p className="text-sm text-slate">DOB: {visit.birthday}</p>
          {visit.phone_masked && (
            <p className="text-xs text-ash mt-0.5">Phone: {visit.phone_masked}</p>
          )}
        </div>
        <p className="text-xs text-ash">
          {new Date(visit.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* Pending verification spinner */}
      {isPending && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-hilt-blue" />
          <span className="text-xs text-blue-700">Waiting for phone verification...</span>
        </div>
      )}

      {!isReturning && !isCollision && (
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

      {/* Follow-up indicator */}
      <FollowUpIndicator followUps={visit.active_follow_ups || []} />

      {/* Referral match indicator */}
      {visit.referral_match && (
        <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-2.5">
          <p className="text-xs font-medium text-blue-800">
            Referral from {visit.referral_match.from_org_name} ({visit.referral_match.specialty})
          </p>
          <p className="text-xs text-blue-600">
            Dr. {visit.referral_match.from_doctor_name}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {/* Primary action buttons */}
        {isCollision && !isPhoneVerified && !isPending ? (
          // Collision, not verified, not pending: show verify + confirm returning
          <>
            {onVerifyPhone && (
              <button
                onClick={() => onVerifyPhone(visit.visit_id)}
                disabled={busy}
                className="w-full rounded-lg bg-hilt-blue px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {verifying ? "Sending..." : "Verify Phone"}
              </button>
            )}
            <div className="flex gap-2">
              {onConfirmReturning && (
                <button
                  onClick={() => onConfirmReturning(visit.visit_id)}
                  disabled={busy}
                  className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  {confirming ? "Confirming..." : "Confirm Returning"}
                </button>
              )}
              <button
                onClick={() => onDeny(visit.visit_id)}
                disabled={busy}
                className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                {denying ? "Denying..." : "Deny"}
              </button>
            </div>
          </>
        ) : isPending ? (
          // Pending verification: limited buttons
          <div className="flex gap-2">
            {onConfirmReturning && (
              <button
                onClick={() => onConfirmReturning(visit.visit_id)}
                disabled={busy}
                className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                {confirming ? "Confirming..." : "Confirm Returning"}
              </button>
            )}
            <button
              onClick={() => onDeny(visit.visit_id)}
              disabled={busy}
              className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              Mark Left
            </button>
          </div>
        ) : (visit.active_follow_ups || []).length > 0 && !isCollision ? (
          // Has follow-ups: show follow-up buttons + new visit button
          <>
            {visit.active_follow_ups.map((fu) => (
              <button
                key={fu.id}
                onClick={() => onApprove(visit.visit_id, { followUpOfVisitId: fu.visit_id, followUpId: fu.id })}
                disabled={busy}
                className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {approving ? "Approving..." : `Follow-up (Dr. ${fu.doctor_name})`}
              </button>
            ))}
            <div className="flex gap-2">
              <button
                onClick={() => onApprove(visit.visit_id)}
                disabled={busy}
                className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                {approving ? "Approving..." : "New Visit"}
              </button>
              <button
                onClick={() => onDeny(visit.visit_id)}
                disabled={busy}
                className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                {denying ? "Denying..." : "Deny"}
              </button>
            </div>
          </>
        ) : (
          // Default: standard approve/deny + optional verify phone
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
        )}

        {/* Secondary verify phone button for returning non-flagged patients */}
        {isReturning && !isCollision && !isPending && !isPhoneVerified && onVerifyPhone && (
          <button
            onClick={() => onVerifyPhone(visit.visit_id)}
            disabled={busy}
            className="w-full rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
          >
            Verify Phone
          </button>
        )}
      </div>
    </div>
  );
}
