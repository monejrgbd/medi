"use client";

import { useState } from "react";

interface FollowUp {
  id: string;
  doctor_name: string;
  due_at: string;
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

  if (followUps.length === 0) return null;

  if (followUps.length === 1) {
    const fu = followUps[0];
    return (
      <div className="rounded-lg bg-blue-50 px-3 py-2 mb-3">
        <p className="text-xs font-medium text-blue-800">
          Follow-up from Dr. {fu.doctor_name}
        </p>
        <p className="text-[10px] text-blue-600">
          Due: {new Date(fu.due_at).toLocaleDateString()}
          {fu.ai_instructions_preview && ` \u2014 "${fu.ai_instructions_preview}"`}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-blue-50 px-3 py-2 mb-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <p className="text-xs font-medium text-blue-800">
          {followUps.length} active follow-ups
          <span className="ml-1 text-blue-600">{expanded ? "\u25B2" : "\u25BC"}</span>
        </p>
      </button>
      {expanded && (
        <div className="mt-2 space-y-1.5">
          {followUps.map((fu) => (
            <div key={fu.id} className="text-[10px] text-blue-700">
              <span className="font-medium">Dr. {fu.doctor_name}</span> &mdash; Due:{" "}
              {new Date(fu.due_at).toLocaleDateString()}
              {fu.ai_instructions_preview && (
                <span className="text-blue-600"> &mdash; &quot;{fu.ai_instructions_preview}&quot;</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
