"use client";

import { useState } from "react";
import ApprovalCard from "./ApprovalCard";
import {
  approvePatient,
  denyPatient,
  setVisitAiOverride,
  skipAiToQueue,
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
  phone_verified?: boolean;
  phone_masked?: string | null;
  phone_verification_pending?: boolean;
  active_follow_ups: {
    id: string;
    doctor_name: string;
    due_at: string;
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
  self_reported_referral?: boolean;
  self_reported_referrer?: string | null;
}

interface ApprovalQueueProps {
  pending: PendingVisit[];
  orgId: string;
  subscriptionPlan?: string;
  onActionComplete: (visitId: string, action: "approve" | "deny") => void;
  aiAutoSkipped?: boolean;
  demoMode?: boolean;
}

export default function ApprovalQueue({
  pending,
  orgId,
  subscriptionPlan,
  onActionComplete,
  aiAutoSkipped,
  demoMode = false,
}: ApprovalQueueProps) {
  type AiConfig = "standard" | "skip" | "premium";

  const [actionState, setActionState] = useState<
    Record<string, "approving" | "denying">
  >({});

  const hasPremiumAi = ["starter", "professional", "business", "enterprise"].includes(subscriptionPlan || "");
  const [error, setError] = useState<string | null>(null);
  const [referralMatchPending, setReferralMatchPending] = useState<{
    visitId: string;
    referralMatch: { referral_id: string; specialty: string; from_org_name: string; from_doctor_name: string };
  } | null>(null);

  async function handleApprove(visitId: string, followUpInfo?: { followUpOfVisitId: string; followUpId: string }, aiConfig?: AiConfig) {
    // Check if visit has referral match — show dialog before approving
    const visit = pending.find((v) => v.visit_id === visitId);
    if (visit?.referral_match && !followUpInfo) {
      setReferralMatchPending({ visitId, referralMatch: visit.referral_match });
      return;
    }

    setError(null);
    setActionState((prev) => ({ ...prev, [visitId]: "approving" }));

    const effectiveAiConfig = aiConfig ?? "standard";

    // Skip AI: bypass AI conversation entirely
    if (effectiveAiConfig === "skip") {
      const result = await skipAiToQueue(visitId);
      setActionState((prev) => { const next = { ...prev }; delete next[visitId]; return next; });
      if (result.success) {
        onActionComplete(visitId, "approve");
      } else {
        setError(result.error ?? "Failed to skip AI.");
      }
      return;
    }

    // Premium AI: set override before approval
    if (effectiveAiConfig === "premium") {
      if (demoMode) {
        setActionState((prev) => { const next = { ...prev }; delete next[visitId]; return next; });
        setError("Premium AI is not available in the demo. Please select Standard AI or Skip AI.");
        return;
      }
      const overrideResult = await setVisitAiOverride(visitId, "advanced");
      if (!overrideResult?.success) {
        setActionState((prev) => { const next = { ...prev }; delete next[visitId]; return next; });
        setError(overrideResult?.error ?? "Premium AI not available. Budget may be exhausted.");
        return;
      }
    }

    const result = await approvePatient(visitId, followUpInfo);
    setActionState((prev) => {
      const next = { ...prev };
      delete next[visitId];
      return next;
    });
    if (result.success) {
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

  if (pending.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
        <svg className="mx-auto mb-3 h-10 w-10 text-ash" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" />
        </svg>
        <p className="text-sm font-medium text-slate">No patients awaiting approval</p>
        <p className="mt-1 text-xs text-ash">New patient check-ins will appear here for your review.</p>
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
          approving={actionState[visit.visit_id] === "approving"}
          denying={actionState[visit.visit_id] === "denying"}
          aiAutoSkipped={aiAutoSkipped}
          hasPremiumAi={hasPremiumAi}
        />
      ))}
      </div>

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
