"use client";

import type { CompletedVisit } from "@/app/(dashboard)/d/doctor/DoctorDashboard";

interface CompletedVisitCardProps {
  visit: CompletedVisit;
  type: "completed" | "left";
}

export default function CompletedVisitCard({
  visit,
  type,
}: CompletedVisitCardProps) {
  const time = visit.completed_at || visit.created_at;
  const formattedTime = time
    ? new Date(time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-ink">
            {visit.first_name} {visit.last_name}
          </h3>
          <p className="mt-0.5 text-xs text-slate">
            {type === "completed" ? "Completed" : "Left"} at {formattedTime}
          </p>
          {visit.diagnosis_preview && (
            <p className="mt-2 text-sm text-slate line-clamp-2">
              {visit.diagnosis_preview}
            </p>
          )}
        </div>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            type === "completed"
              ? "bg-green-50 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {type === "completed" ? "Done" : "Left"}
        </span>
      </div>
    </div>
  );
}
