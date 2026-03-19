"use client";

import { useState } from "react";
import { stripHtml } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface CheckinFormProps {
  locationName: string;
  address: string;
  logoUrl: string | null;
  onSubmit: (firstName: string, lastName: string, birthday: string, sex: string) => void;
  loading: boolean;
  error: string;
  demoDefaults?: { firstName: string; lastName: string; birthday: string; sex: string };
}

export default function CheckinForm({
  locationName,
  address,
  logoUrl,
  onSubmit,
  loading,
  error,
  demoDefaults,
}: CheckinFormProps) {
  const [firstName, setFirstName] = useState(demoDefaults?.firstName ?? "");
  const [lastName, setLastName] = useState(demoDefaults?.lastName ?? "");
  const [birthday, setBirthday] = useState(demoDefaults?.birthday ?? "");
  const [sex, setSex] = useState(demoDefaults?.sex ?? "male");
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

    onSubmit(cleanFirst, cleanLast, birthday, sex);
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
