"use client";

import { useState } from "react";
import LanguagePicker from "./LanguagePicker";

interface LanguageSwitcherProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  loading?: boolean;
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  it: "Italiano",
  ja: "日本語",
  ko: "한국어",
  zh: "中文",
  nl: "Nederlands",
  ru: "Русский",
  ar: "العربية",
  hi: "हिन्दी",
  tr: "Türkçe",
  vi: "Tiếng Việt",
  th: "ไทย",
  id: "Bahasa Indonesia",
  pl: "Polski",
  sv: "Svenska",
  uk: "Українська",
};

export default function LanguageSwitcher({
  currentLanguage,
  onLanguageChange,
  loading,
}: LanguageSwitcherProps) {
  const [showPicker, setShowPicker] = useState(false);

  if (showPicker) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
          <LanguagePicker
            onSelect={(lang) => {
              onLanguageChange(lang);
              setShowPicker(false);
            }}
            loading={loading || false}
          />
          <button
            onClick={() => setShowPicker(false)}
            className="mt-3 w-full text-sm text-slate hover:text-ink"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowPicker(true)}
      className="flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-200 px-3 py-1 text-xs text-slate hover:bg-gray-100 transition-colors"
    >
      <span>🌐</span>
      <span>{LANGUAGE_LABELS[currentLanguage] || currentLanguage}</span>
    </button>
  );
}
