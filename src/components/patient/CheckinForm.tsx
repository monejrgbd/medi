"use client";

import { useState } from "react";
import { stripHtml } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

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

interface CheckinFormProps {
  locationName: string;
  address: string;
  logoUrl: string | null;
  onSubmit: (firstName: string, lastName: string, birthday: string, sex: string, wasReferred: boolean, referredBy: string, phone: string | null) => void;
  loading: boolean;
  error: string;
  demoDefaults?: { firstName: string; lastName: string; birthday: string; sex: string };
  askReferralSource?: boolean;
}

export default function CheckinForm({
  locationName,
  address,
  logoUrl,
  onSubmit,
  loading,
  error,
  demoDefaults,
  askReferralSource,
}: CheckinFormProps) {
  const [firstName, setFirstName] = useState(demoDefaults?.firstName ?? "");
  const [lastName, setLastName] = useState(demoDefaults?.lastName ?? "");
  const [birthday, setBirthday] = useState(demoDefaults?.birthday ?? "");
  const [sex, setSex] = useState(demoDefaults?.sex ?? "male");
  const [wasReferred, setWasReferred] = useState(false);
  const [referredBy, setReferredBy] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [noPhone, setNoPhone] = useState(false);
  const [smsTermsAccepted, setSmsTermsAccepted] = useState(false);
  const [validationError, setValidationError] = useState("");
  const { t } = useLanguage();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    const cleanFirst = stripHtml(firstName).trim();
    const cleanLast = stripHtml(lastName).trim();

    if (!cleanFirst || !cleanLast) {
      setValidationError("First and last name are required.");
      return;
    }

    if (!birthday) {
      setValidationError("Birthday is required.");
      return;
    }

    if (!sex) {
      setValidationError("Please select biological sex.");
      return;
    }

    const bday = new Date(birthday);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bday >= today) {
      setValidationError("Birthday must be in the past.");
      return;
    }

    // Build phone in E.164 format or null
    let phone: string | null = null;
    if (!noPhone && phoneNumber.trim()) {
      const digits = phoneNumber.replace(/\D/g, "");
      const fullPhone = `${countryCode}${digits}`;
      if (!/^\+[1-9]\d{6,14}$/.test(fullPhone)) {
        setValidationError("Please enter a valid phone number.");
        return;
      }
      if (!smsTermsAccepted) {
        setValidationError("Please accept the SMS terms to continue.");
        return;
      }
      phone = fullPhone;
    }

    onSubmit(cleanFirst, cleanLast, birthday, sex, wasReferred, referredBy, phone);
  }

  const displayError = error || validationError;

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        {logoUrl && (
          <img
            src={logoUrl}
            alt={locationName}
            className="mx-auto mb-4 h-16 w-16 rounded-xl object-cover"
          />
        )}
        <h1 className="text-2xl font-bold text-ink">{locationName}</h1>
        {address && <p className="mt-1 text-sm text-slate">{address}</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            {t("checkin.firstName")}
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            maxLength={100}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-base focus:border-hilt-blue focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            {t("checkin.lastName")}
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            maxLength={100}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-base focus:border-hilt-blue focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            {t("checkin.birthday")}
          </label>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-base focus:border-hilt-blue focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            {t("checkin.sex")}
          </label>
          <div className="flex gap-3">
            <label className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-colors ${sex === "male" ? "border-hilt-blue bg-blue-50 text-hilt-blue font-medium" : "border-gray-200 text-ink hover:bg-gray-50"}`}>
              <input
                type="radio"
                name="sex"
                value="male"
                checked={sex === "male"}
                onChange={(e) => setSex(e.target.value)}
                className="sr-only"
              />
              {t("checkin.male")}
            </label>
            <label className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-colors ${sex === "female" ? "border-hilt-blue bg-blue-50 text-hilt-blue font-medium" : "border-gray-200 text-ink hover:bg-gray-50"}`}>
              <input
                type="radio"
                name="sex"
                value="female"
                checked={sex === "female"}
                onChange={(e) => setSex(e.target.value)}
                className="sr-only"
              />
              {t("checkin.female")}
            </label>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-ink">
              {t("checkin.phone_label")}
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={noPhone}
                onChange={(e) => {
                  setNoPhone(e.target.checked);
                  if (e.target.checked) {
                    setPhoneNumber("");
                    setSmsTermsAccepted(false);
                  }
                }}
                className="h-3.5 w-3.5 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
              />
              <span className="text-xs text-slate">
                {t("checkin.no_phone_toggle")}
              </span>
            </label>
          </div>
          {!noPhone && (
            <>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-ink focus:border-hilt-blue focus:outline-none"
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
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-base focus:border-hilt-blue focus:outline-none"
                  autoComplete="tel"
                  inputMode="tel"
                />
              </div>
              {phoneNumber.trim() && (
                <label className="flex items-start gap-2.5 cursor-pointer mt-3">
                  <input
                    type="checkbox"
                    checked={smsTermsAccepted}
                    onChange={(e) => setSmsTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
                  />
                  <span className="text-xs text-slate leading-relaxed">
                    {t("checkin.sms_terms")}
                  </span>
                </label>
              )}
            </>
          )}
        </div>

        {askReferralSource && (
          <div className="border-t border-gray-100 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={wasReferred}
                onChange={(e) => setWasReferred(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
              />
              <span className="text-sm text-slate">
                {t("checkin.wasReferred")}
              </span>
            </label>
            {wasReferred && (
              <input
                type="text"
                placeholder={t("checkin.referredBy")}
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value)}
                maxLength={200}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
              />
            )}
          </div>
        )}

        {displayError && (
          <p className="text-sm text-red-600">{displayError}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t("checkin.submit") + "..." : t("checkin.submit")}
        </button>
      </form>
    </div>
  );
}
