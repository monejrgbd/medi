"use client";

import { useLanguage } from "@/contexts/LanguageContext";

interface DenialScreenProps {
  onRetry: () => void;
}

export default function DenialScreen({ onRetry }: DenialScreenProps) {
  const { t } = useLanguage();

  return (
    <div className="w-full max-w-md text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
        <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-ink mb-2">
        {t("denied.title")}
      </h2>
      <p className="text-sm text-slate mb-6">
        {t("denied.subtitle")}
      </p>

      <button
        onClick={onRetry}
        className="rounded-lg bg-hilt-blue px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        {t("denied.retry")}
      </button>
    </div>
  );
}
