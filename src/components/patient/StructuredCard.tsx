"use client";

import { useLanguage } from "@/contexts/LanguageContext";

interface StructuredCardData {
  chief_complaint?: string | null;
  onset?: string | null;
  duration?: string | null;
  severity?: string | null;
  location?: string | null;
  associated_symptoms?: string | string[] | null;
  aggravating_factors?: string | string[] | null;
  relieving_factors?: string | string[] | null;
  tried?: string | string[] | null;
}

interface StructuredCardProps {
  data: StructuredCardData;
}

function formatValue(val: string | string[] | null | undefined): string {
  if (!val) return "—";
  if (Array.isArray(val)) return val.join(", ") || "—";
  return val;
}

const FIELDS: { key: keyof StructuredCardData; i18nKey: string }[] = [
  { key: "chief_complaint", i18nKey: "card.chiefComplaint" },
  { key: "onset", i18nKey: "card.onset" },
  { key: "duration", i18nKey: "card.duration" },
  { key: "severity", i18nKey: "card.severity" },
  { key: "location", i18nKey: "card.location" },
  { key: "associated_symptoms", i18nKey: "card.associatedSymptoms" },
  { key: "aggravating_factors", i18nKey: "card.aggravatingFactors" },
  { key: "relieving_factors", i18nKey: "card.relievingFactors" },
  { key: "tried", i18nKey: "card.tried" },
];

export default function StructuredCard({ data }: StructuredCardProps) {
  const { t } = useLanguage();

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-ink">{t("card.title")}</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {FIELDS.map(({ key, i18nKey }) => (
          <div key={key} className="flex px-4 py-2.5">
            <span className="text-xs font-medium text-slate w-36 shrink-0">
              {t(i18nKey)}
            </span>
            <span className="text-sm text-ink">{formatValue(data[key])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
