"use client";

import ClaimButton from "./ClaimButton";
import type { QueueVisit } from "@/app/(dashboard)/d/doctor/DoctorDashboard";
import { formatQueueNumber } from "@/lib/queueUtils";

interface PatientQueueCardProps {
  visit: QueueVisit;
  onClaimed: (visitId: string) => void;
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

export default function PatientQueueCard({
  visit,
  onClaimed,
  demoMode = false,
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
            {visit.queue_number != null && (
              <span className="inline-flex items-center justify-center rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-600 tabular-nums">
                #{formatQueueNumber(visit.queue_number, "fifo")}
              </span>
            )}
            <h3 className="font-semibold text-ink">
              {visit.first_name} {visit.last_name}
            </h3>
            <PriorityBadge priority={visit.priority} />
            {visit.nurse_reviewed && (
              <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-600">
                Nurse Reviewed
              </span>
            )}
            {visit.has_previous_visits && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                Returning
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

        <ClaimButton visitId={visit.visit_id} onClaimed={onClaimed} demoMode={demoMode} />
      </div>
    </div>
  );
}
