"use client";

import { useState, useEffect, useRef } from "react";
import { captureAndCreditPurchase } from "@/app/(dashboard)/d/_actions/billing";
import { toast } from "sonner";

const SUBSCRIPTION_PLANS = ["starter", "professional", "business", "enterprise"];

const TOPUP_OPTIONS = [
  { key: "marketing_sms", label: "SMS Budget", desc: "1 credit = 10 marketing SMS", icon: "💬" },
  { key: "marketing_scan", label: "Scan Budget", desc: "1 credit = 1,000 patient scans", icon: "🔍" },
  { key: "premium_ai", label: "Premium AI", desc: "1 credit = 0.25 conversations (4 each)", icon: "✨" },
  { key: "general", label: "General (any service)", desc: "Works for SMS, scans, or Premium AI", icon: "🔄" },
];

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

interface OveragePurchaseProps {
  onPurchased: () => void;
  subscriptionPlan: string;
  billingCycleStart: string | null;
}

export default function OveragePurchase({ onPurchased, subscriptionPlan }: OveragePurchaseProps) {
  const [amount, setAmount] = useState(10);
  const [feature, setFeature] = useState("general");
  const [purchasing, setPurchasing] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const btnContainerRef = useRef<HTMLDivElement>(null);
  const renderedBtnRef = useRef<{ close: () => Promise<void> } | null>(null);

  const isSubscription = SUBSCRIPTION_PLANS.includes(subscriptionPlan);
  const showPremiumAi = subscriptionPlan === "business" || subscriptionPlan === "enterprise";
  const totalPrice = amount; // $1 per credit

  // PayPal SDK is loaded by SubscriptionManager — just check if it's ready
  useEffect(() => {
    if (window.paypal) {
      setSdkReady(true);
      return;
    }
    // Poll briefly in case SDK is still loading
    const interval = setInterval(() => {
      if (window.paypal) { setSdkReady(true); clearInterval(interval); }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Render PayPal button when amount or feature changes
  useEffect(() => {
    if (!sdkReady || !window.paypal || !btnContainerRef.current) return;

    // Clean up old button
    if (renderedBtnRef.current) {
      renderedBtnRef.current.close().catch(() => {});
      renderedBtnRef.current = null;
    }
    btnContainerRef.current.innerHTML = "";

    const btn = window.paypal.Buttons({
      style: { layout: "horizontal", label: "pay", height: 40, tagline: false },
      createOrder: (
        _data: unknown,
        actions: { order: { create: (opts: Record<string, unknown>) => Promise<string> } }
      ) => {
        return actions.order.create({
          purchase_units: [{
            amount: { value: String(totalPrice), currency_code: "USD" },
            description: isSubscription
              ? `Hilt Health ${TOPUP_OPTIONS.find((o) => o.key === feature)?.label || "budget"} top up (${amount} credits)`
              : `Hilt Health credits (${amount})`,
          }],
        });
      },
      onApprove: async (data: { orderID: string }) => {
        setPurchasing(true);
        try {
          // Server captures payment + verifies + credits account
          const result = await captureAndCreditPurchase(
            data.orderID,
            amount,
            isSubscription ? feature : undefined
          );

          if (result?.success) {
            const label = isSubscription
              ? TOPUP_OPTIONS.find((o) => o.key === feature)?.label || "budget"
              : "credits";
            toast.success(`Added ${amount} to ${label}`);
            onPurchased();
          } else {
            toast.error(result?.error || "Payment processed but credits could not be added. Contact support.");
          }
        } catch {
          toast.error("Payment failed. Please try again.");
        }
        setPurchasing(false);
      },
      onError: () => {
        toast.error("PayPal checkout failed. Please try again.");
      },
    });

    btn.render(btnContainerRef.current);
    renderedBtnRef.current = btn;

    return () => {
      if (renderedBtnRef.current) {
        renderedBtnRef.current.close().catch(() => {});
        renderedBtnRef.current = null;
      }
    };
  }, [sdkReady, amount, feature, isSubscription, totalPrice, onPurchased]);

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
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
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
        <p className="text-sm font-medium text-ink">${totalPrice} USD</p>
      </div>

      {purchasing ? (
        <div className="flex items-center justify-center py-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-hilt-blue mr-2" />
          <span className="text-sm text-slate">Processing payment...</span>
        </div>
      ) : (
        <div ref={btnContainerRef} className="min-h-[45px]" />
      )}

      <p className="text-xs text-slate mt-3">
        {isSubscription
          ? `$1 each. ${TOPUP_OPTIONS.find((o) => o.key === feature)?.desc || ""} Top ups do not expire.`
          : "Credits are $1 each. Added immediately after payment."}
      </p>
    </div>
  );
}
