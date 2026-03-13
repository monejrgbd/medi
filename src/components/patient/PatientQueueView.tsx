"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface PatientQueueViewProps {
  queuePosition: number | null;
  estimatedWait: number | null;
  visitId: string;
  sessionToken: string;
}

export default function PatientQueueView({
  queuePosition,
  estimatedWait,
  visitId,
  sessionToken,
}: PatientQueueViewProps) {
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

  return (
    <div className="w-full max-w-md text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
        <span className="text-3xl text-green-600">&#10003;</span>
      </div>

      <h2 className="text-xl font-bold text-ink mb-2">
        {t("queue.title")}
      </h2>

      {peopleAhead !== null ? (
        <p className="text-sm text-slate mb-1">
          {peopleAhead === 0
            ? t("queue.next")
            : t("queue.ahead")
                .replace("{count}", String(peopleAhead))
                .replace("{people}", peopleAhead === 1 ? t("queue.person") : t("queue.people"))}
        </p>
      ) : (
        <p className="text-sm text-slate mb-1">
          {t("queue.doctorSoon")}
        </p>
      )}

      {estimatedWait !== null ? (
        <p className="text-sm text-slate">
          {t("queue.estimatedWait").replace("{minutes}", String(Math.round(estimatedWait)))}
        </p>
      ) : (
        <p className="text-sm text-ash">{t("queue.waitUnavailable")}</p>
      )}

      <p className="mt-4 text-xs text-ash">
        {t("queue.liveUpdate")}
      </p>

      {/* Notification request */}
      {!notifRequested && canShowNotifButton && (
          <button
            onClick={requestNotification}
            className="mt-4 text-sm text-hilt-blue hover:underline"
          >
            {t("queue.enableNotif")}
          </button>
        )}

      {/* Add more details */}
      <div className="mt-6">
        {submitted && !showForm && (
          <p className="text-sm text-green-600 mb-2">{t("queue.detailsAdded")}</p>
        )}

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm font-medium text-hilt-blue hover:underline"
          >
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
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none resize-none"
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-slate">{content.length} / 2,000</p>
              {error && <p className="text-xs text-red-600">{error}</p>}
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
