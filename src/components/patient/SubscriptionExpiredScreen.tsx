"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export default function SubscriptionExpiredScreen() {
  const { t } = useLanguage();

  return (
    <div className="w-full max-w-md text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
        <svg
          className="h-8 w-8 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-ink mb-2">
        {t("subscription_expired.title")}
      </h2>
      <p className="text-sm text-slate">
        {t("subscription_expired.subtitle")}
      </p>
    </div>
  );
}
