"use client";

import { useRouter } from "next/navigation";
import type { ClaimedVisit } from "@/app/(dashboard)/d/doctor/DoctorDashboard";

interface ClaimedPatientCardProps {
  visit: ClaimedVisit;
}

export default function ClaimedPatientCard({ visit }: ClaimedPatientCardProps) {
  const router = useRouter();

  const claimedAt = new Date(visit.claimed_at);
  const minutesAgo = Math.floor(
    (Date.now() - claimedAt.getTime()) / 1000 / 60
  );

  return (
    <button
      onClick={() => router.push(`/d/doctor/patient/${visit.visit_id}`)}
      className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-hilt-blue hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-ink">
            {visit.first_name} {visit.last_name}
          </h3>
          <div className="mt-1 flex items-center gap-3 text-xs text-slate">
            <span>Claimed {minutesAgo} min ago</span>
            {visit.priority >= 2 && (
              <span
                className={
                  visit.priority === 3 ? "text-red-600" : "text-yellow-600"
                }
              >
                {visit.priority === 3 ? "High" : "Medium"} priority
              </span>
            )}
            {visit.is_sensitive && (
              <span className="text-amber-600">Sensitive</span>
            )}
            {visit.has_previous_visits && (
              <span className="text-blue-600">Returning</span>
            )}
          </div>
        </div>
        <span className="text-xs text-slate">View &rarr;</span>
      </div>
    </button>
  );
}
