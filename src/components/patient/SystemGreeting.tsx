"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

// Locales we have bundled translations for. Anything outside this set falls
// back to English in t() — we translate via the edge function instead so the
// greeting is still rendered in the patient's selected language.
const BUNDLED_LOCALES = new Set([
  "en", "es", "fr", "ar", "zh", "ko", "vi", "pt", "ru", "hi",
]);

interface SystemGreetingProps {
  patientName: string;
  clinicName: string;
  sessionToken?: string | null;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Module-level cache so we only translate once per (language, template) pair.
const translationCache = new Map<string, string>();

export default function SystemGreeting({ patientName, clinicName, sessionToken }: SystemGreetingProps) {
  const { t, language } = useLanguage();

  const renderedGreeting = t("greeting")
    .replace("{name}", patientName)
    .replace("{clinic}", clinicName);

  const needsTranslation = !BUNDLED_LOCALES.has(language);
  const cacheKey = `${language}::${renderedGreeting}`;
  const [display, setDisplay] = useState<string>(() =>
    needsTranslation && translationCache.has(cacheKey)
      ? translationCache.get(cacheKey)!
      : renderedGreeting
  );

  useEffect(() => {
    if (!needsTranslation) {
      setDisplay(renderedGreeting);
      return;
    }
    if (translationCache.has(cacheKey)) {
      setDisplay(translationCache.get(cacheKey)!);
      return;
    }
    if (!sessionToken) return; // no way to auth the translate call

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/translate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "x-session-token": sessionToken,
          },
          body: JSON.stringify({
            action: "translate",
            text: renderedGreeting,
            from: "en",
            to: language,
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        const translated: string | undefined = data?.translated_text;
        if (!translated) return;
        translationCache.set(cacheKey, translated);
        if (!cancelled) setDisplay(translated);
      } catch {
        // Swallow: fall back to English greeting.
      }
    })();

    return () => { cancelled = true; };
  }, [cacheKey, needsTranslation, renderedGreeting, language, sessionToken]);

  return (
    <div className="flex justify-start mb-3">
      <div className="rounded-2xl rounded-bl-md bg-gray-100 text-ink px-4 py-2.5 max-w-[80%]">
        <p className="text-sm whitespace-pre-wrap break-words">{display}</p>
      </div>
    </div>
  );
}
