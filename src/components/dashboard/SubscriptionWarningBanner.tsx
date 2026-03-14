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
    text: "Your subscription has ended. Renew to continue using AI features.",
    color: "bg-red-50 border-red-200 text-red-800",
    ownerAction: "Renew now",
  },
};

export default function SubscriptionWarningBanner() {
  const { org, isOwner } = useRole();

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
