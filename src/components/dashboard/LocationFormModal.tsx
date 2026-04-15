"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/contexts/RoleContext";
import { createLocation } from "@/app/(dashboard)/d/_actions/locations";
import { ALLOWED_SPECIALTIES } from "@/lib/constants";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { HeartPulse, FastForward, MessageSquare, Stethoscope } from "lucide-react";

export default function LocationFormModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { org } = useRole();
  const router = useRouter();

  // Step 1 fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [presetRoomsText, setPresetRoomsText] = useState("");

  // Step 2 feature toggles
  const [nurseEnabled, setNurseEnabled] = useState(false);
  const [skipAi, setSkipAi] = useState(false);
  const [reviewSmsEnabled, setReviewSmsEnabled] = useState(true);
  const [diagnosticEnabled, setDiagnosticEnabled] = useState(true);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleNurseToggle(checked: boolean) {
    setNurseEnabled(checked);
  }

  function handleClose() {
    setName(""); setAddress(""); setSpecialty(""); setPresetRoomsText("");
    setNurseEnabled(false);
    setSkipAi(false); setReviewSmsEnabled(true); setDiagnosticEnabled(true);
    setStep(1); setError("");
    onClose();
  }

  async function handleCreate() {
    setLoading(true);
    setError("");

    const presetRooms = presetRoomsText
      .split(/\r?\n/)
      .map((r) => r.trim())
      .filter((r) => r.length > 0 && r.length <= 60);

    const result = await createLocation({
      orgId: org.id,
      name,
      address: address || undefined,
      specialty: specialty || undefined,
      nurseEnabled,
      skipAi,
      reviewSmsEnabled,
      diagnosticEnabled,
      presetRooms,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error || "Failed to create location");
      return;
    }

    handleClose();
    router.refresh();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-lg font-semibold text-ink">Add Location</h2>
          <div className="ml-auto flex gap-1">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-8 rounded-full transition-colors ${step >= s ? "bg-hilt-blue" : "bg-gray-200"}`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        {/* Step 1: Location details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                autoFocus
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none"
                placeholder="e.g. Downtown Clinic"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                maxLength={200}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none"
                placeholder="123 Main St, City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">Specialty</label>
              <SearchableSelect
                options={ALLOWED_SPECIALTIES}
                value={specialty}
                onChange={setSpecialty}
                placeholder="Search specialties..."
                emptyLabel="Select specialty..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Exam rooms <span className="font-normal text-ash">(optional)</span>
              </label>
              <textarea
                value={presetRoomsText}
                onChange={(e) => setPresetRoomsText(e.target.value)}
                rows={3}
                placeholder={"Room 1\nRoom 2\nExam A"}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
              />
              <p className="text-xs text-ash mt-1">One room per line. When filled in, doctors and nurses pick from this list at check in instead of typing. Leave blank to let staff type their room.</p>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Feature toggles */}
        {step === 2 && (
          <div>
            <p className="text-xs text-slate mb-4">Choose which features to enable for this location. You can change these later.</p>

            <div className="space-y-2 mb-5">

              <FeatureRow
                icon={<HeartPulse className="h-4 w-4 text-teal-600" />}
                bg="bg-teal-50"
                activeClass="bg-teal-500"
                label="Nurse Triage"
                description="Nurses screen patients before doctors."
                enabled={nurseEnabled}
                onToggle={(v) => handleNurseToggle(v)}
              />

              <FeatureRow
                icon={<FastForward className="h-4 w-4 text-violet-600" />}
                bg="bg-violet-50"
                activeClass="bg-violet-500"
                label="AI Intake"
                description="AI screens patients before the doctor."
                enabled={!skipAi}
                onToggle={(v) => setSkipAi(!v)}
              />

              <FeatureRow
                icon={<MessageSquare className="h-4 w-4 text-amber-600" />}
                bg="bg-amber-50"
                activeClass="bg-amber-500"
                label="Review SMS"
                description="Text patients after visits to collect reviews."
                enabled={reviewSmsEnabled}
                onToggle={setReviewSmsEnabled}
                cost={{ text: "0.1 credits per SMS", className: "text-amber-600" }}
              />

              <FeatureRow
                icon={<Stethoscope className="h-4 w-4 text-rose-600" />}
                bg="bg-rose-50"
                activeClass="bg-rose-500"
                label="Diagnostic AI"
                description="AI suggests diagnoses based on symptoms."
                enabled={diagnosticEnabled}
                onToggle={setDiagnosticEnabled}
                cost={{ text: "Included in tier cost", className: "text-rose-600" }}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate hover:text-ink"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={loading}
                className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Location"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FeatureRow({
  icon, bg, activeClass, label, description, enabled, onToggle, cost,
}: {
  icon: React.ReactNode;
  bg: string;
  activeClass: string;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  cost?: { text: string; className: string };
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink leading-tight">{label}</p>
        <p className="text-xs text-slate">{description}</p>
        {cost && <p className={`text-xs font-medium mt-0.5 ${cost.className}`}>{cost.text}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onToggle(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${enabled ? activeClass : "bg-gray-200"}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}
