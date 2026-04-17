"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { updateLocation, uploadLocationLogo } from "@/app/(dashboard)/d/_actions/locations";
import { ALLOWED_SPECIALTIES, QUEUE_TYPES } from "@/lib/constants";
import { useRole } from "@/contexts/RoleContext";
import SearchableSelect from "@/components/ui/SearchableSelect";
import AiTierSelector from "@/components/dashboard/AiTierSelector";
import { Upload, Loader2 } from "lucide-react";

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
  nurse_enabled?: boolean;
  ai_custom_instructions?: string | null;
  ai_message_limit?: number | null;
  skip_ai?: boolean;
  review_sms_enabled?: boolean;
  diagnostic_enabled?: boolean;
  queue_type?: string;
  raven_api_key?: string | null;
  logo_url?: string | null;
  ask_referral_source?: boolean;
  ask_discovery_source?: boolean;
  queue_display_enabled?: boolean;
  show_doctor_room_to_patients?: boolean;
  preset_rooms?: string[];
  checkin_mode?: "approve_to_start" | "approve_on_arrival" | "self_service_on_arrival";
  prescreening_config?: {
    medications_enabled: boolean;
    allergies_enabled: boolean;
    pets_enabled: boolean;
    pregnancy_enabled: boolean;
    custom_fields: {
      id: string;
      label: string;
      type: "list" | "yes_no";
      none_label?: string;
    }[];
  } | null;
}

type CheckinMode = "approve_to_start" | "approve_on_arrival" | "self_service_on_arrival";

