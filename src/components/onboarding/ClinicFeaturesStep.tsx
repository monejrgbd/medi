"use client";

import { useState, useEffect } from "react";
import { HeartPulse, Activity, Syringe, FastForward, MessageSquare, Stethoscope, UserPlus, Search, Lock, CalendarClock } from "lucide-react";
import { updateLocation } from "@/app/(dashboard)/d/_actions/locations";
import { initializeOrgDefaultVitals } from "@/app/(dashboard)/d/_actions/nurse";
import { createClient } from "@/lib/supabase/client";
import { QUEUE_TYPES } from "@/lib/constants";

interface ClinicFeaturesStepProps {
  locationId: string;
  hasRaven?: boolean;
  onComplete: (features: {
    nurse: boolean;
    vitals: boolean;
    vaccines: boolean;
    skipAi: boolean;
    reviewSms: boolean;
    diagnostic: boolean;
  }) => void;
  onBack?: () => void;
}

export default function ClinicFeaturesStep({
  locationId,
  hasRaven,
  onComplete,
  onBack,
}: ClinicFeaturesStepProps) {
  const [loaded, setLoaded] = useState(false);
  const [nurseEnabled, setNurseEnabled] = useState(false);
  const [vitalsEnabled, setVitalsEnabled] = useState(true);
  const [vaccinesEnabled, setVaccinesEnabled] = useState(false);
  const [skipAi, setSkipAi] = useState(false); // inverted in UI: "AI Intake" ON = skipAi false
  const [reviewSmsEnabled, setReviewSmsEnabled] = useState(true);
  const [diagnosticEnabled, setDiagnosticEnabled] = useState(true);
  const [askReferralSource, setAskReferralSource] = useState(false);
  const [askDiscoverySource, setAskDiscoverySource] = useState(false);
  const [queueType, setQueueType] = useState("fifo");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load existing DB values on mount so going back never resets the form
  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("get_location_detail", { p_location_id: locationId }).then(({ data }) => {
      const loc = data?.location;
      if (loc) {
        setNurseEnabled(loc.nurse_enabled ?? false);
        setVitalsEnabled(loc.vitals_enabled ?? true);
        setVaccinesEnabled(loc.vaccines_enabled ?? false);
        setSkipAi(loc.skip_ai ?? false);
        setReviewSmsEnabled(loc.review_sms_enabled ?? true);
        setDiagnosticEnabled(loc.diagnostic_enabled ?? true);
        setAskReferralSource(loc.ask_referral_source ?? false);
        setAskDiscoverySource(loc.ask_discovery_source ?? false);
        setQueueType(loc.queue_type ?? "fifo");
      }
      setLoaded(true);
    });
  }, [locationId]);

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
      queueType,
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
        askReferralSource,
        askDiscoverySource,
        queueType,
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

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-hilt-blue" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold text-ink mb-1 text-center">
        Configure Your Clinic
      </h2>
      <p className="text-sm text-slate mb-4 text-center">
        Set your queue type and enable the features your workflow needs. You can change these later.
      </p>

      {/* Queue Type */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-ink mb-2">Queue Type</h3>
        <div className="space-y-1.5">
          {QUEUE_TYPES.map((qt) => {
            const isLocked = qt.requiresRaven && !hasRaven;
            const isSelected = queueType === qt.value;
            return (
              <button
                key={qt.value}
                type="button"
                disabled={isLocked}
                onClick={() => setQueueType(qt.value)}
                className={`w-full rounded-xl border p-2.5 text-left transition-colors ${
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
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-ash">
                        {isLocked ? <Lock className="h-3 w-3" /> : <CalendarClock className="h-3 w-3" />}
                        Raven
                      </span>
                    )}
                    <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      isSelected ? "border-hilt-blue bg-hilt-blue" : "border-gray-300"
                    }`}>
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                </div>
                <p className={`text-xs mt-0.5 ${isLocked ? "text-ash" : "text-slate"}`}>
                  {qt.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Features */}
      <h3 className="text-sm font-semibold text-ink mb-2">Features</h3>
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
          enabled={diagnosticEnabled}
          onToggle={setDiagnosticEnabled}
        />

        {/* Referral Tracking */}
        <FeatureTile
          icon={<UserPlus className="h-4 w-4 text-indigo-600" />}
          bg="bg-indigo-50"
          activeClass="bg-indigo-500"
          label="Referral Tracking"
          description="Ask if referred by another provider."
          enabled={askReferralSource}
          onToggle={setAskReferralSource}
        />

        {/* Discovery Source */}
        <FeatureTile
          icon={<Search className="h-4 w-4 text-cyan-600" />}
          bg="bg-cyan-50"
          activeClass="bg-cyan-500"
          label="Discovery Source"
          description="Ask new patients how they found you."
          enabled={askDiscoverySource}
          onToggle={setAskDiscoverySource}
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

      {onBack && (
        <button
          onClick={onBack}
          disabled={saving}
          className="w-full flex items-center justify-center gap-1 text-sm text-slate hover:text-ink transition-colors py-2 mt-1"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back
        </button>
      )}
    </div>
  );
}

function FeatureTile({
  icon, bg, activeClass, label, description, enabled, onToggle,
}: {
  icon: React.ReactNode;
  bg: string;
  activeClass: string;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
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
      </div>
    </label>
  );
}
