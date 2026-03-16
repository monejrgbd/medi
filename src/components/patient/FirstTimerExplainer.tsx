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
      <h2 className="text-lg font-bold text-ink mb-3 text-center">
        {t("firstTimer.title")}
      </h2>

      <div className="rounded-lg border border-gray-100 bg-white divide-y divide-gray-100 mb-4">
        {([1, 2, 3, 4] as const).map((n) => (
          <div key={n} className="flex gap-3 px-4 py-2.5">
            <span className="text-sm font-semibold text-hilt-blue flex-shrink-0 w-5">{n}.</span>
            <div>
              <p className="text-sm font-medium text-ink">{t(`firstTimer.step${n}Title`)}</p>
              <p className="text-xs text-slate">{t(`firstTimer.step${n}`)}</p>
            </div>
          </div>
        ))}
      </div>

      <label className="flex items-start gap-3 mb-4 cursor-pointer">
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
