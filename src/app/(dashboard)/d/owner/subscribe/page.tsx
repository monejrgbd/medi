"use client";

import { useEffect, useState, useRef } from "react";
import { useRole } from "@/contexts/RoleContext";
import { useRouter } from "next/navigation";
import { PLAN_CONFIG } from "@/lib/constants";
import { toast } from "sonner";

type BillingCycle = "monthly" | "annual";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
const PLAN_IDS: Record<string, string> = (() => {
  try {
    return JSON.parse(process.env.NEXT_PUBLIC_PAYPAL_PLAN_IDS || "{}");
  } catch {
    return {};
  }
})();

const PLANS = [
  { key: "starter", name: "Starter", ai: "Standard AI", hasTrial: true, trialRequiresPremium: false },
  { key: "professional", name: "Professional", ai: "Advanced AI", hasTrial: true, trialRequiresPremium: true },
  { key: "business", name: "Business", ai: "Advanced + Premium AI", hasTrial: false, trialRequiresPremium: false },
];

export default function SubscribePage() {
  const { org, isOwner } = useRole();
  const router = useRouter();
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [sdkReady, setSdkReady] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{ plan: string; trial: boolean } | null>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const renderedBtn = useRef<{ close: () => Promise<void> } | null>(null);

  const isPremiumTrial = org?.subscription_plan === "premium_trial";

  // SDK ready check
  useEffect(() => {
    if (window.paypal) { setSdkReady(true); return; }
    if (!PAYPAL_CLIENT_ID) return;
    if (document.querySelector('script[src*="paypal.com/sdk/js"]')) {
      const interval = setInterval(() => { if (window.paypal) { setSdkReady(true); clearInterval(interval); } }, 500);
      return () => clearInterval(interval);
    }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=subscription`;
    script.onload = () => setSdkReady(true);
    document.head.appendChild(script);
  }, []);

  // Render PayPal button when action selected
  useEffect(() => {
    if (!sdkReady || !window.paypal || !selectedAction || !btnRef.current) return;

    if (renderedBtn.current) { renderedBtn.current.close().catch(() => {}); renderedBtn.current = null; }
    btnRef.current.innerHTML = "";

    const planKey = selectedAction.trial
      ? `${selectedAction.plan}_monthly_trial`
      : `${selectedAction.plan}_${billing}`;
    const planId = PLAN_IDS[planKey];
    if (!planId) { toast.error("Plan not available yet"); return; }

    const btn = window.paypal.Buttons({
      style: { layout: "vertical", label: "subscribe", shape: "rect", color: "blue", height: 45 },
      createSubscription: (
        _data: unknown,
        actions: { subscription: { create: (opts: Record<string, unknown>) => Promise<string> } }
      ) => {
        return actions.subscription.create({
          plan_id: planId,
          custom_id: `${org?.id}:${selectedAction.plan}:${selectedAction.trial ? "monthly" : billing}`,
          quantity: "1",
        });
      },
      onApprove: () => {
        toast.success("Subscription created. Your plan will activate shortly.");
        setTimeout(() => router.push("/d/owner/billing"), 2000);
      },
      onError: () => {
        toast.error("PayPal checkout failed. Please try again.");
      },
    });
    btn.render(btnRef.current);
    renderedBtn.current = btn;

    return () => { if (renderedBtn.current) { renderedBtn.current.close().catch(() => {}); renderedBtn.current = null; } };
  }, [sdkReady, selectedAction, billing, org?.id, router]);

  if (!isOwner) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-slate">Only the organization owner can manage subscriptions.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-ink mb-2">Choose how to get started</h1>
      <p className="text-sm text-slate mb-6">
        Start with a 14 day trial (50 AI screenings) or subscribe now for unlimited access.
      </p>

      {/* Billing toggle — only for subscribe now */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          <button onClick={() => setBilling("monthly")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${billing === "monthly" ? "bg-white text-ink shadow-sm" : "text-slate"}`}>
            Monthly
          </button>
          <button onClick={() => setBilling("annual")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${billing === "annual" ? "bg-white text-ink shadow-sm" : "text-slate"}`}>
            Annual <span className="text-xs text-green-600 ml-1">Save 20%</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {PLANS.map((plan) => {
          const config = PLAN_CONFIG[plan.key as keyof typeof PLAN_CONFIG];
          const monthlyPrice = config.price;
          const annualMonthly = config.annual;
          const displayPrice = billing === "annual" ? annualMonthly : monthlyPrice;
          const showTrial = plan.hasTrial && (!plan.trialRequiresPremium || isPremiumTrial);

          return (
            <div key={plan.key} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-ink">{plan.name}</h3>
                  <p className="text-sm text-slate">{plan.ai}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-ink">${displayPrice}</p>
                  <p className="text-xs text-slate">/doctor and nurse/mo</p>
                </div>
              </div>

              <div className="flex gap-3">
                {showTrial && (
                  <button
                    onClick={() => setSelectedAction({ plan: plan.key, trial: true })}
                    className={`flex-1 rounded-lg border-2 py-2.5 text-sm font-medium transition-colors ${
                      selectedAction?.plan === plan.key && selectedAction?.trial
                        ? "border-hilt-blue bg-blue-50 text-hilt-blue"
                        : "border-gray-200 text-ink hover:border-gray-300"
                    }`}>
                    Start 14 Day Trial
                    <p className="text-[10px] text-slate font-normal mt-0.5">50 screenings, then auto subscribes</p>
                  </button>
                )}
                <button
                  onClick={() => setSelectedAction({ plan: plan.key, trial: false })}
                  className={`flex-1 rounded-lg border-2 py-2.5 text-sm font-medium transition-colors ${
                    selectedAction?.plan === plan.key && !selectedAction?.trial
                      ? "border-hilt-blue bg-blue-50 text-hilt-blue"
                      : "border-gray-200 text-ink hover:border-gray-300"
                  }`}>
                  Subscribe Now
                  <p className="text-[10px] text-slate font-normal mt-0.5">Full plan, charges immediately</p>
                </button>
              </div>

              {plan.trialRequiresPremium && !isPremiumTrial && plan.hasTrial && (
                <p className="text-xs text-ash mt-2">Trial requires a premium code (redeemed during onboarding).</p>
              )}
            </div>
          );
        })}
      </div>

      {/* PayPal button */}
      {selectedAction && (
        <div className="mt-6 rounded-xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-ink font-medium mb-3">
            {selectedAction.trial
              ? `${PLANS.find((p) => p.key === selectedAction.plan)?.name} trial — $0 today, 50 screenings, then auto subscribes`
              : `${PLANS.find((p) => p.key === selectedAction.plan)?.name} — ${billing === "annual" ? "annual" : "monthly"} billing`}
          </p>
          <div ref={btnRef} className="min-h-[50px]" />
          <p className="text-xs text-ash mt-2">Pay with PayPal or debit/credit card.</p>
        </div>
      )}

      <p className="text-center text-sm text-slate mt-6">
        Not ready yet? You can keep using your free credits and subscribe anytime from the billing page.
      </p>
    </div>
  );
}
