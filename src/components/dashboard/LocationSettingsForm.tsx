"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateLocation } from "@/app/(dashboard)/d/_actions/locations";

interface LocationData {
  id: string;
  name: string;
  address: string | null;
  specialty: string | null;
  ai_model: string;
  display_format: string;
  referral_email: string | null;
  tablet_count: number;
  timezone: string;
}

const SPECIALTIES = [
  "General Practice",
  "Family Medicine",
  "Pediatrics",
  "Dermatology",
  "Cardiology",
  "Orthopedics",
  "Dentistry",
  "Optometry",
  "Urgent Care",
  "Other",
];

const TIMEZONES = [
  "America/Toronto",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Vancouver",
  "America/Edmonton",
  "America/Winnipeg",
  "America/Halifax",
  "America/St_Johns",
  "UTC",
];

export default function LocationSettingsForm({
  location,
}: {
  location: LocationData;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: location.name,
    address: location.address || "",
    specialty: location.specialty || "",
    aiModel: location.ai_model,
    displayFormat: location.display_format,
    referralEmail: location.referral_email || "",
    tabletCount: location.tablet_count,
    timezone: location.timezone,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await updateLocation({
      locationId: location.id,
      name: form.name,
      address: form.address,
      specialty: form.specialty,
      aiModel: form.aiModel,
      displayFormat: form.displayFormat,
      referralEmail: form.referralEmail,
      tabletCount: form.tabletCount,
      timezone: form.timezone,
    });

    setLoading(false);

    if (result.success) {
      setMessage({ type: "success", text: "Settings saved" });
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error || "Failed to save" });
    }
  }

  function update(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setMessage(null);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      {message && (
        <div
          className={`rounded-lg p-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
          maxLength={100}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Address</label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          maxLength={200}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Specialty</label>
        <select
          value={form.specialty}
          onChange={(e) => update("specialty", e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none"
        >
          <option value="">None</option>
          {SPECIALTIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">AI Model</label>
          <select
            value={form.aiModel}
            onChange={(e) => update("aiModel", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none"
          >
            <option value="standard">Standard</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Display Format</label>
          <select
            value={form.displayFormat}
            onChange={(e) => update("displayFormat", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none"
          >
            <option value="summary">Summary</option>
            <option value="structured_card">Detailed</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Referral Email</label>
        <input
          type="email"
          value={form.referralEmail}
          onChange={(e) => update("referralEmail", e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none"
          placeholder="referrals@clinic.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">Timezone</label>
          <select
            value={form.timezone}
            onChange={(e) => update("timezone", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz.replace("America/", "")}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Tablet Count</label>
          <input
            type="number"
            value={form.tabletCount}
            onChange={(e) => update("tabletCount", parseInt(e.target.value) || 0)}
            min={0}
            max={100}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-hilt-blue px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-hilt-blue-dark"
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
