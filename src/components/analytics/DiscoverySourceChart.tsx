"use client";

interface DiscoverySourceChartProps {
  data: {
    success: boolean;
    total_new_patients: number;
    with_source_count: number;
    by_source: Record<string, number>;
    referral_count: number;
  } | null;
}

export default function DiscoverySourceChart({ data }: DiscoverySourceChartProps) {
  if (!data || !data.success || data.total_new_patients === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-ink mb-3">Where New Patients Find You</h3>
        <p className="text-sm text-ash">No new patient data for this period.</p>
      </div>
    );
  }

  const sources = Object.entries(data.by_source).sort((a, b) => b[1] - a[1]);
  const maxCount = sources.length > 0 ? sources[0][1] : 0;
  const responseRate = data.total_new_patients > 0
    ? Math.round((data.with_source_count / data.total_new_patients) * 100)
    : 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-ink mb-1">Where New Patients Find You</h3>
      <p className="text-xs text-ash mb-4">
        {data.total_new_patients} new patients, {responseRate}% responded
      </p>

      {sources.length === 0 ? (
        <p className="text-sm text-ash">No responses yet. Enable the discovery question on your locations to start collecting data.</p>
      ) : (
        <div className="space-y-2.5">
          {sources.map(([source, count]) => {
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const totalPct = data.total_new_patients > 0
              ? Math.round((count / data.total_new_patients) * 100)
              : 0;
            return (
              <div key={source}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium text-ink">{source}</span>
                  <span className="text-xs text-ash">{count} ({totalPct}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-hilt-blue transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
