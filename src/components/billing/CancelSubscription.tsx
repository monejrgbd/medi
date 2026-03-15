"use client";

import { useState } from "react";
import { cancelSubscription } from "@/app/(dashboard)/d/_actions/billing";
import { toast } from "sonner";

interface CancelSubscriptionProps {
  orgId: string;
  currentPlan: string;
  cancelAtPeriodEnd?: string | null;
  onCancelled: () => void;
}

export default function CancelSubscription({
  orgId,
  currentPlan,
  cancelAtPeriodEnd,
  onCancelled,
}: CancelSubscriptionProps) {
  const [step, setStep] = useState<"idle" | "confirm">("idle");
  const [cancelling, setCancelling] = useState(false);

  const isBlocked = ["expired", "suspended"].includes(currentPlan);

  async function handleCancel() {
    setCancelling(true);
    const result = await cancelSubscription(orgId);
    setCancelling(false);

    if (result?.success) {
      toast.success("Subscription cancellation scheduled");
      setStep("idle");
      onCancelled();
    } else {
      toast.error(result?.error || "Failed to cancel subscription");
    }
  }

  if (isBlocked) return null;

  // Already pending cancel
  if (cancelAtPeriodEnd) {
    const endDate = new Date(cancelAtPeriodEnd).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-6">
        <h2 className="text-lg font-semibold text-ink mb-2">
          Cancellation Scheduled
        </h2>
        <p className="text-sm text-slate">
          Your subscription will end on <span className="font-medium text-ink">{endDate}</span>.
          You have full access until then. After that, your dashboard remains accessible but
          AI features will be unavailable without credits.
        </p>
        <p className="text-sm text-slate mt-2">
          To resubscribe, choose a plan above.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-100 bg-red-50/50 p-6">
      <h2 className="text-lg font-semibold text-ink mb-2">
        Cancel Subscription
      </h2>

      {step === "idle" ? (
        <>
          <p className="text-sm text-slate mb-4">
            Cancel your subscription. You&apos;ll keep full access until the end of
            your current billing period.
          </p>
          <button
            onClick={() => setStep("confirm")}
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Cancel Subscription
          </button>
        </>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg bg-red-100 border border-red-200 p-3">
            <p className="text-sm text-red-700 font-medium">
              Are you sure you want to cancel?
            </p>
            <ul className="text-xs text-red-600 mt-2 space-y-1 list-disc list-inside">
              <li>You keep full access until the end of your billing period</li>
              <li>After that, AI features stop (no credits)</li>
              <li>Dashboard and patient data remain accessible</li>
              <li>You can resubscribe anytime</li>
            </ul>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {cancelling ? "Cancelling..." : "Yes, Cancel"}
            </button>
            <button
              onClick={() => setStep("idle")}
              disabled={cancelling}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-ink hover:bg-gray-50 transition-colors"
            >
              Keep Subscription
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
