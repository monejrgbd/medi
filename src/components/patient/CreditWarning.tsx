"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { AlertTriangle } from "lucide-react";

export default function CreditWarning() {
  const { t } = useLanguage();

  return (
    <div className="w-full max-w-md text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
      </div>
      <h2 className="text-xl font-bold text-ink mb-2">
        {t("credit.title")}
      </h2>
      <p className="text-sm text-slate mb-4">
        {t("credit.subtitle")}
      </p>
      <div className="rounded-lg border border-gray-100 bg-white p-4">
        <p className="text-xs text-ash">
          {t("credit.notice")}
        </p>
      </div>
    </div>
  );
}
