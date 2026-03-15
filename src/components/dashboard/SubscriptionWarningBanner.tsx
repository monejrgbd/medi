"use client";

import Link from "next/link";
import { useRole } from "@/contexts/RoleContext";

const MESSAGES: Record<string, { text: string; color: string; ownerAction?: string }> = {
  read_only: {
    text: "Your subscription payment has failed. Service is limited to viewing existing data.",
    color: "bg-amber-50 border-amber-200 text-amber-800",
    ownerAction: "Update billing",
  },
  suspended: {
    text: "Your account has been suspended due to non-payment.",
    color: "bg-red-50 border-red-200 text-red-800",
    ownerAction: "Resolve billing",
  },
  expired: {
    text: "Your account has been deactivated. Resubscribe to restore access.",
    color: "bg-red-50 border-red-200 text-red-800",
    ownerAction: "Reactivate",
  },
};

export default function SubscriptionWarningBanner() {
  const { org, isOwner } = useRole();

  // Pending cancel — plan still active
  if (org.cancel_at_period_end) {
    const endDate = new Date(org.cancel_at_period_end).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    return (
      <div
        role="alert"
        aria-live="polite"
        className="border-b bg-amber-50 border-amber-200 text-amber-800 px-4 py-3 text-center text-sm font-medium"
      >
        Your subscription ends on {endDate}. Dashboard remains accessible after that date.
        {isOwner && (
          <Link href="/d/owner/billing" className="ml-2 underline hover:no-underline">
            Manage billing &rarr;
          </Link>
        )}
      </div>
    );
  }

  const config = MESSAGES[org.subscription_plan];
  if (!config) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`border-b ${config.color} px-4 py-3 text-center text-sm font-medium`}
    >
      {config.text}
      {isOwner && config.ownerAction ? (
        <Link href="/d/owner/billing" className="ml-2 underline hover:no-underline">
          {config.ownerAction} &rarr;
        </Link>
      ) : !isOwner ? (
        <span className="ml-1">Contact your administrator.</span>
      ) : null}
    </div>
  );
}
