"use client";

import { useEffect, useRef, useState } from "react";
import { PLAN_CREDITS, PLAN_PRICING } from "@/lib/constants";
import { toast } from "sonner";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: Record<string, unknown>) => {
        render: (el: HTMLElement) => Promise<void>;
        close: () => Promise<void>;
      };
    };
  }
}

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

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
const PLAN_IDS: Record<string, string> = (() => {
  try {
    return JSON.parse(process.env.NEXT_PUBLIC_PAYPAL_PLAN_IDS || "{}");
  } catch {
    return {};
  }
})();

export default function SubscriptionManager({
  currentPlan,
  orgId,
  onPlanChanged,
}: SubscriptionManagerProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const buttonRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const renderedButtons = useRef<
    Record<string, { close: () => Promise<void> }>
  >({});

  // Load PayPal JS SDK
  useEffect(() => {
    if (!CLIENT_ID) return;
    if (document.querySelector('script[src*="paypal.com/sdk/js"]')) {
      setSdkReady(!!window.paypal);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&vault=true&intent=subscription`;
    script.dataset.sdkIntegrationSource = "button-factory";
    script.onload = () => setSdkReady(true);
    script.onerror = () => toast.error("Failed to load PayPal SDK");
    document.head.appendChild(script);
  }, []);

  // Render PayPal buttons for each non-active plan
  useEffect(() => {
    if (!sdkReady || !window.paypal) return;

    // Clean up old buttons
    for (const [key, btn] of Object.entries(renderedButtons.current)) {
      btn.close().catch(() => {});
      delete renderedButtons.current[key];
    }

    for (const plan of PLANS) {
      if (plan.key === currentPlan) continue;
      const planId = PLAN_IDS[plan.key];
      if (!planId) continue;

      const container = buttonRefs.current[plan.key];
      if (!container) continue;
      container.innerHTML = "";

      const btn = window.paypal!.Buttons({
        style: {
          layout: "vertical",
          label: "subscribe",
          shape: "rect",
          color: "blue",
          height: 40,
        },
        createSubscription: (
          _data: unknown,
          actions: {
            subscription: {
              create: (opts: Record<string, unknown>) => Promise<string>;
            };
          }
        ) => {
          return actions.subscription.create({
            plan_id: planId,
            custom_id: `${orgId}:${plan.key}`,
          });
        },
        onApprove: () => {
          toast.success("Subscription created! Your plan will update shortly.");
          setTimeout(() => onPlanChanged(), 3000);
        },
        onError: () => {
          toast.error("PayPal checkout failed. Please try again.");
        },
      });
      btn.render(container);
      renderedButtons.current[plan.key] = btn;
    }

    return () => {
      for (const btn of Object.values(renderedButtons.current)) {
        btn.close().catch(() => {});
      }
      renderedButtons.current = {};
    };
  }, [sdkReady, currentPlan, orgId, onPlanChanged]);

  const isTrial = currentPlan?.includes("trial");
  const isExpired = ["expired", "suspended"].includes(currentPlan);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6">
      <h2 className="text-lg font-semibold text-ink mb-1">
        Subscription Plan
      </h2>
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

      {!isExpired && (
        <p className="text-xs text-slate mb-4">
          Remaining credits are carried over when switching plans.
        </p>
      )}

      {isExpired && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-4">
          <p className="text-sm text-blue-700">
            Choose a plan below to reactivate your subscription.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isActive = currentPlan === plan.key;
          const hasPlanId = !!PLAN_IDS[plan.key];
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

              <div className="mt-3">
                {isActive ? (
                  <div className="w-full rounded-lg bg-hilt-blue px-3 py-2 text-sm font-medium text-white text-center">
                    Current Plan
                  </div>
                ) : !hasPlanId ? (
                  <div className="w-full rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-slate text-center">
                    Contact us
                  </div>
                ) : !sdkReady ? (
                  <div className="w-full rounded-lg bg-gray-50 px-3 py-2 text-sm text-slate text-center animate-pulse">
                    Loading...
                  </div>
                ) : (
                  <div
                    ref={(el) => {
                      buttonRefs.current[plan.key] = el;
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
