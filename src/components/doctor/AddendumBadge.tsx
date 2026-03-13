"use client";

interface AddendumBadgeProps {
  createdAt: string;
}

export default function AddendumBadge({ createdAt }: AddendumBadgeProps) {
  const time = new Date(createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
      Added after submission &middot; {time}
    </span>
  );
}
