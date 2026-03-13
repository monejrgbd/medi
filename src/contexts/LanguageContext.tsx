"use client";

import { createContext, useContext, useMemo } from "react";
import { t as translate } from "@/lib/i18n";

interface LanguageContextValue {
  language: string;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  t: (key: string) => key,
});

export function LanguageProvider({
  children,
  language,
}: {
  children: React.ReactNode;
  language: string;
}) {
  const value = useMemo(() => ({
    language,
    t: (key: string) => translate(key, language),
  }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
