"use client";

import { useState } from "react";
import { PLAN_CREDITS, PLAN_PRICING } from "@/lib/constants";
import { changeSubscriptionPlan } from "@/app/(dashboard)/d/_actions/billing";
import { toast } from "sonner";

interface SubscriptionManagerProps {
  currentPlan: string;
  orgId: string;
  onPlanChanged: () => void;
}

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    description: "For small practices just getting started",
  },
  {
    key: "standard",
    name: "Standard",
    description: "For growing practices with moderate volume",
  },
  {
    key: "plus",
    name: "Plus",
    description: "For high-volume practices",
  },
];

export default function SubscriptionManager({
  currentPlan,
  orgId,
  onPlanChanged,
}: SubscriptionManagerProps) {
  const [changing, setChanging] = useState(false);

  async function handleChange(plan: string) {
    if (plan === currentPlan || changing) return;

    setChanging(true);
    const result = await changeSubscriptionPlan(orgId, plan);
    setChanging(false);

    if (result?.success) {
      toast.success("Plan updated successfully");
      onPlanChanged();
    } else {
      toast.error(result?.error || "Failed to change plan");
    }
  }

  const isTrial = currentPlan?.includes("trial");
  const isBlocked = ["expired", "suspended"].includes(currentPlan);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6">
      <h2 className="text-lg font-semibold text-ink mb-1">Subscription Plan</h2>
      <p className="text-sm text-slate mb-4">
        Current plan:{" "}
        <span className="font-medium text-ink capitalize">
          {currentPlan?.replace("_", " ")}
        </span>
        {isTrial && (
          <span className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
            Trial
          </span>
        )}
      </p>

      {isBlocked && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4">
          <p className="text-sm text-red-700">
            Your account is {currentPlan}. Please reactivate to change plans.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isActive = currentPlan === plan.key || currentPlan === plan.key + "_trial";
          return (
            <div
              key={plan.key}
              className={`rounded-xl border-2 p-4 transition-all ${
                isActive
                  ? "border-hilt-blue bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <h3 className="font-semibold text-ink">{plan.name}</h3>
              <p className="text-2xl font-bold text-ink mt-1">
                ${PLAN_PRICING[plan.key]}
                <span className="text-sm font-normal text-slate">/mo</span>
              </p>
              <p className="text-xs text-slate mt-1">
                {PLAN_CREDITS[plan.key]} credits/month
              </p>
              <p className="text-xs text-slate mt-2">{plan.description}</p>
              <button
                onClick={() => handleChange(plan.key)}
                disabled={isActive || changing || isBlocked}
                className={`mt-3 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-hilt-blue text-white cursor-default"
                    : "bg-gray-100 text-ink hover:bg-gray-200 disabled:opacity-50"
                }`}
              >
                {isActive ? "Current Plan" : "Switch"}
              </button>
            </div>
          );
        })}
      </div>

      {/* PayPal integration placeholder */}
      <div className="mt-6 rounded-lg bg-gray-50 border border-gray-200 p-4">
        <p className="text-sm text-slate">
          Payment processing via PayPal. To subscribe or update payment, use the
          button below.
        </p>
        <div id="paypal-button-container" className="mt-3" />
      </div>
    </div>
  );
}
