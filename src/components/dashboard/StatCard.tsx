"use client";

import { type ReactNode } from "react";

export default function StatCard({
  label,
  value,
  icon,
  color = "bg-white",
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
}) {
  return (
    <div className={`rounded-xl border border-gray-100 ${color} p-5`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate">{label}</p>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
