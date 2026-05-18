"use client";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending_approval: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
  still_answering_ai: { label: "With AI", className: "bg-blue-100 text-blue-800" },
  awaiting_arrival: { label: "Awaiting Arrival", className: "bg-amber-100 text-amber-800" },
  waiting_doctor_claim: { label: "In Queue", className: "bg-purple-100 text-purple-800" },
  claimed_by_doctor: { label: "With Doctor", className: "bg-indigo-100 text-indigo-800" },
  completed: { label: "Completed", className: "bg-green-100 text-green-800" },
  left: { label: "Left", className: "bg-red-100 text-red-800" },
};

export default function PatientStatusBadge({
  status,
  aiSkipped = false,
}: {
  status: string;
  aiSkipped?: boolean;
}) {
  // Forms-only visits sit in still_answering_ai but are filling the
  // prescreening form, not chatting with the AI. Label them accordingly.
  const config =
    status === "still_answering_ai" && aiSkipped
      ? { label: "Filling form", className: "bg-teal-100 text-teal-800" }
      : STATUS_CONFIG[status] ?? {
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
