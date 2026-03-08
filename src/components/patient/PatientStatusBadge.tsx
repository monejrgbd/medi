"use client";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending_approval: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
  still_answering_ai: { label: "With AI", className: "bg-blue-100 text-blue-800" },
  waiting_doctor_claim: { label: "In Queue", className: "bg-purple-100 text-purple-800" },
  claimed_by_doctor: { label: "With Doctor", className: "bg-indigo-100 text-indigo-800" },
  completed: { label: "Completed", className: "bg-green-100 text-green-800" },
  left: { label: "Left", className: "bg-red-100 text-red-800" },
};

export default function PatientStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
