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
    <div className="flex justify-start mb-3">
      <div className="rounded-2xl rounded-bl-md bg-gray-100 text-ink px-4 py-2.5 max-w-[80%]">
        <p className="text-sm whitespace-pre-wrap break-words">{greeting}</p>
      </div>
    </div>
  );
}
