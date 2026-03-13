"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface FirstTimerExplainerProps {
  onContinue: () => void;
}

export default function FirstTimerExplainer({
  onContinue,
}: FirstTimerExplainerProps) {
  const [consented, setConsented] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="w-full max-w-md">
      <h2 className="text-xl font-bold text-ink mb-4 text-center">
        {t("firstTimer.title")}
      </h2>

      <div className="space-y-4 mb-6">
        <div className="flex gap-3 rounded-lg border border-gray-100 bg-white p-4">
          <span className="text-xl flex-shrink-0">1.</span>
          <div>
            <p className="text-sm font-medium text-ink mb-0.5">{t("firstTimer.step1Title")}</p>
            <p className="text-sm text-slate">{t("firstTimer.step1")}</p>
          </div>
        </div>

        <div className="flex gap-3 rounded-lg border border-gray-100 bg-white p-4">
          <span className="text-xl flex-shrink-0">2.</span>
          <div>
            <p className="text-sm font-medium text-ink mb-0.5">{t("firstTimer.step2Title")}</p>
            <p className="text-sm text-slate">{t("firstTimer.step2")}</p>
          </div>
        </div>

        <div className="flex gap-3 rounded-lg border border-gray-100 bg-white p-4">
          <span className="text-xl flex-shrink-0">3.</span>
          <div>
            <p className="text-sm font-medium text-ink mb-0.5">{t("firstTimer.step3Title")}</p>
            <p className="text-sm text-slate">{t("firstTimer.step3")}</p>
          </div>
        </div>

        <div className="flex gap-3 rounded-lg border border-gray-100 bg-white p-4">
          <span className="text-xl flex-shrink-0">4.</span>
          <div>
            <p className="text-sm font-medium text-ink mb-0.5">{t("firstTimer.step4Title")}</p>
            <p className="text-sm text-slate">{t("firstTimer.step4")}</p>
          </div>
        </div>
      </div>

      <label className="flex items-start gap-3 mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={consented}
          onChange={(e) => setConsented(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
        />
        <span className="text-sm text-slate">
          {t("firstTimer.consent")}
        </span>
      </label>

      <button
        onClick={onContinue}
        disabled={!consented}
        className="w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {t("firstTimer.continue")}
      </button>
    </div>
  );
}
