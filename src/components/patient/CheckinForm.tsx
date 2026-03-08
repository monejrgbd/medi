"use client";

import { useState } from "react";
import { stripHtml } from "@/lib/utils";

interface CheckinFormProps {
  locationName: string;
  orgName: string;
  logoUrl: string | null;
  onSubmit: (firstName: string, lastName: string, birthday: string) => void;
  loading: boolean;
  error: string;
}

export default function CheckinForm({
  locationName,
  orgName,
  logoUrl,
  onSubmit,
  loading,
  error,
}: CheckinFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [validationError, setValidationError] = useState("");

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

    const bday = new Date(birthday);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bday >= today) {
      setValidationError("Birthday must be in the past.");
      return;
    }

    onSubmit(cleanFirst, cleanLast, birthday);
  }

  const displayError = error || validationError;

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        {logoUrl && (
          <img
            src={logoUrl}
            alt={orgName}
            className="mx-auto mb-4 h-16 w-16 rounded-xl object-cover"
          />
        )}
        <h1 className="text-2xl font-bold text-ink">{locationName}</h1>
        <p className="mt-1 text-sm text-slate">{orgName}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            First Name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            maxLength={100}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none"
            placeholder="Enter your first name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Last Name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            maxLength={100}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none"
            placeholder="Enter your last name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Date of Birth
          </label>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none"
          />
        </div>

        {displayError && (
          <p className="text-sm text-red-600">{displayError}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Checking in..." : "Check In"}
        </button>
      </form>
    </div>
  );
}
