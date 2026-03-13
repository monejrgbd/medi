"use client";

import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DoctorClaimedNotice() {
  const { t } = useLanguage();

  useEffect(() => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification(t("claimed.title"), {
          body: t("claimed.subtitle"),
        });
      } catch {
        // Notification API not available
      }
    }
  }, [t]);

  return (
    <div className="w-full max-w-md text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <span className="text-5xl text-green-600">&#10003;</span>
      </div>

      <h2 className="text-2xl font-bold text-ink mb-2">
        {t("claimed.title")}
      </h2>

      <p className="text-sm text-slate">
        {t("claimed.subtitle")}
      </p>
    </div>
  );
}
