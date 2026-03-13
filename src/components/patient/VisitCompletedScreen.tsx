"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface VisitCompletedScreenProps {
  onAutoReset: () => void;
}

const COUNTDOWN_SECONDS = 10;

export default function VisitCompletedScreen({
  onAutoReset,
}: VisitCompletedScreenProps) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const { t } = useLanguage();
  const onAutoResetRef = useRef(onAutoReset);
  onAutoResetRef.current = onAutoReset;

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onAutoResetRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-md text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
        <svg
          className="h-8 w-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-ink mb-2">
        {t("completed.title")}
      </h2>
      <p className="text-sm text-slate mb-4">{t("completed.subtitle")}</p>
      <p className="text-xs text-ash">
        {t("completed.countdown").replace("{seconds}", String(secondsLeft))}
      </p>
    </div>
  );
}
