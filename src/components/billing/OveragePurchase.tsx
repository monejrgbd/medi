"use client";

import { useState } from "react";
import { purchaseOverageCredits } from "@/app/(dashboard)/d/_actions/billing";
import { toast } from "sonner";

const RESETTING_PLANS = ["starter", "professional", "business"];

interface OveragePurchaseProps {
  onPurchased: () => void;
  subscriptionPlan: string;
  billingCycleStart: string | null;
}

export default function OveragePurchase({ onPurchased, subscriptionPlan, billingCycleStart }: OveragePurchaseProps) {
  const [amount, setAmount] = useState(50);
  const [purchasing, setPurchasing] = useState(false);

  const pricePerCredit = 1; // $1 per credit
  const totalPrice = amount * pricePerCredit;

  async function handlePurchase() {
    if (amount < 1 || amount > 1000 || purchasing) return;

    setPurchasing(true);
    const result = await purchaseOverageCredits(amount);
    setPurchasing(false);

    if (result?.success) {
      toast.success(`Purchased ${amount} credits`);
      onPurchased();
    } else {
      toast.error(result?.error || "Purchase failed");
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6">
      <h2 className="text-lg font-semibold text-ink mb-4">Buy Extra Credits</h2>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAmount((a) => Math.max(1, a - 10))}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-ink hover:bg-gray-200 transition-colors"
            aria-label="Decrease credits by 10"
          >
            -10
          </button>
          <input
            type="number"
            min={1}
            max={1000}
            value={amount}
            onChange={(e) =>
              setAmount(
                Math.max(1, Math.min(1000, parseInt(e.target.value) || 1))
              )
            }
            className="w-20 rounded-lg border border-gray-200 px-3 py-1.5 text-center text-sm focus:border-hilt-blue focus:outline-none"
            aria-label="Number of credits"
          />
          <button
            onClick={() => setAmount((a) => Math.min(1000, a + 10))}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-ink hover:bg-gray-200 transition-colors"
            aria-label="Increase credits by 10"
          >
            +10
          </button>
        </div>

        <button
          onClick={handlePurchase}
          disabled={purchasing || amount < 1 || amount > 1000}
          className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {purchasing
            ? "Processing..."
            : `Buy ${amount} credits for $${totalPrice}`}
        </button>
      </div>

      <p className="text-xs text-slate mt-2">
        {RESETTING_PLANS.includes(subscriptionPlan)
          ? (() => {
              if (!billingCycleStart) return "Credits are added immediately and expire at the end of your billing cycle.";
              const daysLeft = Math.max(
                0,
                Math.ceil(
                  (new Date(billingCycleStart).getTime() + 30 * 86400000 - Date.now()) / 86400000
                )
              );
              return daysLeft > 0
                ? `Credits are added immediately and expire in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} with your billing cycle reset.`
                : "Credits are added immediately and expire at the end of your billing cycle.";
            })()
          : "Credits are added immediately and do not expire. If you subscribe to a plan, unused credits will reset with each billing cycle."}
      </p>
    </div>
  );
}
