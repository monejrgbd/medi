"use client";

import { useLanguage } from "@/contexts/LanguageContext";

interface WaitingApprovalProps {
  patientFirstName: string;
  locationName: string;
  onCancel?: () => void;
  queueDisplay?: string | null;
}

export default function WaitingApproval({
  patientFirstName,
  locationName,
  onCancel,
  queueDisplay,
}: WaitingApprovalProps) {
  const { t } = useLanguage();

  return (
    <div className="w-full max-w-md text-center" role="status" aria-live="polite">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-hilt-blue" />
      </div>

      {queueDisplay && (
        <div className="mb-4 inline-block rounded-xl bg-gray-100 px-6 py-3">
          <p className="text-xs text-ash mb-0.5">Your number</p>
          <p className="text-3xl font-black tabular-nums text-ink">{queueDisplay}</p>
        </div>
      )}

      <h2 className="text-xl font-bold text-ink mb-2">
        {t("waiting.title")}
      </h2>
      <p className="text-sm text-slate mb-6">
        {t("waiting.subtitle")}
      </p>

      <div className="rounded-lg border border-gray-100 bg-white p-4">
        <p className="text-xs text-ash">
          {t("waiting.notice")}
        </p>
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-4 text-xs text-ash hover:text-slate transition-colors"
        >
          {t("waiting.cancel")}
        </button>
      )}
    </div>
  );
}
