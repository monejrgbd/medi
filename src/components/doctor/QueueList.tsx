"use client";

import PatientQueueCard from "./PatientQueueCard";
import type { QueueVisit } from "@/app/(dashboard)/d/doctor/DoctorDashboard";

interface QueueListProps {
  queue: QueueVisit[];
  onClaimed: (visitId: string) => void;
}

export default function QueueList({ queue, onClaimed }: QueueListProps) {
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
      {queue.map((visit) => (
        <PatientQueueCard
          key={visit.visit_id}
          visit={visit}
          onClaimed={onClaimed}
        />
      ))}
    </div>
  );
}
