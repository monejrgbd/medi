"use client";

export default function StatCard({
  label,
  value,
  icon,
  color = "bg-white",
}: {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
}) {
  return (
    <div className={`rounded-xl border border-gray-100 ${color} p-5`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate">{label}</p>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
