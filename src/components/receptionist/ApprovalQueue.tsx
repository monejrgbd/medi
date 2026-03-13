"use client";

import { useState, useEffect, useRef } from "react";
import ApprovalCard from "./ApprovalCard";
import CollisionResolutionDialog from "./CollisionResolutionDialog";
import {
  approvePatient,
  denyPatient,
  verifyPhonePrompt,
  confirmReturning,
} from "@/app/(dashboard)/d/_actions/receptionist";
import { linkReferralToVisit } from "@/app/(dashboard)/d/_actions/referral";
import ReferralAutoMatch from "./ReferralAutoMatch";

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
  active_follow_ups: {
    id: string;
    doctor_name: string;
    due_date: string;
    ai_instructions_preview: string | null;
    visit_id: string;
    visit_date: string;
    visit_summary_preview: string | null;
  }[];
  referral_match?: {
    referral_id: string;
    specialty: string;
    from_org_name: string;
    from_doctor_name: string;
  } | null;
}

interface ApprovalQueueProps {
  pending: PendingVisit[];
  orgId: string;
  onActionComplete: (visitId: string, action: "approve" | "deny") => void;
}

export default function ApprovalQueue({
  pending,
  orgId,
  onActionComplete,
}: ApprovalQueueProps) {
  const [actionState, setActionState] = useState<
    Record<string, "approving" | "denying" | "verifying" | "confirming">
  >({});
  const [error, setError] = useState<string | null>(null);
  const [collisionDialogVisitId, setCollisionDialogVisitId] = useState<string | null>(null);
  const [referralMatchPending, setReferralMatchPending] = useState<{
    visitId: string;
    referralMatch: { referral_id: string; specialty: string; from_org_name: string; from_doctor_name: string };
  } | null>(null);

  // Track previous pending state for auto-triggering collision dialog
  const prevPendingRef = useRef<Record<string, boolean>>({});

  // Detect phone verification transitions (pending=true -> pending=false + collision=true)
  useEffect(() => {
    for (const visit of pending) {
      const wasPending = prevPendingRef.current[visit.visit_id];
      const isPending = visit.phone_verification_pending;
      if (wasPending && !isPending && visit.collision_flag && visit.phone_verified) {
        if (!collisionDialogVisitId) {
          setCollisionDialogVisitId(visit.visit_id);
        }
      }
    }
    // Update ref
    const map: Record<string, boolean> = {};
    for (const visit of pending) {
      map[visit.visit_id] = !!visit.phone_verification_pending;
    }
    prevPendingRef.current = map;
  }, [pending, collisionDialogVisitId]);

  async function handleApprove(visitId: string, followUpInfo?: { followUpOfVisitId: string; followUpId: string }) {
    // Check if visit has referral match — show dialog before approving
    const visit = pending.find((v) => v.visit_id === visitId);
    if (visit?.referral_match && !followUpInfo) {
      setReferralMatchPending({ visitId, referralMatch: visit.referral_match });
      return;
    }

    setError(null);
    setActionState((prev) => ({ ...prev, [visitId]: "approving" }));
    const result = await approvePatient(visitId, followUpInfo);
    setActionState((prev) => {
      const next = { ...prev };
      delete next[visitId];
      return next;
    });
    if (result.success) {
      // If there was a confirmed referral link, do it now
      if (visit?.referral_match && referralMatchPending) {
        await linkReferralToVisit(visit.referral_match.referral_id, visitId);
      }
      onActionComplete(visitId, "approve");
    } else {
      setError(result.error ?? "Failed to approve patient.");
    }
  }

  async function handleReferralLinkConfirm() {
    if (!referralMatchPending) return;
    const { visitId, referralMatch } = referralMatchPending;
    setReferralMatchPending(null);

    setError(null);
    setActionState((prev) => ({ ...prev, [visitId]: "approving" }));
    const result = await approvePatient(visitId);
    setActionState((prev) => {
      const next = { ...prev };
      delete next[visitId];
      return next;
    });
    if (result.success) {
      await linkReferralToVisit(referralMatch.referral_id, visitId);
      onActionComplete(visitId, "approve");
    } else {
      setError(result.error ?? "Failed to approve patient.");
    }
  }

  async function handleReferralLinkDismiss() {
    if (!referralMatchPending) return;
    const { visitId } = referralMatchPending;
    setReferralMatchPending(null);

    // Approve without linking
    setError(null);
    setActionState((prev) => ({ ...prev, [visitId]: "approving" }));
    const result = await approvePatient(visitId);
    setActionState((prev) => {
      const next = { ...prev };
      delete next[visitId];
      return next;
    });
    if (result.success) {
      onActionComplete(visitId, "approve");
    } else {
      setError(result.error ?? "Failed to approve patient.");
    }
  }

  async function handleDeny(visitId: string) {
    setError(null);
    setActionState((prev) => ({ ...prev, [visitId]: "denying" }));
    const result = await denyPatient(visitId);
    setActionState((prev) => {
      const next = { ...prev };
      delete next[visitId];
      return next;
    });
    if (result.success) {
      onActionComplete(visitId, "deny");
    } else {
      setError(result.error ?? "Failed to deny patient.");
    }
  }

  async function handleVerifyPhone(visitId: string) {
    setError(null);
    setActionState((prev) => ({ ...prev, [visitId]: "verifying" }));
    const result = await verifyPhonePrompt(visitId);
    setActionState((prev) => {
      const next = { ...prev };
      delete next[visitId];
      return next;
    });
    if (!result.success) {
      setError(result.error ?? "Failed to trigger phone verification.");
    }
  }

  async function handleConfirmReturning(visitId: string) {
    setError(null);
    setActionState((prev) => ({ ...prev, [visitId]: "confirming" }));
    const result = await confirmReturning(visitId);
    setActionState((prev) => {
      const next = { ...prev };
      delete next[visitId];
      return next;
    });
    if (result.success) {
      onActionComplete(visitId, "approve");
    } else {
      setError(result.error ?? "Failed to confirm returning patient.");
    }
  }

  function handleCollisionResolved() {
    if (collisionDialogVisitId) {
      onActionComplete(collisionDialogVisitId, "approve");
    }
    setCollisionDialogVisitId(null);
  }

  if (pending.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-ash">No patients awaiting approval.</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {pending.map((visit) => (
        <ApprovalCard
          key={visit.visit_id}
          visit={visit}
          orgId={orgId}
          onApprove={handleApprove}
          onDeny={handleDeny}
          onVerifyPhone={handleVerifyPhone}
          onConfirmReturning={handleConfirmReturning}
          approving={actionState[visit.visit_id] === "approving"}
          denying={actionState[visit.visit_id] === "denying"}
          verifying={actionState[visit.visit_id] === "verifying"}
          confirming={actionState[visit.visit_id] === "confirming"}
        />
      ))}
      </div>

      {/* Collision resolution dialog */}
      {collisionDialogVisitId && (
        <CollisionResolutionDialog
          visitId={collisionDialogVisitId}
          onResolved={handleCollisionResolved}
          onCancel={() => setCollisionDialogVisitId(null)}
        />
      )}

      {/* Referral auto-match dialog */}
      {referralMatchPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <ReferralAutoMatch
              referralMatch={referralMatchPending.referralMatch}
              onConfirm={handleReferralLinkConfirm}
              onDismiss={handleReferralLinkDismiss}
            />
          </div>
        </div>
      )}
    </div>
  );
}
