"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateLocation } from "@/app/(dashboard)/d/_actions/locations";
import { ALLOWED_SPECIALTIES } from "@/lib/constants";
import SearchableSelect from "@/components/ui/SearchableSelect";

interface LocationData {
  id: string;
  name: string;
  address: string | null;
  operating_hours: Record<string, string> | null;
  specialty: string | null;
  ai_model: string;
  display_format: string;
  referral_email: string | null;
  tablet_count: number;
  timezone: string;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];


function getAllTimezones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    // Fallback for older browsers
    return ["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Toronto", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Shanghai", "Australia/Sydney"];
  }
}

function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

function formatTimezoneLabel(tz: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((p) => p.type === "timeZoneName");
    const offset = offsetPart?.value || "";
    const display = tz.replace(/_/g, " ");
    return `${display} (${offset})`;
  } catch {
    return tz;
  }
}

const ALL_TIMEZONES = getAllTimezones();

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
    timezone: location.timezone || getBrowserTimezone(),
    operatingHours: DAYS_OF_WEEK.reduce((acc, day) => {
      acc[day] = (location.operating_hours as Record<string, string>)?.[day] || "";
      return acc;
    }, {} as Record<string, string>),
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Build operating hours — only include days with values
    const hours: Record<string, string> = {};
    for (const [day, val] of Object.entries(form.operatingHours)) {
      if (val.trim()) hours[day] = val.trim();
    }

    const result = await updateLocation({
      locationId: location.id,
      name: form.name,
      address: form.address,
      specialty: form.specialty,
      operatingHours: Object.keys(hours).length > 0 ? hours : undefined,
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
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl mx-auto">
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
        <SearchableSelect
          options={ALLOWED_SPECIALTIES}
          value={form.specialty}
          onChange={(v) => update("specialty", v)}
          placeholder="Search specialties..."
          emptyLabel="None"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Operating Hours</label>
        <p className="text-xs text-slate mb-2">Shown to patients when no receptionist is checked in.</p>
        <div className="space-y-2">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="flex items-center gap-3">
              <span className="text-sm text-slate w-24 shrink-0">{day}</span>
              <input
                type="text"
                value={form.operatingHours[day]}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    operatingHours: { ...prev.operatingHours, [day]: e.target.value },
                  }))
                }
                placeholder="e.g. 9:00 AM - 5:00 PM"
                maxLength={50}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-hilt-blue focus:outline-none"
              />
            </div>
          ))}
        </div>
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

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Timezone</label>
        <SearchableSelect
          options={ALL_TIMEZONES}
          value={form.timezone}
          onChange={(v) => update("timezone", v)}
          placeholder="Search timezones..."
          emptyLabel="Select timezone..."
          formatLabel={formatTimezoneLabel}
        />
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
