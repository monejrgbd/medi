"use client";

import { useState } from "react";
import { setRechargeLimit } from "@/app/(dashboard)/d/_actions/billing";
import { toast } from "sonner";

const PRESETS = [25, 50, 100, 200];
const PAYG_PLANS = ["pay_as_you_go"];

interface RechargeConfigProps {
  rechargeLimit: number | null;
  rechargeUsed: number;
  subscriptionPlan: string;
  onChanged: () => void;
}

export default function RechargeConfig({
  rechargeLimit,
  rechargeUsed,
  subscriptionPlan,
  onChanged,
}: RechargeConfigProps) {
  const [enabled, setEnabled] = useState(rechargeLimit !== null);
  const [limit, setLimit] = useState(rechargeLimit ?? 100);
  const [saving, setSaving] = useState(false);
  const isPAyG = PAYG_PLANS.includes(subscriptionPlan);

  async function handleToggle() {
    if (enabled) {
      setSaving(true);
      const result = await setRechargeLimit(null);
      setSaving(false);
      if (result?.success) {
        setEnabled(false);
        toast.success("Recharge disabled");
        onChanged();
      } else {
        toast.error(result?.error || "Failed to update");
      }
    } else {
      setEnabled(true);
    }
  }

  async function handleSave() {
    if (limit < 1 || limit > 10000 || saving) return;

    setSaving(true);
    const result = await setRechargeLimit(limit);
    setSaving(false);

    if (result?.success) {
      toast.success(`Recharge limit set to $${limit}`);
      onChanged();
    } else {
      toast.error(result?.error || "Failed to update");
    }
  }

  const usedPct =
    rechargeLimit && rechargeLimit > 0
      ? Math.min((rechargeUsed / rechargeLimit) * 100, 100)
      : 0;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ink">Auto Recharge</h2>
        <button
          onClick={handleToggle}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? "bg-hilt-blue" : "bg-gray-200"
          }`}
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle auto recharge"
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {enabled && (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setLimit(p)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  limit === p
                    ? "bg-hilt-blue text-white"
                    : "bg-gray-100 text-ink hover:bg-gray-200"
                }`}
              >
                ${p}
              </button>
            ))}
            <div className="flex items-center gap-1">
              <span className="text-sm text-slate">$</span>
              <input
                type="number"
                min={1}
                max={10000}
                value={limit}
                onChange={(e) =>
                  setLimit(
                    Math.max(1, Math.min(10000, parseInt(e.target.value) || 1))
                  )
                }
                className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-center text-sm focus:border-hilt-blue focus:outline-none"
                aria-label="Custom recharge limit"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving || limit < 1 || limit > 10000}
              className="rounded-lg bg-hilt-blue px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : rechargeLimit === limit ? "Saved" : "Save"}
            </button>
          </div>

          {rechargeUsed > 0 && rechargeLimit && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate mb-1">
                <span>Recharge: ${Math.round(rechargeUsed)} used of ${rechargeLimit}</span>
                <span>{Math.round(usedPct)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${usedPct}%` }}
                />
              </div>
            </div>
          )}

          <p className="text-xs text-slate">
            {isPAyG
              ? "Credits are added automatically at $1 each up to your recharge limit. Recharge spending resets every 30 days."
              : "When your marketing budget runs out, additional marketing actions are covered at $1 each up to your recharge limit. Resets each billing cycle."}
          </p>
        </>
      )}

      {!enabled && (
        <p className="text-xs text-slate">
          {isPAyG
            ? "Enable auto recharge to keep screening active when credits run out. Credits are billed at $1 each."
            : "Enable auto recharge to keep marketing running when your included budget runs out. Billed at $1 each."}
        </p>
      )}
    </div>
  );
}
