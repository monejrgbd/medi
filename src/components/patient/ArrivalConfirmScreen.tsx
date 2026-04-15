"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { MapPin } from "lucide-react";

interface ArrivalConfirmScreenProps {
  visitId: string;
  sessionToken: string;
  locationName: string;
  onArrived?: (newStatus: string) => void;
}

export default function ArrivalConfirmScreen({
  visitId,
  sessionToken,
  locationName,
  onArrived,
}: ArrivalConfirmScreenProps) {
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleArrive = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("confirm_arrival", {
      p_visit_id: visitId,
      p_session_token: sessionToken,
    });
    if (rpcError || !data?.success) {
      setError((data as { error?: string })?.error || rpcError?.message || t("arrival.error"));
      setSubmitting(false);
      return;
    }
    // Transition immediately based on the server-resolved next status so the
    // patient does not wait up to 5 seconds for the polling fallback.
    const nextStatus = (data as { status?: string })?.status;
    if (nextStatus && onArrived) onArrived(nextStatus);
  };

  return (
    <div className="w-full max-w-md text-center" role="status" aria-live="polite">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
        <MapPin className="h-8 w-8 text-emerald-600" aria-hidden="true" />
      </div>

      <h2 className="text-xl font-bold text-ink mb-2">{t("arrival.title")}</h2>
      <p className="text-sm text-slate mb-6">
        {t("arrival.subtitle").replace("{location}", locationName)}
      </p>

      <button
        onClick={handleArrive}
        disabled={submitting}
        className="w-full rounded-lg bg-hilt-blue px-6 py-4 text-base font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
      >
        {submitting ? t("arrival.submitting") : t("arrival.button")}
      </button>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <p className="mt-6 text-xs text-ash">{t("arrival.notice")}</p>
    </div>
  );
}
