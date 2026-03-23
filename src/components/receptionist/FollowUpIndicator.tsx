"use client";

import { useState } from "react";
import { markFollowUpCompleted } from "@/app/(dashboard)/d/_actions/receptionist";
import { toast } from "sonner";

interface FollowUp {
  id: string;
  doctor_name: string;
  due_at: string | null;
  ai_instructions_preview: string | null;
  visit_id: string;
  visit_date: string;
  visit_summary_preview: string | null;
}

interface FollowUpIndicatorProps {
  followUps: FollowUp[];
}

export default function FollowUpIndicator({ followUps }: FollowUpIndicatorProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());

  if (followUps.length === 0) return null;

  async function handleConfirm(followUpId: string) {
    setConfirming(followUpId);
    const result = await markFollowUpCompleted(followUpId);
    setConfirming(null);
    if (result.success) {
      setConfirmed((prev) => new Set(prev).add(followUpId));
      toast.success("Follow up confirmed");
    } else {
      toast.error(result.error || "Failed to confirm follow up");
    }
  }

  const activeFollowUps = followUps.filter((fu) => !confirmed.has(fu.id));

  if (activeFollowUps.length === 0) return null;

  if (activeFollowUps.length === 1) {
    const fu = activeFollowUps[0];
    return (
      <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 mb-3">
        <p className="text-xs font-medium text-blue-800">
          Follow up from Dr. {fu.doctor_name}
          <span className="font-normal text-blue-600"> ({new Date(fu.visit_date).toLocaleDateString()})</span>
        </p>
        {fu.ai_instructions_preview && (
          <p className="text-xs text-blue-700 mt-1">
            &quot;{fu.ai_instructions_preview}&quot;
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => handleConfirm(fu.id)}
            disabled={confirming === fu.id}
            className="rounded-lg bg-hilt-blue px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {confirming === fu.id ? "Confirming..." : "Confirm follow up"}
          </button>
          <span className="text-[10px] text-slate">
            Confirm with the patient this is a follow up for the above.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 mb-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <p className="text-xs font-medium text-blue-800">
          {activeFollowUps.length} active follow ups
          <span className="ml-1 text-blue-600">{expanded ? "\u25B2" : "\u25BC"}</span>
        </p>
      </button>
      {expanded && (
        <div className="mt-2 space-y-2">
          {activeFollowUps.map((fu) => (
            <div key={fu.id} className="text-xs text-blue-700 rounded-lg bg-white/50 p-2">
              <span className="font-medium">Dr. {fu.doctor_name}</span>
              <span className="text-blue-600"> ({new Date(fu.visit_date).toLocaleDateString()})</span>
              {fu.ai_instructions_preview && (
                <p className="text-blue-700 mt-0.5">&quot;{fu.ai_instructions_preview}&quot;</p>
              )}
              <button
                onClick={() => handleConfirm(fu.id)}
                disabled={confirming === fu.id}
                className="mt-1.5 rounded-lg bg-hilt-blue px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {confirming === fu.id ? "Confirming..." : "Confirm this follow up"}
              </button>
            </div>
          ))}
          <p className="text-[10px] text-slate mt-1">
            Confirm with the patient which follow up this visit is for.
          </p>
        </div>
      )}
    </div>
  );
}
