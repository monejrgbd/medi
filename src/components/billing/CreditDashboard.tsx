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
  recharge_limit: number | null;
  recharge_used: number;
  recharge_remaining: number;
}

function fillDailyUsage(usage: { date: string; credits: number }[]) {
  if (usage.length === 0) return [];
  const map = new Map(usage.map((u) => [u.date, u.credits]));
  const start = new Date(usage[0].date + "T12:00:00");
  const end = new Date();
  end.setHours(12, 0, 0, 0);
  const result: { date: string; credits: number }[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    const dateStr = cur.toISOString().split("T")[0];
    result.push({ date: dateStr, credits: map.get(dateStr) ?? 0 });
    cur.setDate(cur.getDate() + 1);
  }
  return result;
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

  const isPAyG = data.subscription_plan === "pay_as_you_go";
  const isTrial = data.subscription_plan?.includes("trial");
  const isCreditsMode = isPAyG || isTrial;

  const usedPct = data.credits_total > 0 ? data.credits_used / data.credits_total : 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference * (1 - usedPct);

  const gaugeColor =
    usedPct >= 0.9 ? "#ef4444" : usedPct >= 0.7 ? "#f59e0b" : "#22c55e";

  const planLabels: Record<string, { name: string; ai: string; msgLimit: number }> = {
    starter: { name: "Starter", ai: "Standard AI", msgLimit: 20 },
    professional: { name: "Professional", ai: "Advanced AI", msgLimit: 35 },
    business: { name: "Business", ai: "Advanced + Premium AI", msgLimit: 50 },
    enterprise: { name: "Enterprise", ai: "Custom", msgLimit: 50 },
  };
  const planInfo = planLabels[data.subscription_plan] || null;

  // For subscription plans: show plan overview + per-feature usage
  if (!isCreditsMode && planInfo) {
    const featureCaps: Record<string, { sms: number; scan: number; premiumAi: number; premiumAiCost: number }> = {
      starter: { sms: 100, scan: 10000, premiumAi: 1, premiumAiCost: 3.5 },
      professional: { sms: 500, scan: 50000, premiumAi: 5, premiumAiCost: 3 },
      business: { sms: 1000, scan: 100000, premiumAi: 25, premiumAiCost: 2.5 },
      enterprise: { sms: 10000, scan: 1000000, premiumAi: 1000, premiumAiCost: 4 },
    };
    const caps = featureCaps[data.subscription_plan] || { sms: 0, scan: 0, premiumAi: 0 };
    const fu = (data as unknown as { feature_usage?: { sms_used: number; scan_used: number; opus_used: number } }).feature_usage;
    const smsUsed = Math.round((fu?.sms_used || 0) / 0.1); // credits → SMS count
    const scanUsed = Math.round((fu?.scan_used || 0) * 1000); // credits → patient count
    const premiumAiCost = caps.premiumAiCost || 4;
    const premiumAiUsed = Math.round((fu?.opus_used || 0) / premiumAiCost); // credits → conversation count
    const topupsRemaining = Math.round((data as unknown as { topups_remaining?: number }).topups_remaining || 0);
    const trialScreeningsUsed = (data as unknown as { trial_screenings_used?: number }).trial_screenings_used;
    const trialScreeningsLimit = (data as unknown as { trial_screenings_limit?: number }).trial_screenings_limit;
    const isTrialActive = trialScreeningsLimit != null && trialScreeningsLimit > 0;

    function UsageBar({ label, used, cap }: { label: string; used: number; cap: number }) {
      if (cap === 0) return null;
      const pct = Math.min((used / cap) * 100, 100);
      const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-hilt-blue";
      return (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate">{label}</span>
            <span className="text-ink font-medium">{used.toLocaleString()} / {cap.toLocaleString()}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <h2 className="text-lg font-semibold text-ink mb-4">Your Plan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs text-slate">Plan</p>
            <p className="text-lg font-bold text-ink">{planInfo.name}</p>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-hilt-blue">
              {planInfo.ai}
            </span>
          </div>
          <div className="rounded-lg bg-green-50 p-3">
            <p className="text-xs text-slate">AI Screening</p>
            {isTrialActive ? (
              <>
                <p className="text-lg font-bold text-ink">{(trialScreeningsUsed || 0)} / {trialScreeningsLimit}</p>
                <p className="text-xs text-slate">screenings used during trial</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-green-700">Unlimited</p>
                <p className="text-xs text-slate">Up to {planInfo.msgLimit} messages per conversation</p>
              </>
            )}
          </div>
          <div className="rounded-lg bg-snow p-3">
            <p className="text-xs text-slate">Top Ups</p>
            <p className="text-lg font-bold text-ink">{topupsRemaining}</p>
            <p className="text-xs text-slate">remaining (works for any service)</p>
          </div>
        </div>

        <h3 className="text-sm font-medium text-ink mb-3">Marketing Budget Usage</h3>
        <div className="space-y-3">
          <UsageBar label="Marketing SMS" used={smsUsed} cap={caps.sms} />
          <UsageBar label="AI Patient Scans" used={scanUsed} cap={caps.scan} />
          {caps.premiumAi > 0 && <UsageBar label="Premium AI Conversations" used={premiumAiUsed} cap={caps.premiumAi} />}
        </div>

        {data.billing_cycle_start && (
          <p className="text-xs text-slate mt-3">
            Cycle started {new Date(data.billing_cycle_start).toLocaleDateString()}
          </p>
        )}
      </div>
    );
  }

  // PAyG / Trial: show credit gauge (existing behavior)
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
              {Number(data.credits_used.toFixed(1))} / {data.credits_total} used
            </p>
            {data.projected_runout_date && (
              <p className="text-xs text-amber-600">
                Projected runout:{" "}
                {new Date(data.projected_runout_date).toLocaleDateString()}
              </p>
            )}
            {data.billing_cycle_start && (
              <p className="text-xs text-slate">
                {isPAyG ? "Recharge resets" : "Cycle started"}{" "}
                {isPAyG
                  ? new Date(new Date(data.billing_cycle_start).getTime() + 30 * 86400000).toLocaleDateString()
                  : new Date(data.billing_cycle_start).toLocaleDateString()}
              </p>
            )}
            {data.recharge_limit != null && data.recharge_limit > 0 && (
              <div className="mt-2 w-full max-w-[160px]">
                <div className="flex justify-between text-xs mb-0.5">
                  <span className={data.recharge_used > 0 ? "text-amber-600 font-medium" : "text-slate"}>
                    Recharge: ${Math.round(data.recharge_used)} / ${data.recharge_limit}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{
                      width: `${Math.min((data.recharge_used / data.recharge_limit) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Daily usage chart */}
        <div>
          <h3 className="text-sm font-medium text-ink mb-2">Daily Usage</h3>
          {(() => {
            const chartData = fillDailyUsage(data.daily_usage);
            const hasUsage = chartData.some((d) => d.credits > 0);
            return hasUsage ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) =>
                      new Date(d + "T12:00:00").toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })
                    }
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip
                    labelFormatter={(d) =>
                      new Date((d as string) + "T12:00:00").toLocaleDateString()
                    }
                    formatter={(v) => [Number((v as number).toFixed(1)), "Credits"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="credits"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={chartData.filter((d) => d.credits > 0).length <= 3}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate text-center py-8">
                No usage data yet this cycle.
              </p>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
