"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
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

interface MatchResolutionProps {
  matchType: 'potential_match' | 'potential_match_no_phone' | 'potential_match_add_phone';
  formData: {
    locationId: string;
    firstName: string;
    lastName: string;
    birthday: string;
    sex: string;
    phone: string | null;
    wasReferred: boolean;
    referredBy: string | null;
  };
  onResolved: (result: {
    matchType: string;
    sessionToken: string;
    visitId: string;
    phoneVerified: boolean;
    hasPhoneToVerify: boolean;
    isDiscoveryEligible?: boolean;
  }) => void;
  onError: (error: string) => void;
  isDemo?: boolean;
}

export default function MatchResolution({
  matchType,
  formData,
  onResolved,
  onError,
  isDemo,
}: MatchResolutionProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<"choice" | "phone_input">("choice");
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState("");

  function buildFullPhone(): string | null {
    const digits = phoneNumber.replace(/\D/g, "");
    if (!digits || digits.length < 4) return null;
    const full = `${countryCode}${digits}`;
    if (!/^\+[1-9]\d{1,14}$/.test(full)) return null;
    return full;
  }

  async function callResolve(action: string, oldPhone?: string | null) {
    setLoading(true);
    setInlineError("");

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("resolve_potential_match", {
        p_location_id: formData.locationId,
        p_first_name: formData.firstName,
        p_last_name: formData.lastName,
        p_birthday: formData.birthday,
        p_sex: formData.sex,
        p_phone: formData.phone ?? null,
        p_old_phone: oldPhone ?? null,
        p_action: action,
        p_was_referred: formData.wasReferred,
        p_referred_by: formData.referredBy ?? null,
      });

      if (error) {
        if (error.message?.includes("old_phone_mismatch")) {
          setInlineError(t("checkin.old_phone_mismatch"));
          setLoading(false);
          return;
        }
        onError(error.message);
        setLoading(false);
        return;
      }

      if (!data?.success) {
        onError(data?.error || "Something went wrong");
        setLoading(false);
        return;
      }

      // active_session: patient already has an active visit on this record.
      // Reload the page so session recovery picks it up via localStorage token.
      if (data.match_type === "active_session") {
        if (data.session_token) {
          localStorage.setItem("hilt_session_token", data.session_token);
        }
        window.location.reload();
        return;
      }

      // Derive hasPhoneToVerify from the action (SQL does not return this field)
      const needsPhoneVerify =
        action === "phone_change" ||
        action === "add_phone" ||
        (action === "new_patient" && !!formData.phone);

      onResolved({
        matchType: data.match_type,
        sessionToken: data.session_token,
        visitId: data.visit_id,
        phoneVerified: data.phone_verified ?? false,
        hasPhoneToVerify: needsPhoneVerify,
        isDiscoveryEligible: data.is_discovery_eligible ?? false,
      });
    } catch {
      onError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    const full = buildFullPhone();
    if (!full) {
      setInlineError("Please enter a valid phone number");
      return;
    }

    if (matchType === "potential_match") {
      callResolve("phone_change", full);
    } else {
      callResolve("no_phone_verify", full);
    }
  }

  function handleNewPatient() {
    callResolve("new_patient");
  }

  function handleAddPhone() {
    callResolve("add_phone");
  }

  // potential_match_add_phone: simple two-button choice, no phone input needed
  if (matchType === "potential_match_add_phone") {
    return (
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <svg className="h-7 w-7 text-hilt-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">
            {t("checkin.match_found_title")}
          </h2>
          <p className="text-sm text-slate">
            {t("checkin.match_found_returning")}
          </p>
        </div>

        {inlineError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {inlineError}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleAddPhone}
            disabled={loading}
            className="w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? t("checkin.yes_returning") + "..." : t("checkin.yes_returning")}
          </button>
          <button
            onClick={handleNewPatient}
            disabled={loading}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {t("checkin.no_new_patient")}
          </button>
        </div>
      </div>
    );
  }

  // potential_match: choice first, then phone input on "yes"
  if (matchType === "potential_match" && step === "choice") {
    return (
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <svg className="h-7 w-7 text-hilt-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">
            {t("checkin.match_found_title")}
          </h2>
          <p className="text-sm text-slate">
            {t("checkin.match_found_phone_change")}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setStep("phone_input")}
            disabled={loading}
            className="w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {t("checkin.yes_changed_number")}
          </button>
          <button
            onClick={handleNewPatient}
            disabled={loading}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? t("checkin.no_new_patient") + "..." : t("checkin.no_new_patient")}
          </button>
        </div>
      </div>
    );
  }

  // Phone input view: used by potential_match (after "yes") and potential_match_no_phone
  const phoneLabel =
    matchType === "potential_match"
      ? t("checkin.enter_previous_phone")
      : t("checkin.enter_phone_on_file");

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
          <svg className="h-7 w-7 text-hilt-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">
          {t("checkin.match_found_title")}
        </h2>
        <p className="text-sm text-slate">{phoneLabel}</p>
      </div>

      <form onSubmit={handlePhoneSubmit} className="space-y-4">
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
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-base text-ink placeholder:text-ash focus:border-hilt-blue focus:ring-1 focus:ring-hilt-blue"
              autoComplete="tel"
              inputMode="tel"
            />
          </div>
        </div>

        {inlineError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {inlineError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t("checkin.confirm") + "..." : t("checkin.confirm")}
        </button>
      </form>

      <div className="mt-4">
        <button
          onClick={handleNewPatient}
          disabled={loading}
          className="w-full rounded-lg px-4 py-2 text-sm text-slate hover:text-ink transition-colors"
        >
          {t("checkin.no_new_patient")}
        </button>
      </div>
    </div>
  );
}
