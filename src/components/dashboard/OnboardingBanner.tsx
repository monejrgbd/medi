"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/contexts/RoleContext";
import { X } from "lucide-react";

const STORAGE_KEY = "hilt_onboarding_banner_dismissed";

export default function OnboardingBanner() {
  const { org, isOwner } = useRole();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  if (!isOwner) return null;
  if (org.onboarding_completed_at) return null;
  if (pathname.startsWith("/d/onboarding")) return null;
  if (dismissed) return null;

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  }

  return (
    <div
      role="status"
      className="border-b bg-blue-50 border-blue-200 px-4 py-2.5 text-sm flex items-center justify-center gap-2"
    >
      <span className="text-blue-800">
        You have not finished setting up your clinic.
      </span>
      <Link
        href="/d/onboarding"
        className="font-semibold text-blue-800 underline hover:no-underline"
      >
        Complete onboarding
      </Link>
      <button
        onClick={handleDismiss}
        className="ml-1 p-1 rounded hover:bg-blue-100 transition-colors text-blue-600"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
