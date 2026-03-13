"use client";

import { useRole } from "@/contexts/RoleContext";

const MESSAGES: Record<string, { text: string; color: string }> = {
  read_only: {
    text: "Your subscription payment has failed. Service is limited to viewing existing data. Contact your administrator.",
    color: "bg-amber-50 border-amber-200 text-amber-800",
  },
  suspended: {
    text: "Your account has been suspended. Contact support to restore access.",
    color: "bg-red-50 border-red-200 text-red-800",
  },
  expired: {
    text: "Your subscription has ended. Renew to continue using AI features.",
    color: "bg-red-50 border-red-200 text-red-800",
  },
};

export default function SubscriptionWarningBanner() {
  const { org } = useRole();

  const config = MESSAGES[org.subscription_plan];
  if (!config) return null;

  return (
    <div
      className={`border-b ${config.color} px-4 py-3 text-center text-sm font-medium`}
    >
      {config.text}
    </div>
  );
}
