"use client";

import NurseClaimButton from "./NurseClaimButton";
import type { QueueVisit } from "@/app/(dashboard)/d/nurse/NurseDashboard";

interface NurseQueueListProps {
  queue: QueueVisit[];
  onClaimed: () => void;
  demoMode?: boolean;
}

function PriorityBadge({ priority }: { priority: number }) {
  if (priority === 3) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        High
      </span>
    );
  }
  if (priority === 2) {
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
        Medium
      </span>
    );
  }
  return null;
}

export default function NurseQueueList({ queue, onClaimed, demoMode = false }: NurseQueueListProps) {
  if (queue.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
        <svg className="mx-auto mb-3 h-10 w-10 text-ash" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <p className="text-sm font-medium text-slate">No patients in queue</p>
        <p className="mt-1 text-xs text-ash">Patients will appear here when they check in and complete the AI conversation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {queue.map((visit) => {
        const waitMinutes = Math.floor(visit.wait_seconds / 60);
        const isHighPriority = visit.priority === 3;

        return (
          <div
            key={visit.visit_id}
            className={`rounded-xl border bg-white p-4 transition-all ${
              isHighPriority
                ? "border-l-4 border-l-red-500 border-t border-r border-b border-gray-200"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-ink">
                    {visit.first_name} {visit.last_name}
                  </h3>
                  <PriorityBadge priority={visit.priority} />
                  {visit.has_previous_visits && (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                      Returning
                    </span>
                  )}
                  {visit.nurse_reviewed && (
                    <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-600">
                      Nurse reviewed
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-3 text-xs text-slate">
                  {visit.sex && <span className="capitalize">{visit.sex}</span>}
                  <span>Waiting {waitMinutes} min</span>
                  {visit.is_sensitive && (
                    <span className="text-amber-600" title="Sensitive content flagged">
                      Sensitive
                    </span>
                  )}
                  {visit.timeout_flagged && (
                    <span className="text-amber-600" title="AI conversation timed out">
                      Timed out
                    </span>
                  )}
                </div>
              </div>

              <NurseClaimButton visitId={visit.visit_id} onClaimed={onClaimed} demoMode={demoMode} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
