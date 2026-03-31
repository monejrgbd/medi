"use client";

import { useState } from "react";
import { DISCOVERY_SOURCE_OPTIONS } from "@/lib/constants";
import { useLanguage } from "@/contexts/LanguageContext";

interface DiscoveryQuestionScreenProps {
  showReferral: boolean;
  showDiscovery: boolean;
  onComplete: (wasReferred: boolean, referredBy: string, discoverySource: string | null) => void | Promise<void>;
  language: string;
}

export default function DiscoveryQuestionScreen({
  showReferral,
  showDiscovery,
  onComplete,
}: DiscoveryQuestionScreenProps) {
  const [wasReferred, setWasReferred] = useState(false);
  const [referredBy, setReferredBy] = useState("");
  const [selected, setSelected] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { t } = useLanguage();

  async function handleContinue() {
    setSubmitting(true);
    await onComplete(wasReferred, referredBy, selected || null);
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-ink">One more thing</h2>
      </div>

      <div className="space-y-5">
        {showReferral && (
          <div className="rounded-lg border border-gray-200 px-4 py-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={wasReferred}
                onChange={(e) => setWasReferred(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
              />
              <span className="text-sm font-medium text-ink">{t("checkin.wasReferred")}</span>
            </label>
            {wasReferred && (
              <input
                type="text"
                placeholder={t("checkin.referredBy")}
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value)}
                maxLength={200}
                className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
              />
            )}
          </div>
        )}

        {showDiscovery && (
          <div>
            <p className="text-sm font-medium text-ink mb-3">{t("checkin.discoveryQuestion")}</p>
            <div className="space-y-2">
              {DISCOVERY_SOURCE_OPTIONS.map((option) => (
                <label
                  key={option}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 cursor-pointer transition-colors ${
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
          </div>
        )}
      </div>

      <button
        onClick={handleContinue}
        disabled={submitting}
        className="mt-6 w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? "Continuing..." : "Continue"}
      </button>
    </div>
  );
}
