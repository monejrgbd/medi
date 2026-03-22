"use client";

import { useState } from "react";
import { HeartPulse, Activity, Syringe, FastForward } from "lucide-react";
import { updateLocation } from "@/app/(dashboard)/d/_actions/locations";
import { initializeOrgDefaultVitals } from "@/app/(dashboard)/d/_actions/nurse";

interface ClinicFeaturesStepProps {
  locationId: string;
  onComplete: (features: {
    nurse: boolean;
    vitals: boolean;
    vaccines: boolean;
    skipAi: boolean;
  }) => void;
}

export default function ClinicFeaturesStep({
  locationId,
  onComplete,
}: ClinicFeaturesStepProps) {
  const [nurseEnabled, setNurseEnabled] = useState(false);
  const [vitalsEnabled, setVitalsEnabled] = useState(false);
  const [vaccinesEnabled, setVaccinesEnabled] = useState(false);
  const [skipAi, setSkipAi] = useState(false); // inverted in UI: "AI Intake" ON = skipAi false
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleNurseToggle(checked: boolean) {
    setNurseEnabled(checked);
    if (checked && !vitalsEnabled) {
      setVitalsEnabled(true);
    }
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
      <p className="text-sm text-slate mb-6 text-center">
        Enable the features your workflow needs. You can change these later.
      </p>

      <div className="space-y-3 mb-6">
        {/* Nurse Triage */}
        <label className="flex items-start gap-4 rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-teal-300 transition-colors">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50">
            <HeartPulse className="h-5 w-5 text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink">Nurse Triage</p>
            <p className="text-xs text-slate mt-0.5">
              Nurses screen patients before doctors see them. Record vitals,
              vaccines, and notes.
            </p>
          </div>
          <div className="shrink-0 pt-0.5">
            <button
              type="button"
              role="switch"
              aria-checked={nurseEnabled}
              onClick={() => handleNurseToggle(!nurseEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                nurseEnabled ? "bg-teal-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  nurseEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </label>

        {/* Vitals Tracking */}
        <label className="flex items-start gap-4 rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-blue-300 transition-colors">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink">Vitals Tracking</p>
            <p className="text-xs text-slate mt-0.5">
              Record weight, height, blood pressure, and more per visit. Choose
              which vitals to track.
            </p>
          </div>
          <div className="shrink-0 pt-0.5">
            <button
              type="button"
              role="switch"
              aria-checked={vitalsEnabled}
              onClick={() => setVitalsEnabled(!vitalsEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                vitalsEnabled ? "bg-blue-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  vitalsEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </label>

        {/* Vaccine Management */}
        <label className="flex items-start gap-4 rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-green-300 transition-colors">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50">
            <Syringe className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink">
              Vaccine Management
            </p>
            <p className="text-xs text-slate mt-0.5">
              Track administered vaccines, schedule due dates, and manage
              refusals.
            </p>
          </div>
          <div className="shrink-0 pt-0.5">
            <button
              type="button"
              role="switch"
              aria-checked={vaccinesEnabled}
              onClick={() => setVaccinesEnabled(!vaccinesEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                vaccinesEnabled ? "bg-green-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  vaccinesEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </label>

        {/* AI Intake (inverted: ON = skip_ai false, OFF = skip_ai true) */}
        <label className="flex items-start gap-4 rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-violet-300 transition-colors">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50">
            <FastForward className="h-5 w-5 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink">AI Intake</p>
            <p className="text-xs text-slate mt-0.5">
              AI screens patients before the doctor. Turn off to send patients
              straight to the queue without an AI conversation.
            </p>
          </div>
          <div className="shrink-0 pt-0.5">
            <button
              type="button"
              role="switch"
              aria-checked={!skipAi}
              onClick={() => setSkipAi(!skipAi)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                !skipAi ? "bg-violet-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  !skipAi ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </label>
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
        onClick={() =>
          onComplete({ nurse: false, vitals: false, vaccines: false, skipAi: false })
        }
        disabled={saving}
        className="w-full text-sm text-slate hover:text-ink transition-colors py-2 mt-2"
      >
        Skip this step
      </button>
    </div>
  );
}
