"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PerDoctor {
  staff_user_id: string;
  full_name: string;
  total: number;
  returns: number;
  rate: number;
}

interface TrendEntry {
  period: string;
  total: number;
  returns: number;
  rate: number;
}

interface ReturnRateData {
  overall: { total: number; returns: number; rate: number };
  per_doctor: PerDoctor[];
  trend: TrendEntry[];
}

interface Props {
  data: ReturnRateData;
}

export default function ReturnRateChart({ data }: Props) {
  if (!data.overall || data.overall.total === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-slate">
        No completed visits in this date range.
      </div>
    );
  }

  const trendData = data.trend.map((t) => ({
    period: new Date(t.period).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    "First-time": t.total - t.returns,
    "Return": t.returns,
  }));

  const doctorData = data.per_doctor.map((d) => ({
    name: d.full_name.split(" ")[0],
    "Return Rate": d.rate,
    total: d.total,
  }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-slate uppercase">
            Total Completed
          </p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {data.overall.total}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-slate uppercase">
            Return Visits
          </p>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {data.overall.returns}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-slate uppercase">
            Return Rate
          </p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {data.overall.rate}%
          </p>
        </div>
      </div>

      {/* Stacked area chart - first-time vs return */}
      {trendData.length >= 2 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-ink mb-4">
            First-time vs Repeat Ratio Over Time
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" fontSize={12} tick={{ fill: "#6b7280" }} />
              <YAxis fontSize={12} tick={{ fill: "#6b7280" }} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="First-time"
                stackId="1"
                stroke="#94a3b8"
                fill="#e2e8f0"
              />
              <Area
                type="monotone"
                dataKey="Return"
                stackId="1"
                stroke="#3b82f6"
                fill="#bfdbfe"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-doctor bar chart */}
      {doctorData.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-ink mb-4">
            Return Rate by Doctor
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={doctorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={12} tick={{ fill: "#6b7280" }} />
              <YAxis
                fontSize={12}
                tick={{ fill: "#6b7280" }}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, "Return Rate"]}
              />
              <Bar dataKey="Return Rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
