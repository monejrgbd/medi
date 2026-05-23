"use client";

import { useState, useEffect } from "react";
import { HeartPulse, FastForward, MessageSquare, Stethoscope, UserPlus, Search, Lock, CalendarClock, ChevronDown } from "lucide-react";
import { updateLocation } from "@/app/(dashboard)/d/_actions/locations";
import { createClient } from "@/lib/supabase/client";
import { QUEUE_TYPES } from "@/lib/constants";

type CheckinMode = "approve_to_start" | "approve_on_arrival" | "self_service_on_arrival";

const CHECKIN_MODE_OPTIONS: { value: CheckinMode; label: string; description: string; recommended?: boolean }[] = [
  {
    value: "approve_to_start",
    label: "Approve before chat",
    description: "Receptionist greets the patient, then the AI chat starts. Queue order uses chat completion.",
    recommended: true,
  },
  {
    value: "approve_on_arrival",
    label: "Approve on arrival",
    description: "Patient chats anywhere, then taps I Have Arrived on site. Receptionist approves into the queue.",
  },
  {
    value: "self_service_on_arrival",
    label: "Self service on arrival",
    description: "Patient chats anywhere, taps I Have Arrived on site and enters the queue automatically.",
  },
];

interface ClinicFeaturesStepProps {
  locationId: string;
  hasRaven?: boolean;
  onComplete: (features: {
    nurse: boolean;
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
  // Stored inverted in the DB. UI uses aiIntakeEnabled for clarity.
  const [skipAi, setSkipAi] = useState(false);
  const aiIntakeEnabled = !skipAi;
  const setAiIntakeEnabled = (v: boolean) => setSkipAi(!v);

  const [reviewSmsEnabled, setReviewSmsEnabled] = useState(true);
  const [diagnosticEnabled, setDiagnosticEnabled] = useState(true);
  const [askReferralSource, setAskReferralSource] = useState(false);
  const [askDiscoverySource, setAskDiscoverySource] = useState(true);
  const [queueType, setQueueType] = useState("fifo");
  const [checkinMode, setCheckinMode] = useState<CheckinMode>("approve_to_start");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);

  // Load existing DB values on mount so going back never resets the form
  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("get_location_detail", { p_location_id: locationId }).then(({ data }) => {
      const loc = data?.location;
      if (loc) {
        setNurseEnabled(loc.nurse_enabled ?? false);
        setSkipAi(loc.skip_ai ?? false);
        setReviewSmsEnabled(loc.review_sms_enabled ?? true);
        setDiagnosticEnabled(loc.diagnostic_enabled ?? true);
        setAskReferralSource(loc.ask_referral_source ?? false);
        setAskDiscoverySource(loc.ask_discovery_source ?? true);
        setQueueType(loc.queue_type ?? "fifo");
        setCheckinMode((loc.checkin_mode ?? "approve_to_start") as CheckinMode);
        // Auto open the More options section if anything inside is non default
        const isDefault =
          (loc.nurse_enabled ?? false) === false &&
          (loc.skip_ai ?? false) === false &&
          (loc.review_sms_enabled ?? true) === true &&
          (loc.diagnostic_enabled ?? true) === true &&
          (loc.ask_referral_source ?? false) === false &&
          (loc.ask_discovery_source ?? true) === true &&
          (loc.queue_type ?? "fifo") === "fifo";
        if (!isDefault) setMoreOptionsOpen(true);
      }
      setLoaded(true);
    });
  }, [locationId]);

  async function handleContinue() {
    setSaving(true);
    setError("");

    try {
      const result = await updateLocation({
        locationId,
        nurseEnabled,
        skipAi,
        reviewSmsEnabled,
        diagnosticEnabled,
        askReferralSource,
        askDiscoverySource,
        queueType,
        checkinMode,
      });

      if (!result.success) {
        setError(result.error || "Failed to save settings");
        setSaving(false);
        return;
      }

      onComplete({
        nurse: nurseEnabled,
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
        Set up your patient flow
      </h2>
      <p className="text-sm text-slate mb-6 text-center">
        Pick the defaults for this location. You can change any of this later.
      </p>

      {/* Main decision: check in flow */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-ink mb-2">How do patients check in?</h3>
        <div className="space-y-1.5">
          {CHECKIN_MODE_OPTIONS.map((opt) => {
            const isSelected = checkinMode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCheckinMode(opt.value)}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  isSelected
                    ? "border-hilt-blue bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 cursor-pointer"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-ink">{opt.label}</span>
                    {opt.recommended && (
                      <span className="shrink-0 rounded-full bg-green-50 text-green-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className={`shrink-0 flex h-4 w-4 items-center justify-center rounded-full border ${
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

      {/* More options collapsible */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => setMoreOptionsOpen((v) => !v)}
          className="w-full flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 text-left hover:border-gray-300 transition-colors"
        >
          <div>
            <p className="text-sm font-semibold text-ink">More options</p>
            <p className="text-xs text-slate mt-0.5">Queue order and feature toggles</p>
          </div>
          <ChevronDown className={`h-4 w-4 text-slate transition-transform ${moreOptionsOpen ? "rotate-180" : ""}`} />
        </button>

        {moreOptionsOpen && (
          <div className="mt-3 space-y-5">
            {/* Queue type */}
            <div>
              <h4 className="text-xs font-semibold text-ash uppercase tracking-wider mb-2">Queue order</h4>
              <div className="space-y-1.5">
                {QUEUE_TYPES.map((qt) => {
                  const isLocked = qt.requiresRaven && !hasRaven;
                  const isSelected = queueType === qt.value;
                  const isRecommended = qt.value === "fifo";
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
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-sm font-semibold ${isLocked ? "text-ash" : "text-ink"}`}>
                            {qt.label}
                          </span>
                          {isRecommended && !isLocked && (
                            <span className="shrink-0 rounded-full bg-green-50 text-green-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                              Recommended
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {qt.requiresRaven && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-ash">
                              {isLocked ? <Lock className="h-3 w-3" /> : <CalendarClock className="h-3 w-3" />}
                              {isLocked ? "Connect Raven" : "Raven"}
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

            {/* Features as single column rows */}
            <div>
              <h4 className="text-xs font-semibold text-ash uppercase tracking-wider mb-2">Features at this location</h4>
              <div className="space-y-1.5">
                <FeatureRow
                  icon={<FastForward className="h-4 w-4 text-violet-600" />}
                  iconBg="bg-violet-50"
                  label="AI patient intake"
                  description="AI screens patients before the doctor."
                  enabled={aiIntakeEnabled}
                  onToggle={setAiIntakeEnabled}
                />
                <FeatureRow
                  icon={<Stethoscope className="h-4 w-4 text-rose-600" />}
                  iconBg="bg-rose-50"
                  label="AI diagnostic assist"
                  description="AI suggests possible diagnoses to the doctor."
                  enabled={diagnosticEnabled}
                  onToggle={setDiagnosticEnabled}
                />
                <FeatureRow
                  icon={<MessageSquare className="h-4 w-4 text-amber-600" />}
                  iconBg="bg-amber-50"
                  label="Auto request reviews"
                  description="Text patients after visits asking for a review."
                  enabled={reviewSmsEnabled}
                  onToggle={setReviewSmsEnabled}
                />
                <FeatureRow
                  icon={<HeartPulse className="h-4 w-4 text-teal-600" />}
                  iconBg="bg-teal-50"
                  label="Nurse triage step"
                  description="Add a nurse triage step before the doctor sees the patient."
                  enabled={nurseEnabled}
                  onToggle={setNurseEnabled}
                />
                <FeatureRow
                  icon={<UserPlus className="h-4 w-4 text-indigo-600" />}
                  iconBg="bg-indigo-50"
                  label="Track patient referrals"
                  description="Ask if the patient was referred by another provider."
                  enabled={askReferralSource}
                  onToggle={setAskReferralSource}
                />
                <FeatureRow
                  icon={<Search className="h-4 w-4 text-cyan-600" />}
                  iconBg="bg-cyan-50"
                  label="Ask how patients found us"
                  description="Show new patients a Where did you hear about us prompt."
                  enabled={askDiscoverySource}
                  onToggle={setAskDiscoverySource}
                />
              </div>
            </div>
          </div>
        )}
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

      {onBack && (
        <button
          onClick={onBack}
          disabled={saving}
          className="w-full flex items-center justify-center gap-1 text-sm text-slate hover:text-ink transition-colors py-2 mt-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back
        </button>
      )}
    </div>
  );
}

function FeatureRow({
  icon, iconBg, label, description, enabled, onToggle,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-2.5 hover:border-gray-300 transition-colors">
      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink leading-tight">{label}</p>
        <p className="text-xs text-slate mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onToggle(!enabled)}
        className={`shrink-0 relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${enabled ? "bg-hilt-blue" : "bg-gray-200"}`}
      >
        <span className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : "translate-x-1"}`} />
      </button>
    </div>
  );
}
