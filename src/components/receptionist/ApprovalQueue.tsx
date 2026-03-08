"use client";

import { useState } from "react";
import ApprovalCard from "./ApprovalCard";
import {
  approvePatient,
  denyPatient,
} from "@/app/(dashboard)/d/_actions/receptionist";

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
    Record<string, "approving" | "denying">
  >({});
  const [error, setError] = useState<string | null>(null);

  async function handleApprove(visitId: string) {
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
          approving={actionState[visit.visit_id] === "approving"}
          denying={actionState[visit.visit_id] === "denying"}
        />
      ))}
      </div>
    </div>
  );
}
