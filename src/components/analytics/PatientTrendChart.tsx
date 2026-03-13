"use client";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DailyPatientStats {
  date: string;
  avg_ai_minutes: number | null;
  avg_wait_minutes: number | null;
  avg_handling_minutes: number | null;
  total: number;
  completed: number;
  left_count: number;
  denied_count: number;
}

interface Props {
  daily: DailyPatientStats[];
}

export default function PatientTrendChart({ daily }: Props) {
  if (!daily || daily.length < 2) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-slate">
        Not enough data for trend visualization.
      </div>
    );
  }

  const chartData = daily.map((d) => ({
    date: new Date(d.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    "AI Time": d.avg_ai_minutes,
    "Wait Time": d.avg_wait_minutes,
    "Handling Time": d.avg_handling_minutes,
    Completed: d.completed,
    Left: d.left_count,
    Denied: d.denied_count,
  }));

  return (
    <div className="space-y-6">
      {/* Time metrics line chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-ink mb-4">
          Average Times (minutes)
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" fontSize={12} tick={{ fill: "#6b7280" }} />
            <YAxis fontSize={12} tick={{ fill: "#6b7280" }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="AI Time"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="Wait Time"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="Handling Time"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Volume stacked area chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-ink mb-4">
          Daily Patient Volume
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" fontSize={12} tick={{ fill: "#6b7280" }} />
            <YAxis fontSize={12} tick={{ fill: "#6b7280" }} />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="Completed"
              stackId="1"
              stroke="#10b981"
              fill="#d1fae5"
            />
            <Area
              type="monotone"
              dataKey="Left"
              stackId="1"
              stroke="#f59e0b"
              fill="#fef3c7"
            />
            <Area
              type="monotone"
              dataKey="Denied"
              stackId="1"
              stroke="#ef4444"
              fill="#fee2e2"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
