"use client";

import { useState, useEffect } from "react";
import { fetchCreditDashboard } from "@/app/(dashboard)/d/_actions/billing";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardData {
  credits_total: number;
  credits_used: number;
  credits_remaining: number;
  subscription_plan: string;
  billing_cycle_start: string;
  trial_end_date: string | null;
  payment_failure_count: number;
  daily_usage: { date: string; credits: number }[];
  projected_runout_date: string | null;
}

export default function CreditDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreditDashboard().then((res) => {
      if (res?.success) setData(res as unknown as DashboardData);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <div className="h-48 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-hilt-blue" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const usedPct = data.credits_total > 0 ? data.credits_used / data.credits_total : 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference * (1 - usedPct);

  const gaugeColor =
    usedPct >= 0.9 ? "#ef4444" : usedPct >= 0.7 ? "#f59e0b" : "#22c55e";

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6">
      <h2 className="text-lg font-semibold text-ink mb-4">Credit Usage</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gauge */}
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full -rotate-90"
              role="progressbar"
              aria-valuenow={data.credits_used}
              aria-valuemin={0}
              aria-valuemax={data.credits_total}
              aria-label={`${data.credits_used} of ${data.credits_total} credits used`}
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={gaugeColor}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-ink">
                {Math.round(data.credits_remaining)}
              </span>
              <span className="text-xs text-slate">remaining</span>
            </div>
          </div>

          <div className="mt-3 text-center space-y-1">
            <p className="text-sm text-slate">
              {Math.round(data.credits_used)} / {data.credits_total} used
            </p>
            {data.projected_runout_date && (
              <p className="text-xs text-amber-600">
                Projected runout:{" "}
                {new Date(data.projected_runout_date).toLocaleDateString()}
              </p>
            )}
            {data.billing_cycle_start && (
              <p className="text-xs text-slate">
                Cycle started{" "}
                {new Date(data.billing_cycle_start).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Daily usage chart */}
        <div>
          <h3 className="text-sm font-medium text-ink mb-2">Daily Usage</h3>
          {data.daily_usage.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={data.daily_usage}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) =>
                    new Date(d).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} width={30} />
                <Tooltip
                  labelFormatter={(d) => new Date(d as string).toLocaleDateString()}
                  formatter={(v) => [String(v), "Credits"]}
                />
                <Line
                  type="monotone"
                  dataKey="credits"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate text-center py-8">
              No usage data yet this cycle.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
