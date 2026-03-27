"use client";

import { useState } from "react";
import { purchaseOverageCredits, purchaseFeatureTopup } from "@/app/(dashboard)/d/_actions/billing";
import { toast } from "sonner";

const SUBSCRIPTION_PLANS = ["starter", "professional", "business", "enterprise"];

const TOPUP_OPTIONS = [
  { key: "marketing_sms", label: "SMS Budget", desc: "1 credit = 10 marketing SMS", icon: "💬" },
  { key: "marketing_scan", label: "Scan Budget", desc: "1 credit = 1,000 patient scans", icon: "🔍" },
  { key: "premium_ai", label: "Premium AI", desc: "1 credit = 0.25 conversations (4 each)", icon: "✨" },
  { key: "general", label: "General (any service)", desc: "Works for SMS, scans, or Premium AI", icon: "🔄" },
];

interface OveragePurchaseProps {
  onPurchased: () => void;
  subscriptionPlan: string;
  billingCycleStart: string | null;
}

export default function OveragePurchase({ onPurchased, subscriptionPlan, billingCycleStart }: OveragePurchaseProps) {
  const [amount, setAmount] = useState(10);
  const [feature, setFeature] = useState("general");
  const [purchasing, setPurchasing] = useState(false);

  const isSubscription = SUBSCRIPTION_PLANS.includes(subscriptionPlan);
  const showPremiumAi = subscriptionPlan === "business" || subscriptionPlan === "enterprise";

  async function handlePurchase() {
    if (amount < 1 || amount > 10000 || purchasing) return;

    setPurchasing(true);
    let result;
    if (isSubscription) {
      result = await purchaseFeatureTopup(feature, amount);
    } else {
      result = await purchaseOverageCredits(amount);
    }
    setPurchasing(false);

    if (result?.success) {
      const label = isSubscription
        ? TOPUP_OPTIONS.find((o) => o.key === feature)?.label || "budget"
        : "credits";
      toast.success(`Added ${amount} to ${label}`);
      onPurchased();
    } else {
      toast.error(result?.error || "Purchase failed");
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6">
      <h2 className="text-lg font-semibold text-ink mb-4">
        {isSubscription ? "Top Up Marketing Budget" : "Buy Extra Credits"}
      </h2>

      {isSubscription && (
        <div className="flex flex-wrap gap-2 mb-4">
          {TOPUP_OPTIONS.filter((o) => o.key !== "premium_ai" || showPremiumAi).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFeature(opt.key)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                feature === opt.key
                  ? "bg-hilt-blue text-white"
                  : "bg-gray-100 text-ink hover:bg-gray-200"
              }`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAmount((a) => Math.max(1, a - 5))}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-ink hover:bg-gray-200 transition-colors"
          >
            -5
          </button>
          <input
            type="number"
            min={1}
            max={10000}
            value={amount}
            onChange={(e) =>
              setAmount(Math.max(1, Math.min(10000, parseInt(e.target.value) || 1)))
            }
            className="w-20 rounded-lg border border-gray-200 px-3 py-1.5 text-center text-sm focus:border-hilt-blue focus:outline-none"
          />
          <button
            onClick={() => setAmount((a) => Math.min(10000, a + 5))}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-ink hover:bg-gray-200 transition-colors"
          >
            +5
          </button>
        </div>

        <button
          onClick={handlePurchase}
          disabled={purchasing || amount < 1}
          className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {purchasing ? "Processing..." : `Buy for $${amount}`}
        </button>
      </div>

      <p className="text-xs text-slate mt-2">
        {isSubscription
          ? `$1 each. ${TOPUP_OPTIONS.find((o) => o.key === feature)?.desc || ""} Top ups do not expire.`
          : "Credits are $1 each. Added immediately."}
      </p>
    </div>
  );
}
