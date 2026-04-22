"use client";

import { useState } from "react";
import { editPatientRecord } from "@/app/(dashboard)/d/_actions/receptionist";

interface PatientRecordEditorProps {
  patientId: string;
  currentFirstName: string;
  currentLastName: string;
  currentBirthday: string;
  currentSex?: string;
  onSaved: () => void;
  onCancel: () => void;
}

export default function PatientRecordEditor({
  patientId,
  currentFirstName,
  currentLastName,
  currentBirthday,
  currentSex,
  onSaved,
  onCancel,
}: PatientRecordEditorProps) {
  const [firstName, setFirstName] = useState(currentFirstName);
  const [lastName, setLastName] = useState(currentLastName);
  const [birthday, setBirthday] = useState(currentBirthday);
  const [sex, setSex] = useState(currentSex || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Client-side validation
    const cleanFirst = firstName.replace(/<[^>]*>/g, "").trim();
    const cleanLast = lastName.replace(/<[^>]*>/g, "").trim();

    if (!cleanFirst || !cleanLast) {
      setError("First and last name are required");
      return;
    }

    const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
    if (!nameRegex.test(cleanFirst)) {
      setError("First name contains invalid characters");
      return;
    }
    if (!nameRegex.test(cleanLast)) {
      setError("Last name contains invalid characters");
      return;
    }

    if (!birthday) {
      setError("Birthday is required");
      return;
    }

    const bday = new Date(birthday);
    if (bday >= new Date()) {
      setError("Birthday must be in the past");
      return;
    }

    // Only send changed fields
    const params: { firstName?: string; lastName?: string; birthday?: string; sex?: string } = {};
    if (cleanFirst !== currentFirstName) params.firstName = cleanFirst;
    if (cleanLast !== currentLastName) params.lastName = cleanLast;
    if (birthday !== currentBirthday) params.birthday = birthday;
    if (sex !== (currentSex || "")) params.sex = sex || undefined;

    if (Object.keys(params).length === 0) {
      onCancel();
      return;
    }

    setLoading(true);
    const result = await editPatientRecord(
      patientId,
      params.firstName,
      params.lastName,
      params.birthday,
      params.sex
    );
    setLoading(false);

    if (result.success) {
      onSaved();
    } else {
      setError(result.error || "Failed to update patient record");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-ink mb-4">Edit Patient Record</h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate mb-1">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-ink focus:border-hilt-blue focus:ring-1 focus:ring-hilt-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate mb-1">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-ink focus:border-hilt-blue focus:ring-1 focus:ring-hilt-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate mb-1">Birthday</label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-ink focus:border-hilt-blue focus:ring-1 focus:ring-hilt-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate mb-1">Biological Sex</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSex("male")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${sex === "male" ? "border-hilt-blue bg-blue-50 text-hilt-blue font-medium" : "border-gray-300 text-ink hover:bg-gray-50"}`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => setSex("female")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${sex === "female" ? "border-hilt-blue bg-blue-50 text-hilt-blue font-medium" : "border-gray-300 text-ink hover:bg-gray-50"}`}
              >
                Female
              </button>
              <button
                type="button"
                onClick={() => setSex("other")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${sex === "other" ? "border-hilt-blue bg-blue-50 text-hilt-blue font-medium" : "border-gray-300 text-ink hover:bg-gray-50"}`}
              >
                Other
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-hilt-blue px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
