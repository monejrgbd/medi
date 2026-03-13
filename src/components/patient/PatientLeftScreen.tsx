"use client";

import { useLanguage } from "@/contexts/LanguageContext";

interface PatientLeftScreenProps {
  onRetry: () => void;
}

export default function PatientLeftScreen({ onRetry }: PatientLeftScreenProps) {
  const { t } = useLanguage();

  return (
    <div className="w-full max-w-md text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <svg
          className="h-8 w-8 text-slate"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-ink mb-2">{t("left.title")}</h2>
      <p className="text-sm text-slate mb-6">{t("left.subtitle")}</p>
      <button
        onClick={onRetry}
        className="rounded-xl bg-hilt-blue px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        {t("left.newCheckin")}
      </button>
    </div>
  );
}
