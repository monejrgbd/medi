"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Check, Monitor, ArrowLeft } from "lucide-react";

interface PatientQueueViewProps {
  queuePosition: number | null;
  estimatedWait: number | null;
  visitId: string;
  sessionToken: string;
  queueDisplay?: string | null;
  showTvPreview?: boolean;
}

export default function PatientQueueView({
  queuePosition,
  estimatedWait,
  visitId,
  sessionToken,
  queueDisplay,
  showTvPreview,
}: PatientQueueViewProps) {
  const [showingTv, setShowingTv] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifRequested, setNotifRequested] = useState(false);
  const [canShowNotifButton, setCanShowNotifButton] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      setCanShowNotifButton(true);
    }
  }, []);

  const peopleAhead =
    queuePosition !== null && queuePosition > 0 ? queuePosition - 1 : null;

  // Request notification permission
  async function requestNotification() {
    if (typeof Notification !== "undefined") {
      await Notification.requestPermission();
    }
    setNotifRequested(true);
    setCanShowNotifButton(false);
  }

  async function handleSubmitAddendum() {
    const trimmed = content.trim();
    if (!trimmed) return;
    if (trimmed.length > 2000) {
      setError("Maximum 2,000 characters");
      return;
    }

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("add_addendum", {
      p_visit_id: visitId,
      p_session_token: sessionToken,
      p_content: trimmed,
    });

    setSubmitting(false);

    if (rpcError || !data?.success) {
      setError(data?.error || "Failed to add details");
      return;
    }

    setContent("");
    setSubmitted(true);
    setShowForm(false);
  }

  if (showingTv && queueDisplay) {
    return (
      <div className="w-full max-w-md" role="status">
        <button
          onClick={() => setShowingTv(false)}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-hilt-blue hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to patient view
        </button>
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex min-h-[320px] flex-col bg-gray-50">
            <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
              <h1 className="text-sm font-bold text-gray-900">Smith Family Clinic</h1>
              <time className="text-xs font-medium tabular-nums text-gray-500">
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </time>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4">
              <section>
                <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Now Serving</h2>
                <div className="flex flex-wrap gap-2">
                  <div className="flex min-w-[80px] items-center justify-center rounded-2xl bg-emerald-500 px-6 py-4 shadow-lg">
                    <span className="text-3xl font-black text-white">{queueDisplay}</span>
                  </div>
                </div>
              </section>
              <section className="flex-1">
                <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Up Next</h2>
                <div className="flex flex-wrap gap-2">
                  {[parseInt(queueDisplay.replace(/\D/g, ""), 10) + 1, parseInt(queueDisplay.replace(/\D/g, ""), 10) + 2].map((n) => (
                    <div key={n} className="flex min-w-[50px] items-center justify-center rounded-xl bg-white px-3 py-2 shadow-sm border border-gray-200">
                      <span className="text-lg font-bold text-gray-700">{n}</span>
                    </div>
                  ))}
                </div>
              </section>
            </main>
          </div>
          <div className="bg-white px-4 py-2 border-t border-gray-200">
            <p className="text-[10px] text-gray-400 text-center">This is what your waiting room TV shows</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md text-center" role="status" aria-live="polite">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
        <Check className="h-8 w-8 text-green-600" />
      </div>

      {queueDisplay && (
        <div className="mb-4 inline-block rounded-xl bg-gray-100 px-6 py-3">
          <p className="text-xs text-ash mb-0.5">Your number</p>
          <p className="text-3xl font-black tabular-nums text-ink">{queueDisplay}</p>
        </div>
      )}

      <h2 className="text-xl font-bold text-ink mb-2">
        {t("queue.title")}
      </h2>

      {/* Position with pulse animation */}
      {peopleAhead !== null ? (
        <div className="mb-1">
          {peopleAhead === 0 ? (
            <p className="text-lg font-semibold text-green-600 animate-pulse">
              {t("queue.next")}
            </p>
          ) : (
            <p className="text-sm text-slate">
              <span className="inline-flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hilt-blue opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-hilt-blue" />
                </span>
                {t("queue.ahead")
                  .replace("{count}", String(peopleAhead))
                  .replace("{people}", peopleAhead === 1 ? t("queue.person") : t("queue.people"))}
              </span>
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate mb-1">
          {t("queue.doctorSoon")}
        </p>
      )}

      {estimatedWait !== null && (
        <p className="text-sm text-slate">
          {t("queue.estimatedWait").replace("{minutes}", String(Math.round(estimatedWait)))}
        </p>
      )}

      <p className="mt-4 text-xs text-ash">
        {t("queue.liveUpdate")}
      </p>

      <div className="mt-4 flex flex-col items-center gap-3">
        {/* Notification request */}
        {!notifRequested && canShowNotifButton && (
          <button
            onClick={requestNotification}
            className="text-sm text-hilt-blue hover:underline"
          >
            {t("queue.enableNotif")}
          </button>
        )}

        {/* View on TV button (demo only) */}
        {showTvPreview && queueDisplay && !showingTv && (
          <div className="flex flex-col items-center gap-0.5">
            <button
              onClick={() => setShowingTv(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-hilt-blue hover:underline"
            >
              <Monitor className="h-3.5 w-3.5" />
              View on TV
            </button>
            <p className="text-[10px] text-ash">Your clinic gets a guide to display this on the lobby TV with custom video</p>
          </div>
        )}
      </div>

      {/* Add more details — visible card instead of hidden link */}
      <div className="mt-6">
        {submitted && !showForm && (
          <p className="text-sm text-green-600 mb-2">{t("queue.detailsAdded")}</p>
        )}

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-slate hover:border-hilt-blue hover:text-hilt-blue transition-colors"
          >
            <svg className="mx-auto mb-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t("queue.addDetails")}
          </button>
        ) : (
          <div className="text-left rounded-lg border border-gray-200 bg-white p-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("queue.addDetailsPlaceholder")}
              rows={4}
              maxLength={2000}
              aria-label={t("queue.addDetailsPlaceholder")}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none resize-none"
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-slate">{content.length} / 2,000</p>
              {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setShowForm(false);
                  setContent("");
                  setError(null);
                }}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate hover:bg-gray-50"
              >
                {t("queue.cancel")}
              </button>
              <button
                onClick={handleSubmitAddendum}
                disabled={submitting || !content.trim()}
                className="flex-1 rounded-lg bg-hilt-blue px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? t("queue.sending") : t("queue.submit")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
