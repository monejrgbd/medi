"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface VitalRecord {
  id: string;
  value: number;
  vital_name: string;
  vital_unit: string;
  display_order?: number;
  notes: string | null;
  measured_at: string;
  recorded_by_name: string;
}

interface VitalsHistoryProps {
  vitals: VitalRecord[];
}

interface SessionGroup {
  measured_at: string;
  recorded_by_name: string;
  readings: VitalRecord[];
}

export default function VitalsHistory({ vitals }: VitalsHistoryProps) {
  if (vitals.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-8 text-center">
        <p className="text-sm text-slate">No vitals recorded yet</p>
      </div>
    );
  }

  // Section 1: Weight and Height trend charts
  const weightReadings = vitals
    .filter((v) => v.vital_name === "Weight")
    .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());

  const heightReadings = vitals
    .filter((v) => v.vital_name === "Height")
    .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());

  const showWeightChart = weightReadings.length >= 2;
  const showHeightChart = heightReadings.length >= 2;

  // Section 2: Group readings by session (same measured_at)
  const sessionMap = new Map<string, SessionGroup>();
  for (const v of vitals) {
    const key = v.measured_at;
    if (!sessionMap.has(key)) {
      sessionMap.set(key, {
        measured_at: v.measured_at,
        recorded_by_name: v.recorded_by_name,
        readings: [],
      });
    }
    sessionMap.get(key)!.readings.push(v);
  }

  const sessions = Array.from(sessionMap.values()).sort(
    (a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()
  );

  // Sort readings within each session by display_order
  for (const session of sessions) {
    session.readings.sort(
      (a, b) => (a.display_order ?? 999) - (b.display_order ?? 999)
    );
  }

  return (
    <div className="space-y-4">
      {/* Trend charts */}
      {(showWeightChart || showHeightChart) && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-ink mb-3">Trends</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {showWeightChart && (
              <TrendChart
                label="Weight"
                unit={weightReadings[0].vital_unit}
                data={weightReadings.map((r) => ({
                  date: new Date(r.measured_at).toLocaleDateString(),
                  value: r.value,
                }))}
                color="#0d9488"
              />
            )}
            {showHeightChart && (
              <TrendChart
                label="Height"
                unit={heightReadings[0].vital_unit}
                data={heightReadings.map((r) => ({
                  date: new Date(r.measured_at).toLocaleDateString(),
                  value: r.value,
                }))}
                color="#6366f1"
              />
            )}
          </div>
        </div>
      )}

      {/* Session cards */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <h3 className="text-sm font-semibold text-ink px-4 pt-4 pb-2">Vitals History</h3>
        <div className="space-y-2 px-4 pb-4">
          {sessions.map((session) => (
            <SessionCard key={session.measured_at} session={session} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TrendChart({
  label,
  unit,
  data,
  color,
}: {
  label: string;
  unit: string;
  data: { date: string; value: number }[];
  color: string;
}) {
  return (
    <div>
      <p className="text-xs text-slate mb-1">
        {label} ({unit})
      </p>
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              formatter={(val) => [`${val} ${unit}`, label]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3, fill: color }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: SessionGroup }) {
  const dt = new Date(session.measured_at);

  // Pair BP Systolic + BP Diastolic
  const systolic = session.readings.find(
    (r) => r.vital_name === "Blood Pressure Systolic"
  );
  const diastolic = session.readings.find(
    (r) => r.vital_name === "Blood Pressure Diastolic"
  );
  const hasBPPair = systolic && diastolic;

  const renderedIds = new Set<string>();
  const lines: { label: string; display: string; notes: string | null }[] = [];

  for (const r of session.readings) {
    if (renderedIds.has(r.id)) continue;

    if (hasBPPair && (r.id === systolic.id || r.id === diastolic.id)) {
      if (!renderedIds.has(systolic.id)) {
        renderedIds.add(systolic.id);
        renderedIds.add(diastolic.id);
        lines.push({
          label: "Blood Pressure",
          display: `${systolic.value}/${diastolic.value} ${systolic.vital_unit}`,
          notes: systolic.notes || diastolic.notes,
        });
      }
      continue;
    }

    renderedIds.add(r.id);
    lines.push({
      label: r.vital_name,
      display: `${r.value} ${r.vital_unit}`,
      notes: r.notes,
    });
  }

  // Collect any session-level notes (from readings that have notes, not already shown in BP)
  const sessionNotes = session.readings
    .filter((r) => r.notes && !lines.some((l) => l.notes === r.notes))
    .map((r) => r.notes);

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-ink font-medium">
          {dt.toLocaleDateString()} {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
        <p className="text-[10px] text-slate">{session.recorded_by_name}</p>
      </div>
      <div className="space-y-1">
        {lines.map((line, i) => (
          <div key={i} className="flex items-baseline justify-between">
            <span className="text-xs text-slate">{line.label}</span>
            <span className="text-xs text-ink font-medium">{line.display}</span>
          </div>
        ))}
      </div>
      {lines.some((l) => l.notes) && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          {lines
            .filter((l) => l.notes)
            .map((l, i) => (
              <p key={i} className="text-[10px] text-slate">
                {l.label}: {l.notes}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
