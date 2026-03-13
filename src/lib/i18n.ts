import en from "@/locales/en.json";
import es from "@/locales/es.json";
import fr from "@/locales/fr.json";
import ar from "@/locales/ar.json";
import zh from "@/locales/zh.json";
import ko from "@/locales/ko.json";
import vi from "@/locales/vi.json";
import pt from "@/locales/pt.json";
import ru from "@/locales/ru.json";
import hi from "@/locales/hi.json";

const locales: Record<string, Record<string, string>> = {
  en,
  es,
  fr,
  ar,
  zh,
  ko,
  vi,
  pt,
  ru,
  hi,
};

export function t(key: string, language: string): string {
  const locale = locales[language];
  if (locale && locale[key]) return locale[key];
  // Fallback to English
  return en[key as keyof typeof en] || key;
}
