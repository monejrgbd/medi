"use client";

import ClaimButton from "./ClaimButton";
import type { QueueVisit } from "@/app/(dashboard)/d/doctor/DoctorDashboard";

interface PatientQueueCardProps {
  visit: QueueVisit;
  onClaimed: () => void;
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

export default function PatientQueueCard({
  visit,
  onClaimed,
}: PatientQueueCardProps) {
  const waitMinutes = Math.floor(visit.wait_seconds / 60);
  const isHighPriority = visit.priority === 3;

  return (
    <div
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
          </div>

          <div className="mt-1 flex items-center gap-3 text-xs text-slate">
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

        <ClaimButton visitId={visit.visit_id} onClaimed={onClaimed} />
      </div>
    </div>
  );
}
