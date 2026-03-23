"use client";

import { useState } from "react";
import { HeartPulse, Activity, Syringe, FastForward, MessageSquare, Stethoscope } from "lucide-react";
import { updateLocation } from "@/app/(dashboard)/d/_actions/locations";
import { initializeOrgDefaultVitals } from "@/app/(dashboard)/d/_actions/nurse";

interface ClinicFeaturesStepProps {
  locationId: string;
  onComplete: (features: {
    nurse: boolean;
    vitals: boolean;
    vaccines: boolean;
    skipAi: boolean;
    reviewSms: boolean;
    diagnostic: boolean;
  }) => void;
}

export default function ClinicFeaturesStep({
  locationId,
  onComplete,
}: ClinicFeaturesStepProps) {
  const [nurseEnabled, setNurseEnabled] = useState(false);
  const [vitalsEnabled, setVitalsEnabled] = useState(true);
  const [vaccinesEnabled, setVaccinesEnabled] = useState(false);
  const [skipAi, setSkipAi] = useState(false); // inverted in UI: "AI Intake" ON = skipAi false
  const [reviewSmsEnabled, setReviewSmsEnabled] = useState(true);
  const [diagnosticEnabled, setDiagnosticEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleNurseToggle(checked: boolean) {
    setNurseEnabled(checked);
    if (checked && !vitalsEnabled) {
      setVitalsEnabled(true);
    }
  }

  async function handleSkip() {
    setSaving(true);
    await updateLocation({
      locationId,
      vitalsEnabled: true,
      reviewSmsEnabled: true,
      diagnosticEnabled: true,
    });
    setSaving(false);
    onComplete({ nurse: false, vitals: true, vaccines: false, skipAi: false, reviewSms: true, diagnostic: true });
  }

  async function handleContinue() {
    setSaving(true);
    setError("");

    try {
      const result = await updateLocation({
        locationId,
        nurseEnabled,
        vitalsEnabled,
        vaccinesEnabled,
        skipAi,
        reviewSmsEnabled,
        diagnosticEnabled,
      });

      if (!result.success) {
        setError(result.error || "Failed to save feature settings");
        setSaving(false);
        return;
      }

      if (vitalsEnabled) {
        await initializeOrgDefaultVitals();
      }

      onComplete({
        nurse: nurseEnabled,
        vitals: vitalsEnabled,
        vaccines: vaccinesEnabled,
        skipAi,
        reviewSms: reviewSmsEnabled,
        diagnostic: diagnosticEnabled,
      });
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold text-ink mb-1 text-center">
        Customize Your Clinic
      </h2>
      <p className="text-sm text-slate mb-4 text-center">
        Enable the features your workflow needs. You can change these later.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-5">
        {/* Nurse Triage */}
        <FeatureTile
          icon={<HeartPulse className="h-4 w-4 text-teal-600" />}
          bg="bg-teal-50"
          activeClass="bg-teal-500"
          label="Nurse Triage"
          description="Nurses screen patients first."
          enabled={nurseEnabled}
          onToggle={(v) => handleNurseToggle(v)}
        />

        {/* Vitals Tracking */}
        <FeatureTile
          icon={<Activity className="h-4 w-4 text-blue-600" />}
          bg="bg-blue-50"
          activeClass="bg-blue-500"
          label="Vitals Tracking"
          description="Weight, BP, and more."
          enabled={vitalsEnabled}
          onToggle={setVitalsEnabled}
        />

        {/* Vaccine Management */}
        <FeatureTile
          icon={<Syringe className="h-4 w-4 text-green-600" />}
          bg="bg-green-50"
          activeClass="bg-green-500"
          label="Vaccines"
          description="Track shots and schedules."
          enabled={vaccinesEnabled}
          onToggle={setVaccinesEnabled}
        />

        {/* AI Intake */}
        <FeatureTile
          icon={<FastForward className="h-4 w-4 text-violet-600" />}
          bg="bg-violet-50"
          activeClass="bg-violet-500"
          label="AI Intake"
          description="AI screens before the doctor."
          enabled={!skipAi}
          onToggle={(v) => setSkipAi(!v)}
        />

        {/* Review SMS */}
        <FeatureTile
          icon={<MessageSquare className="h-4 w-4 text-amber-600" />}
          bg="bg-amber-50"
          activeClass="bg-amber-500"
          label="Review SMS"
          description="Text patients for reviews."
          cost="0.1 credits/SMS"
          costClass="text-amber-600"
          enabled={reviewSmsEnabled}
          onToggle={setReviewSmsEnabled}
        />

        {/* Diagnostic AI */}
        <FeatureTile
          icon={<Stethoscope className="h-4 w-4 text-rose-600" />}
          bg="bg-rose-50"
          activeClass="bg-rose-500"
          label="Diagnostic AI"
          description="AI suggests diagnoses."
          cost="0.5 credits/use"
          costClass="text-rose-600"
          enabled={diagnosticEnabled}
          onToggle={setDiagnosticEnabled}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={saving}
        className="w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-hilt-blue-dark disabled:opacity-50"
      >
        {saving ? "Saving..." : "Continue"}
      </button>

      <button
        onClick={handleSkip}
        disabled={saving}
        className="w-full text-sm text-slate hover:text-ink transition-colors py-2 mt-2"
      >
        Skip this step
      </button>
    </div>
  );
}

function FeatureTile({
  icon, bg, activeClass, label, description, enabled, onToggle, cost, costClass,
}: {
  icon: React.ReactNode;
  bg: string;
  activeClass: string;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  cost?: string;
  costClass?: string;
}) {
  return (
    <label className="flex flex-col gap-2 rounded-xl border border-gray-200 p-3 cursor-pointer hover:border-gray-300 transition-colors select-none">
      <div className="flex items-center justify-between">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${bg}`}>
          {icon}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${enabled ? activeClass : "bg-gray-200"}`}
        >
          <span className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : "translate-x-1"}`} />
        </button>
      </div>
      <div>
        <p className="text-xs font-semibold text-ink leading-tight">{label}</p>
        <p className="text-xs text-slate leading-tight">{description}</p>
        {cost && <p className={`text-xs font-medium mt-0.5 ${costClass}`}>{cost}</p>}
      </div>
    </label>
  );
}
