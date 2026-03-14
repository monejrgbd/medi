"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface PhoneInputProps {
  onSubmit: (phone: string) => void;
  loading: boolean;
  error?: string;
  mode: "verification" | "collection";
  onSkip?: () => void;
  onNoPhone?: () => void;
}

const COUNTRY_CODES = [
  { code: "+1", label: "US/CA +1" },
  { code: "+44", label: "UK +44" },
  { code: "+61", label: "AU +61" },
  { code: "+91", label: "IN +91" },
  { code: "+33", label: "FR +33" },
  { code: "+49", label: "DE +49" },
  { code: "+81", label: "JP +81" },
  { code: "+86", label: "CN +86" },
  { code: "+52", label: "MX +52" },
  { code: "+55", label: "BR +55" },
  { code: "+82", label: "KR +82" },
  { code: "+84", label: "VN +84" },
  { code: "+351", label: "PT +351" },
  { code: "+7", label: "RU +7" },
  { code: "+34", label: "ES +34" },
  { code: "+39", label: "IT +39" },
  { code: "+90", label: "TR +90" },
  { code: "+66", label: "TH +66" },
  { code: "+62", label: "ID +62" },
  { code: "+48", label: "PL +48" },
  { code: "+46", label: "SE +46" },
  { code: "+380", label: "UA +380" },
  { code: "+31", label: "NL +31" },
  { code: "+971", label: "AE +971" },
  { code: "+966", label: "SA +966" },
  { code: "+20", label: "EG +20" },
  { code: "+234", label: "NG +234" },
  { code: "+254", label: "KE +254" },
  { code: "+63", label: "PH +63" },
  { code: "+65", label: "SG +65" },
];

export default function PhoneInput({
  onSubmit,
  loading,
  error,
  mode,
  onSkip,
  onNoPhone,
}: PhoneInputProps) {
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [localError, setLocalError] = useState("");
  const { t } = useLanguage();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError("");

    const digits = phoneNumber.replace(/\D/g, "");
    if (!digits || digits.length < 4) {
      setLocalError("Please enter a valid phone number");
      return;
    }

    const fullPhone = `${countryCode}${digits}`;
    // Client-side E.164 validation
    if (!/^\+[1-9]\d{1,14}$/.test(fullPhone)) {
      setLocalError("Invalid phone number format");
      return;
    }

    onSubmit(fullPhone);
  }

  const displayError = error || localError;

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-6">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
          <svg className="h-7 w-7 text-hilt-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">
          {mode === "verification"
            ? t("phone.verifyTitle")
            : t("phone.collectTitle")}
        </h2>
        <p className="text-sm text-slate">
          {mode === "verification"
            ? t("phone.verifySubtitle")
            : t("phone.collectSubtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            {t("phone.label")}
          </label>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-ink focus:border-hilt-blue focus:ring-1 focus:ring-hilt-blue"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(555) 123-4567"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-ink placeholder:text-ash focus:border-hilt-blue focus:ring-1 focus:ring-hilt-blue"
              autoComplete="tel"
              inputMode="tel"
            />
          </div>
        </div>

        {displayError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {displayError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t("phone.sending") : t("phone.send")}
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-2">
        {mode === "collection" && onSkip && (
          <button
            onClick={onSkip}
            className="w-full text-xs text-ash hover:text-slate transition-colors py-2"
          >
            {t("phone.skip")}
          </button>
        )}
        {mode === "verification" && onNoPhone && (
          <button
            onClick={onNoPhone}
            className="w-full text-sm text-slate hover:text-ink transition-colors py-2"
          >
            {t("phone.noPhone")}
          </button>
        )}
      </div>
    </div>
  );
}
