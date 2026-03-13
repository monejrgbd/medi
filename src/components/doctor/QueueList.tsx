"use client";

import PatientQueueCard from "./PatientQueueCard";
import type { QueueVisit } from "@/app/(dashboard)/d/doctor/DoctorDashboard";

interface QueueListProps {
  queue: QueueVisit[];
  onClaimed: () => void;
}

export default function QueueList({ queue, onClaimed }: QueueListProps) {
  if (queue.length === 0) {
    return (
      <p className="text-sm text-slate text-center py-8">
        No patients in queue.
      </p>
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
