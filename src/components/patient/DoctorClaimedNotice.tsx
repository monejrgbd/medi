"use client";

import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Check } from "lucide-react";

interface DoctorClaimedNoticeProps {
  staffRoom?: string | null;
  claimerRole?: "doctor" | "nurse" | null;
}

export default function DoctorClaimedNotice({ staffRoom = null, claimerRole = null }: DoctorClaimedNoticeProps) {
  const { t } = useLanguage();

  const roomText = staffRoom && staffRoom.trim()
    ? t("claimed.go_to_room").replace("{room}", staffRoom.trim())
    : null;

  const titleKey = claimerRole === "nurse" ? "claimed.title_nurse" : "claimed.title";

  useEffect(() => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification(t(titleKey), {
          body: roomText ?? t("claimed.subtitle"),
        });
      } catch {
        // Notification API not available
      }
    }
  }, [t, roomText, titleKey]);

  return (
    <div className="w-full max-w-md text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <Check className="h-12 w-12 text-green-600" />
      </div>

      <h2 className="text-2xl font-bold text-ink mb-2">
        {t(titleKey)}
      </h2>

      <p className="text-sm text-slate">
        {t("claimed.subtitle")}
      </p>

      {roomText && (
        <p className="mt-3 text-base font-semibold text-ink">
          {roomText}
        </p>
      )}
    </div>
  );
}
