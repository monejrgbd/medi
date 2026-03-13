"use client";

interface PatientAggregateStats {
  avg_ai_minutes: number | null;
  avg_wait_minutes: number | null;
  avg_handling_minutes: number | null;
  total: number;
  completed: number;
  left_count: number;
  denied_count: number;
}

interface Props {
  stats: PatientAggregateStats;
}

function fmtMin(val: number | null): string {
  if (val === null || val === undefined) return "N/A";
  return `${val}m`;
}

export default function PatientStatsCards({ stats }: Props) {
  if (!stats || stats.total === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-slate">
        No visits recorded for this period.
      </div>
    );
  }

  const cards = [
    {
      label: "Avg AI Time",
      value: fmtMin(stats.avg_ai_minutes),
      sub: "Pre-screening duration",
      color: "text-blue-600",
    },
    {
      label: "Avg Wait Time",
      value: fmtMin(stats.avg_wait_minutes),
      sub: "Queue to claim",
      color: "text-amber-600",
    },
    {
      label: "Avg Handling Time",
      value: fmtMin(stats.avg_handling_minutes),
      sub: "Doctor visit duration",
      color: "text-green-600",
    },
    {
      label: "Total Patients",
      value: String(stats.total),
      sub: `${stats.completed} completed / ${stats.left_count} left / ${stats.denied_count} denied`,
      color: "text-ink",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-gray-200 bg-white p-4"
        >
          <p className="text-xs font-medium text-slate uppercase">
            {card.label}
          </p>
          <p className={`mt-1 text-2xl font-bold ${card.color}`}>
            {card.value}
          </p>
          <p className="mt-1 text-xs text-slate">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