const CHECKIN_MODE_OPTIONS: { value: CheckinMode; label: string; description: string }[] = [
  {
    value: "approve_to_start",
    label: "Receptionist approves before chat starts",
    description: "Patient fills the form, then waits for a receptionist to approve them before starting the AI chat. Queue order uses chat completion time.",
  },
  {
    value: "approve_on_arrival",
    label: "Patient chats anywhere, receptionist approves on arrival",
    description: "Patient can complete the AI chat from home. When they get to the clinic, they tap I Have Arrived and the receptionist approves them into the doctor queue. Queue order uses arrival time.",
  },
  {
    value: "self_service_on_arrival",
    label: "Patient chats anywhere, auto enters queue on arrival",
    description: "Patient can complete the AI chat from home. When they tap I Have Arrived they go straight into the doctor queue with no receptionist step. Queue order uses arrival time.",
  },
];

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
  const { org } = useRole();
  const [form, setForm] = useState({
    name: location.name,
    address: location.address || "",
    specialty: location.specialty || "",
    aiModel: location.ai_model,
    displayFormat: location.display_format,
    tabletCount: location.tablet_count,
    timezone: location.timezone || getBrowserTimezone(),
    operatingHours: DAYS_OF_WEEK.reduce((acc, day) => {
      acc[day] = (location.operating_hours as Record<string, string>)?.[day] || "";
      return acc;
    }, {} as Record<string, string>),
    nurseEnabled: location.nurse_enabled ?? false,
    aiCustomInstructions: location.ai_custom_instructions || "",
    aiMessageLimit: location.ai_message_limit ?? null as number | null,
    skipAi: location.skip_ai ?? false,
    reviewSmsEnabled: location.review_sms_enabled ?? true,
    diagnosticEnabled: location.diagnostic_enabled ?? true,
    queueType: location.queue_type || "fifo",
    ravenApiKey: location.raven_api_key || "",
    askReferralSource: location.ask_referral_source ?? false,
    askDiscoverySource: location.ask_discovery_source ?? false,
    showDoctorRoomToPatients: location.show_doctor_room_to_patients ?? true,
    presetRoomsText: (location.preset_rooms ?? []).join("\n"),
    checkinMode: (location.checkin_mode ?? "approve_to_start") as CheckinMode,
    prescreeningMedicationsEnabled: (location.prescreening_config as any)?.medications_enabled ?? true,
    prescreeningAllergiesEnabled: (location.prescreening_config as any)?.allergies_enabled ?? true,
    prescreeningPetsEnabled: (location.prescreening_config as any)?.pets_enabled ?? true,
    prescreeningPregnancyEnabled: (location.prescreening_config as any)?.pregnancy_enabled ?? true,
    prescreeningCustomFields: ((location.prescreening_config as any)?.custom_fields ?? []) as { id: string; label: string; type: "list" | "yes_no"; none_label?: string }[],
  });
  const initialFormJson = useMemo(() => JSON.stringify(form), []);
  const isDirty = JSON.stringify(form) !== initialFormJson;
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const result = await uploadLocationLogo(location.id, fd);

      if (result.success) {
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error || "Upload failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Upload failed" });
    } finally {
      setUploading(false);
      if (logoFileRef.current) logoFileRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Build operating hours — only include days with values
    const hours: Record<string, string> = {};
    for (const [day, val] of Object.entries(form.operatingHours)) {
      if (val.trim()) hours[day] = val.trim();
    }

    const presetRoomsArr = form.presetRoomsText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length <= 60);

    const result = await updateLocation({
      locationId: location.id,
      name: form.name,
      address: form.address,
      specialty: form.specialty,
      operatingHours: Object.keys(hours).length > 0 ? hours : undefined,
      aiModel: form.aiModel,
      displayFormat: form.displayFormat,
      tabletCount: form.tabletCount,
      timezone: form.timezone,
      nurseEnabled: form.nurseEnabled,
      aiCustomInstructions: form.aiCustomInstructions,
      aiMessageLimit: form.aiMessageLimit,
      skipAi: form.skipAi,
      reviewSmsEnabled: form.reviewSmsEnabled,
      diagnosticEnabled: form.diagnosticEnabled,
      queueType: form.queueType,
      ravenApiKey: form.ravenApiKey,
      askReferralSource: form.askReferralSource,
      askDiscoverySource: form.askDiscoverySource,
      showDoctorRoomToPatients: form.showDoctorRoomToPatients,
      presetRooms: presetRoomsArr,
      checkinMode: form.checkinMode,
      prescreeningConfig: {
        medications_enabled: form.prescreeningMedicationsEnabled,
        allergies_enabled: form.prescreeningAllergiesEnabled,
        pets_enabled: form.prescreeningPetsEnabled,
        pregnancy_enabled: form.prescreeningPregnancyEnabled,
        custom_fields: form.prescreeningCustomFields,
      },
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
        <label className="block text-sm font-medium text-ink mb-1">Logo</label>
        <div className="flex items-center gap-3">
          {location.logo_url ? (
            <img
              src={location.logo_url}
              alt=""
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : null}
          <input
            ref={logoFileRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => logoFileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-ink hover:bg-gray-50 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Uploading..." : location.logo_url ? "Change Logo" : "Upload Logo"}
          </button>
        </div>
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

      <div>
        <label className="block text-sm font-medium text-ink mb-2">AI Model</label>
        <AiTierSelector
          value={form.aiModel}
          onChange={(v) => update("aiModel", v)}
          plan={org?.subscription_plan ?? "starter"}
        />
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

      {/* Queue Configuration */}
      <div className="space-y-4 border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-ink">Queue Configuration</h3>

        <div className="space-y-2">
          {QUEUE_TYPES.map((qt) => {
            const isLocked = qt.requiresRaven && !form.ravenApiKey.trim();
            const isSelected = form.queueType === qt.value;
            return (
              <button
                key={qt.value}
                type="button"
                disabled={isLocked}
                onClick={() => {
                  setForm((prev) => ({ ...prev, queueType: qt.value }));
                  setMessage(null);
                }}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  isLocked
                    ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                    : isSelected
                    ? "border-hilt-blue bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 cursor-pointer"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${isLocked ? "text-ash" : "text-ink"}`}>
                    {qt.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {qt.requiresRaven && (
                      <span className="text-xs text-ash">Raven Scheduler</span>
                    )}
                    <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      isSelected ? "border-hilt-blue bg-hilt-blue" : "border-gray-300"
                    }`}>
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                </div>
                <p className={`text-xs mt-1 ${isLocked ? "text-ash" : "text-slate"}`}>
                  {qt.description}
                </p>
              </button>
            );
          })}
        </div>

        <div>
          <label className="block text-sm text-ink mb-1">Raven Scheduler API Key</label>
          <input
            type="text"
            value={form.ravenApiKey}
            onChange={(e) => {
              const val = e.target.value;
              setForm((prev) => {
                const updated = { ...prev, ravenApiKey: val };
                if (!val.trim()) {
                  const selected = QUEUE_TYPES.find((q) => q.value === prev.queueType);
                  if (selected?.requiresRaven) updated.queueType = "fifo";
                }
                return updated;
              });
              setMessage(null);
            }}
            placeholder="Enter your Raven API key"
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none"
          />
          <p className="text-xs text-ash mt-1">Optional. Required for appointment based queue modes.</p>
        </div>
      </div>

      {/* Check-in Flow */}
      <div className="space-y-4 border-t border-gray-100 pt-5">
        <div>
          <h3 className="text-sm font-semibold text-ink">Check-In Flow</h3>
          <p className="text-xs text-ash mt-0.5">How patients get from form submit to the doctor queue.</p>
        </div>

        <div className="space-y-2">
          {CHECKIN_MODE_OPTIONS.map((opt) => {
            const isSelected = form.checkinMode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setForm((prev) => ({ ...prev, checkinMode: opt.value }));
                  setMessage(null);
                }}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  isSelected
                    ? "border-hilt-blue bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 cursor-pointer"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">{opt.label}</span>
                  <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                    isSelected ? "border-hilt-blue bg-hilt-blue" : "border-gray-300"
                  }`}>
                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-xs mt-1 text-slate">{opt.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Clinic Features */}
      <div className="space-y-4 border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-ink">Clinic Features</h3>

        <label className="flex items-center justify-between">
          <span className="text-sm text-ink">Enable Nurse Role</span>
          <input
            type="checkbox"
            checked={form.nurseEnabled}
            onChange={(e) => setForm((prev) => ({ ...prev, nurseEnabled: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
          />
        </label>

        <label className="flex items-center justify-between">
          <div>
            <span className="text-sm text-ink">AI Intake</span>
            <p className="text-xs text-ash">AI screens patients before the doctor. Turn off to send patients straight to the queue.</p>
          </div>
          <input
            type="checkbox"
            checked={!form.skipAi}
            onChange={(e) => setForm((prev) => ({ ...prev, skipAi: !e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
          />
        </label>

        <label className="flex items-center justify-between">
          <div>
            <span className="text-sm text-ink">Review SMS</span>
            <p className="text-xs text-ash">Text patients after visits to collect reviews. Uses 0.1 credits per SMS.</p>
          </div>
          <input
            type="checkbox"
            checked={form.reviewSmsEnabled}
            onChange={(e) => setForm((prev) => ({ ...prev, reviewSmsEnabled: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
          />
        </label>

        <label className="flex items-center justify-between">
          <div>
            <span className="text-sm text-ink">Diagnostic AI</span>
            <p className="text-xs text-ash">AI suggests possible diagnoses based on patient symptoms. Included in the per visit tier cost, no extra charge.</p>
          </div>
          <input
            type="checkbox"
            checked={form.diagnosticEnabled}
            onChange={(e) => setForm((prev) => ({ ...prev, diagnosticEnabled: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
          />
        </label>
      </div>

      {/* Doctor Rooms */}
      <div className="space-y-4 border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-ink">Doctor Rooms</h3>

        <label className="flex items-center justify-between">
          <div>
            <span className="text-sm text-ink">Show doctor room to patients</span>
            <p className="text-xs text-ash">When on, patients see the room on the claim screen and it appears on the TV queue display. Your receptionist always sees the room.</p>
          </div>
          <input
            type="checkbox"
            checked={form.showDoctorRoomToPatients}
            onChange={(e) => setForm((prev) => ({ ...prev, showDoctorRoomToPatients: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
          />
        </label>

        <div>
          <label className="block text-sm text-ink mb-1">Preset room names</label>
          <textarea
            value={form.presetRoomsText}
            onChange={(e) => setForm((prev) => ({ ...prev, presetRoomsText: e.target.value }))}
            rows={4}
            placeholder={"Room 1\nRoom 2\nExam A"}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
          />
          <p className="text-xs text-ash mt-1">One room per line. When filled in, staff pick a room from this list at check-in instead of typing free text.</p>
        </div>
      </div>

      {/* Check-in Form */}
      <div className="space-y-3 border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-ink">Check-in Form</h3>

        <label className="flex items-center justify-between">
          <div>
            <span className="text-sm text-ink">Ask about referrals</span>
            <p className="text-xs text-ash">Ask patients if they were referred by another provider.</p>
          </div>
          <input
            type="checkbox"
            checked={form.askReferralSource}
            onChange={(e) => setForm((prev) => ({ ...prev, askReferralSource: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
          />
        </label>

        <label className="flex items-center justify-between">
          <div>
            <span className="text-sm text-ink">Ask how they found us</span>
            <p className="text-xs text-ash">Ask new patients how they learned about your clinic.</p>
          </div>
          <input
            type="checkbox"
            checked={form.askDiscoverySource}
            onChange={(e) => setForm((prev) => ({ ...prev, askDiscoverySource: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
          />
        </label>
      </div>

      {/* Pre Screening */}
      <div className="space-y-4 border-t border-gray-100 pt-5">
        <div>
          <h3 className="text-sm font-semibold text-ink">Pre Screening</h3>
          <p className="text-xs text-ash mt-0.5">Configure what information to collect from patients before the AI conversation.</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-slate">Default Fields</p>
          {([
            { key: "prescreeningMedicationsEnabled" as const, label: "Medications", desc: "Ask patients to list their current medications." },
            { key: "prescreeningAllergiesEnabled" as const, label: "Allergies", desc: "Ask patients to list their known allergies." },
            { key: "prescreeningPetsEnabled" as const, label: "Pets", desc: "Ask patients about pets at home (relevant for certain conditions)." },
            { key: "prescreeningPregnancyEnabled" as const, label: "Pregnancy (females 17+)", desc: "Ask eligible patients about pregnancy status." },
          ]).map(({ key, label, desc }) => (
            <label key={key} className="flex items-center justify-between">
              <div>
                <span className="text-sm text-ink">{label}</span>
                <p className="text-xs text-ash">{desc}</p>
              </div>
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
              />
            </label>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium text-slate">Custom Fields</p>
          {form.prescreeningCustomFields.map((field, idx) => (
            <div key={field.id} className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => {
                    const updated = [...form.prescreeningCustomFields];
                    updated[idx] = { ...updated[idx], label: e.target.value.slice(0, 200) };
                    setForm((prev) => ({ ...prev, prescreeningCustomFields: updated }));
                  }}
                  placeholder="Field label"
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-hilt-blue focus:outline-none"
                />
                <div className="flex gap-2">
                  <select
                    value={field.type}
                    onChange={(e) => {
                      const updated = [...form.prescreeningCustomFields];
                      updated[idx] = { ...updated[idx], type: e.target.value as "list" | "yes_no" };
                      setForm((prev) => ({ ...prev, prescreeningCustomFields: updated }));
                    }}
                    className="rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-hilt-blue focus:outline-none"
                  >
                    <option value="list">List</option>
                    <option value="yes_no">Yes / No</option>
                  </select>
                  {field.type === "list" && (
                    <input
                      type="text"
                      value={field.none_label || ""}
                      onChange={(e) => {
                        const updated = [...form.prescreeningCustomFields];
                        updated[idx] = { ...updated[idx], none_label: e.target.value.slice(0, 200) || undefined };
                        setForm((prev) => ({ ...prev, prescreeningCustomFields: updated }));
                      }}
                      placeholder="None label (e.g. I do not have any...)"
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-1 text-sm focus:border-hilt-blue focus:outline-none"
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...form.prescreeningCustomFields];
                      [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
                      setForm((prev) => ({ ...prev, prescreeningCustomFields: updated }));
                    }}
                    className="text-ash hover:text-ink text-xs"
                    title="Move up"
                  >
                    ▲
                  </button>
                )}
                {idx < form.prescreeningCustomFields.length - 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...form.prescreeningCustomFields];
                      [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
                      setForm((prev) => ({ ...prev, prescreeningCustomFields: updated }));
                    }}
                    className="text-ash hover:text-ink text-xs"
                    title="Move down"
                  >
                    ▼
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const updated = form.prescreeningCustomFields.filter((_, i) => i !== idx);
                    setForm((prev) => ({ ...prev, prescreeningCustomFields: updated }));
                  }}
                  className="text-red-400 hover:text-red-600 text-xs"
                  title="Delete field"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            disabled={form.prescreeningCustomFields.length >= 20}
            onClick={() => {
              const newField = {
                id: crypto.randomUUID(),
                label: "",
                type: "list" as const,
                none_label: undefined as string | undefined,
              };
              setForm((prev) => ({
                ...prev,
                prescreeningCustomFields: [...prev.prescreeningCustomFields, newField],
              }));
            }}
            className="text-sm text-hilt-blue hover:underline disabled:opacity-50 disabled:no-underline"
          >
            + Add custom field{form.prescreeningCustomFields.length >= 20 ? " (max 20)" : ""}
          </button>
        </div>
      </div>

      {/* AI Configuration */}
      <div className="space-y-4 border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-ink">AI Configuration</h3>

        <div>
          <label className="block text-sm text-ink mb-1">Custom AI Instructions</label>
          <textarea
            value={form.aiCustomInstructions}
            onChange={(e) => setForm((prev) => ({ ...prev, aiCustomInstructions: e.target.value }))}
            maxLength={2000}
            rows={4}
            placeholder="e.g. Ask about family history if applicable"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
          />
          <p className="text-xs text-ash mt-1">{form.aiCustomInstructions.length}/2000 characters</p>
        </div>

        <div>
          <label className="block text-sm text-ink mb-1">AI Message Limit</label>
          <input
            type="number"
            value={form.aiMessageLimit ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setForm((prev) => ({
                ...prev,
                aiMessageLimit: val === "" ? null : parseInt(val, 10),
              }));
            }}
            min={10}
            max={100}
            placeholder="30 (default)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
          />
          <p className="text-xs text-ash mt-1">Maximum patient messages per conversation (10 to 100, capped by your plan). The AI will pace itself to cover critical fields within this limit.</p>
        </div>
      </div>

      {isDirty && (
        <div className="fixed bottom-6 right-6 z-[9999]">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-hilt-blue px-5 py-2.5 text-sm font-semibold text-white shadow-lg disabled:opacity-50 hover:bg-hilt-blue-dark transition-colors"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </form>
  );
}
