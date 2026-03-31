"use client";

import { useState } from "react";
import { DISCOVERY_SOURCE_OPTIONS } from "@/lib/constants";
import { useLanguage } from "@/contexts/LanguageContext";

interface DiscoveryQuestionScreenProps {
  onSelect: (source: string) => void;
  onSkip: () => void;
  language: string;
}

export default function DiscoveryQuestionScreen({
  onSelect,
  onSkip,
  language,
}: DiscoveryQuestionScreenProps) {
  const [selected, setSelected] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { t } = useLanguage();

  async function handleContinue() {
    if (!selected) return;
    setSubmitting(true);
    await onSelect(selected);
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h2 className="text-xl font-bold text-ink">
          {t("checkin.discoveryQuestion")}
        </h2>
      </div>

      <div className="space-y-3">
        {DISCOVERY_SOURCE_OPTIONS.map((option) => (
          <label
            key={option}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
              selected === option
                ? "border-hilt-blue bg-blue-50 text-hilt-blue"
                : "border-gray-200 text-ink hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="discovery"
              value={option}
              checked={selected === option}
              onChange={(e) => setSelected(e.target.value)}
              className="sr-only"
            />
            <span className="text-sm font-medium">
              {t(`checkin.discovery.${option}`) || option}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <button
          onClick={handleContinue}
          disabled={!selected || submitting}
          className="w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? t("checkin.submit") + "..." : t("checkin.submit")}
        </button>
        <button
          onClick={onSkip}
          disabled={submitting}
          className="w-full rounded-lg px-4 py-2 text-sm text-slate hover:text-ink transition-colors"
        >
          {t("checkin.skip") || "Skip"}
        </button>
      </div>
    </div>
  );
}
