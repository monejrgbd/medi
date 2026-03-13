"use client";

import { useLanguage } from "@/contexts/LanguageContext";

interface SystemGreetingProps {
  patientName: string;
  clinicName: string;
}

export default function SystemGreeting({ patientName, clinicName }: SystemGreetingProps) {
  const { t } = useLanguage();

  const greeting = t("greeting")
    .replace("{name}", patientName)
    .replace("{clinic}", clinicName);

  return (
    <div className="flex justify-center my-4">
      <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 px-5 py-4 max-w-sm text-center">
        <p className="text-sm text-ink">{greeting}</p>
      </div>
    </div>
  );
}
