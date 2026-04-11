"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";
import { createLocation } from "@/app/(dashboard)/d/_actions/locations";
import {
  completeOnboarding,
  setupOnboardingDemo,
  approveOnboardingVisit,
  updateOrganizationProfile,
} from "@/app/(dashboard)/d/_actions/onboarding";
import { ALLOWED_SPECIALTIES } from "@/lib/constants";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { Check, Tablet, Star, CreditCard, ArrowRight, Users, CalendarClock, Phone, MessageSquare, PhoneForwarded, ListChecks, ExternalLink, ChevronLeft, ArrowLeftRight } from "lucide-react";
import StepIndicator from "./StepIndicator";
import AddStaffStep from "./AddStaffStep";
import ClinicFeaturesStep from "./ClinicFeaturesStep";

interface OrgInfo {
  id: string;
  name: string;
  slug: string;
  credits_total: number;
  credits_used: number;
  trial_end_date: string;
}

interface ExistingLocation {
  id: string;
  name: string;
}

export default function OnboardingWizard({
  org,
  existingLocations,
}: {
  org: OrgInfo;
  existingLocations: ExistingLocation[];
}) {
  const router = useRouter();
  const storageKey = `hilt_onboarding_${org.id}`;
  const [hydrated, setHydrated] = useState(false);

  const [step, setStep] = useState(existingLocations.length > 0 ? 6 : 0);

  // Step 2 state (Raven Scheduler)
  const [ravenApiKey, setRavenApiKey] = useState("");
  const [savingRaven, setSavingRaven] = useState(false);
  const [showRavenInput, setShowRavenInput] = useState(false);
  const [ravenError, setRavenError] = useState("");

  // Step 3 state (Configure Clinic)
  const [nurseEnabled, setNurseEnabled] = useState(false);

  // Step 0 state (Profile)
  const [profileFullName, setProfileFullName] = useState("");
  const [profileOrgName, setProfileOrgName] = useState(org.name === "My Clinic" ? "" : org.name);
  const [premiumCode, setPremiumCode] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Step 1 state
  const [locationName, setLocationName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Created or existing location
  const [locationId, setLocationId] = useState(
    existingLocations[0]?.id ?? ""
  );
  const [createdLocationName, setCreatedLocationName] = useState(
    existingLocations[0]?.name ?? ""
  );

  // Restore wizard state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const s = JSON.parse(saved);
        // Only restore if the saved location still exists on the server
        const locationValid = s.locationId && existingLocations.some((l) => l.id === s.locationId);
        if (locationValid) {
          if (typeof s.step === "number") setStep(s.step);
          setLocationId(s.locationId);
          if (s.locationName) setCreatedLocationName(s.locationName);
          if (s.ravenApiKey) setRavenApiKey(s.ravenApiKey);
        }
      }
    } catch {}
    setHydrated(true);
  }, [storageKey, existingLocations]);

  // Persist wizard state on changes (skip until hydrated to avoid overwriting with defaults)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ step, locationId, locationName: createdLocationName, ravenApiKey })
      );
    } catch {}
  }, [hydrated, step, locationId, createdLocationName, ravenApiKey, storageKey]);

  // Step 6 (Try It) state
  const [demoReady, setDemoReady] = useState(false);
  const [demoError, setDemoError] = useState("");
  type TryItPhase = "ready" | "detected" | "success";
  const [tryPhase, setTryPhase] = useState<TryItPhase>("ready");
  const [detectedVisit, setDetectedVisit] = useState<{
    id: string;
    patientName: string;
  } | null>(null);
  const [approving, setApproving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Set up demo (create owner staff account + check in as receptionist)
  useEffect(() => {
    if (step !== 6 || !locationId || demoReady) return;

    let cancelled = false;
    setupOnboardingDemo(locationId).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setDemoReady(true);
      } else {
        setDemoError(result.error || "Failed to set up demo");
      }
    });

    return () => { cancelled = true; };
  }, [step, locationId, demoReady]);

  // QR rendering
  useEffect(() => {
    if (step === 6 && locationId && demoReady && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        `${process.env.NEXT_PUBLIC_APP_URL || "https://hilthealth.com"}/checkin/${locationId}`,
        { width: 200, margin: 2, color: { dark: "#111827", light: "#ffffff" } }
      );
    }
  }, [step, locationId, demoReady, tryPhase]);

  // Realtime subscription — starts immediately when step 6 is ready
  useEffect(() => {
    if (step !== 6 || !locationId || !demoReady || tryPhase !== "ready") return;

    const supabase = createClient();
    const channel = supabase
      .channel(`onboarding:${locationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "visits",
          filter: `location_id=eq.${locationId}`,
        },
        (payload) => {
          const visit = payload.new as Record<string, unknown>;
          if (visit.status === "pending_approval") {
            supabase
              .from("patients")
              .select("first_name, last_name")
              .eq("id", visit.patient_id as string)
              .single()
              .then(({ data: pt }) => {
                setDetectedVisit({
                  id: visit.id as string,
                  patientName: pt
                    ? `${pt.first_name} ${pt.last_name}`
                    : "Test Patient",
                });
                setTryPhase("detected");
              });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [step, locationId, demoReady, tryPhase]);

  const handleCreateLocation = useCallback(async () => {
    if (!locationName.trim()) {
      setCreateError("Location name is required");
      return;
    }
    setCreating(true);
    setCreateError("");
    const result = await createLocation({
      orgId: org.id,
      name: locationName.trim(),
      specialty: specialty || undefined,
    });
    setCreating(false);
    if (result.success && result.locationId) {
      setLocationId(result.locationId);
      setCreatedLocationName(locationName.trim());
      setStep(2); // Raven step
    } else {
      setCreateError(result.error || "Failed to create location");
    }
  }, [locationName, specialty, org.id]);

  const handleSaveRaven = useCallback(async () => {
    if (!ravenApiKey.trim()) return;
    setSavingRaven(true);
    setRavenError("");
    // TODO: validate against Raven API when endpoint is available
    setSavingRaven(false);
    setRavenError("This is not a valid Raven Scheduler API key. You can get your key from the Raven dashboard at ravenscheduler.com.");
  }, [ravenApiKey]);

  const handleApprove = useCallback(async () => {
    if (!detectedVisit) return;
    setApproving(true);
    const result = await approveOnboardingVisit(detectedVisit.id);
    setApproving(false);
    if (result.success) {
      setTryPhase("success");
    }
  }, [detectedVisit]);

  const clearWizardState = useCallback(() => {
    try { localStorage.removeItem(storageKey); } catch {}
  }, [storageKey]);

  const handleFinish = useCallback(async () => {
    clearWizardState();
    await completeOnboarding();
    router.push("/d/owner");
  }, [router, clearWizardState]);

  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(org.trial_end_date).getTime() - Date.now()) / 86400000
    )
  );
  const creditsRemaining = Math.max(0, org.credits_total - org.credits_used);
  const checkinUrl = locationId
    ? `${process.env.NEXT_PUBLIC_APP_URL || "https://hilthealth.com"}/checkin/${locationId}`
    : "";

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-hilt-blue" />
      </div>
    );
  }

  return (
    <div>
      <StepIndicator currentStep={step} />

      {/* Step 0: Profile */}
      {step === 0 && (
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-ink mb-2 text-center">
            Welcome to Hilt Health
          </h2>
          <p className="text-sm text-slate mb-6 text-center">
            Tell us a bit about yourself and your clinic to get started.
          </p>


          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Your Name</label>
              <input
                type="text"
                required
                value={profileFullName}
                onChange={(e) => setProfileFullName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
                placeholder="Dr. Sarah Smith"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">Organization Name</label>
              <input
                type="text"
                required
                value={profileOrgName}
                onChange={(e) => setProfileOrgName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
                placeholder="Smith Family Clinic"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Premium Code <span className="font-normal text-ash">(optional)</span>
              </label>
              <input
                type="text"
                value={premiumCode}
                onChange={(e) => setPremiumCode(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-mono tracking-wider focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
                placeholder="Enter premium code"
              />
              <p className="mt-1 text-xs text-ash">Have a premium code? Enter it to unlock additional credits.</p>
            </div>
          </div>

          {profileError && (
            <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{profileError}</div>
          )}

          <button
            onClick={async () => {
              if (!profileFullName.trim() || !profileOrgName.trim()) {
                setProfileError("Both fields are required");
                return;
              }
              setProfileSaving(true);
              setProfileError("");
              const result = await updateOrganizationProfile(profileOrgName.trim(), profileFullName.trim());
              if (!result.success) {
                setProfileSaving(false);
                setProfileError(result.error || "Something went wrong");
                return;
              }

              // Apply premium code if provided
              if (premiumCode.trim()) {
                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();
                const { data: codeResult } = await supabase.rpc("apply_premium_code", {
                  p_code: premiumCode.trim(),
                });
                if (codeResult && !codeResult.success) {
                  setProfileSaving(false);
                  setProfileError(codeResult.error || "Invalid or already used code");
                  return;
                }
              }

              setProfileSaving(false);
              setStep(1);
            }}
            disabled={profileSaving || !profileFullName.trim() || !profileOrgName.trim()}
            className="mt-6 w-full rounded-lg bg-hilt-blue px-6 py-3 text-sm font-semibold text-white hover:bg-hilt-blue-dark disabled:opacity-50"
          >
            {profileSaving ? "Saving..." : "Continue"}
          </button>
        </div>
      )}

      {/* Step 1: Create Location */}
      {step === 1 && (
        <div className="max-w-md mx-auto">
          {locationId ? (
            <>
              <h2 className="text-xl font-bold text-ink mb-1 text-center">
                Your Location
              </h2>
              <p className="text-sm text-slate mb-6 text-center">
                This is where patients will check in.
              </p>

              <div className="rounded-xl border border-green-200 bg-green-50 p-4 mb-5 flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{createdLocationName}</p>
                  <p className="text-xs text-slate">Location created</p>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-hilt-blue-dark"
              >
                Continue
              </button>

              <button
                onClick={() => setStep(0)}
                className="w-full flex items-center justify-center gap-1 text-sm text-slate hover:text-ink transition-colors py-2 mt-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-ink mb-1 text-center">
                Create Your First Location
              </h2>
              <p className="text-sm text-slate mb-6 text-center">
                This is where patients will check in.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    Location Name
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g., Downtown Clinic"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    Specialty{" "}
                    <span className="font-normal text-ash">(optional)</span>
                  </label>
                  <SearchableSelect
                    options={ALLOWED_SPECIALTIES}
                    value={specialty}
                    onChange={setSpecialty}
                    placeholder="Search specialties..."
                    emptyLabel="Select a specialty"
                  />
                </div>

                {createError && (
                  <p className="text-sm text-red-600">{createError}</p>
                )}

                <button
                  onClick={handleCreateLocation}
                  disabled={creating || !locationName.trim()}
                  className="w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-hilt-blue-dark disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Location"}
                </button>

                <button
                  onClick={() => router.push("/d/owner")}
                  className="w-full text-sm text-slate hover:text-ink transition-colors py-2"
                >
                  I will do this later
                </button>

                <button
                  onClick={() => setStep(0)}
                  className="w-full flex items-center justify-center gap-1 text-sm text-slate hover:text-ink transition-colors py-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 2: Raven Scheduler */}
      {step === 2 && locationId && (
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-50 border border-violet-200 px-3 py-1">
              <Phone className="h-3.5 w-3.5 text-violet-600" />
              <span className="text-xs font-medium text-violet-700">Recommended integration</span>
            </div>
            <h2 className="text-xl font-bold text-ink mb-1">
              Add an AI Receptionist
            </h2>
            <p className="text-sm text-slate">
              Raven Scheduler gives {createdLocationName} an AI phone line that books appointments, sends reminders, and recovers no shows, all without staff lifting a finger.
            </p>
          </div>

          <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-5 mb-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100">
                  <Phone className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">24/7 call answering</p>
                  <p className="text-xs text-slate mt-0.5">
                    AI answers every call and books appointments in natural conversation.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100">
                  <MessageSquare className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">SMS automation</p>
                  <p className="text-xs text-slate mt-0.5">
                    Confirmations, reminders, and two way replies. All automatic.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100">
                  <PhoneForwarded className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">No show recovery</p>
                  <p className="text-xs text-slate mt-0.5">
                    AI calls back missed patients and reschedules them automatically.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100">
                  <ListChecks className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">Waitlist management</p>
                  <p className="text-xs text-slate mt-0.5">
                    Cancellations get filled from the waitlist without any manual work.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 mb-5 flex items-start gap-3">
            <CalendarClock className="h-5 w-5 text-hilt-blue mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-ink">Works directly with Hilt queues</p>
              <p className="text-xs text-slate mt-0.5">
                When connected, Hilt knows who is coming before they walk in. Scheduled patients are prioritized in your queue automatically and the AI pre screen starts with full appointment context.
              </p>
            </div>
          </div>

          {showRavenInput ? (
            <div className="rounded-xl border border-violet-200 bg-white p-4 mb-4">
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Raven Scheduler API Key
              </label>
              <input
                type="text"
                value={ravenApiKey}
                onChange={(e) => { setRavenApiKey(e.target.value); setRavenError(""); }}
                placeholder="Paste your API key from Raven dashboard"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-1 ${
                  ravenError
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-200 focus:border-violet-500 focus:ring-violet-500"
                } mb-1.5`}
                autoFocus
              />
              {ravenError && (
                <p className="text-xs text-red-600 mb-2">{ravenError}</p>
              )}
              <button
                onClick={handleSaveRaven}
                disabled={savingRaven || !ravenApiKey.trim()}
                className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 mt-1.5"
              >
                {savingRaven ? "Validating..." : "Connect and Continue"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowRavenInput(true)}
              className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 mb-4"
            >
              I have a Raven API Key
            </button>
          )}

          <button
            onClick={() => setStep(3)}
            disabled={savingRaven}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-gray-50 transition-colors mb-1.5"
          >
            Continue without Raven
          </button>
          <p className="text-xs text-ash text-center mb-3">
            You can connect Raven anytime from location settings.
          </p>

          <div className="flex items-center justify-center gap-1.5 mb-3">
            <a
              href="https://ravenscheduler.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-violet-600 hover:text-violet-800 font-medium inline-flex items-center gap-1"
            >
              Learn more at ravenscheduler.com
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <button
            onClick={() => setStep(1)}
            disabled={savingRaven}
            className="w-full flex items-center justify-center gap-1 text-sm text-slate hover:text-ink transition-colors py-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      )}

      {/* Step 3: Configure Clinic */}
      {step === 3 && locationId && (
        <ClinicFeaturesStep
          locationId={locationId}
          hasRaven={!!ravenApiKey.trim()}
          onBack={() => setStep(2)}
          onComplete={(features) => {
            setNurseEnabled(features.nurse);
            setStep(4);
          }}
        />
      )}

      {/* Step 4: Add Staff */}
      {step === 4 && locationId && (
        <AddStaffStep
          orgId={org.id}
          orgSlug={org.slug}
          locationId={locationId}
          locationName={createdLocationName}
          nurseEnabled={nurseEnabled}
          onContinue={() => setStep(5)}
          onBack={() => setStep(3)}
        />
      )}

      {/* Step 5: Data Transfer */}
      {step === 5 && (
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1">
              <ArrowLeftRight className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">Free with every plan</span>
            </div>
            <h2 className="text-xl font-bold text-ink mb-1">
              Data Transfer
            </h2>
            <p className="text-sm text-slate">
              Switching from another system? We handle the entire migration for you, at no extra cost.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 mb-5">
            <p className="text-sm text-ink mb-3 font-medium">
              Our team will transfer all your data from your current system, including:
            </p>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-3 w-3 text-emerald-600" />
                </div>
                <span className="text-sm text-slate">Patient records, demographics, and contact information</span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-3 w-3 text-emerald-600" />
                </div>
                <span className="text-sm text-slate">Visit history, notes, and documents</span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-3 w-3 text-emerald-600" />
                </div>
                <span className="text-sm text-slate">Staff accounts and role assignments</span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-3 w-3 text-emerald-600" />
                </div>
                <span className="text-sm text-slate">Any other data from your current EMR or intake system</span>
              </li>
            </ul>
          </div>

          <a
            href="https://cal.com/102937474/hilt-health-meeting"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 text-center mb-3 transition-colors"
          >
            Book a Meeting
          </a>

          <button
            onClick={() => setStep(6)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-gray-50 transition-colors mb-1.5"
          >
            Continue without transfer
          </button>

          <button
            onClick={() => setStep(4)}
            className="w-full flex items-center justify-center gap-1 text-sm text-slate hover:text-ink transition-colors py-2 mt-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      )}

      {/* Step 6: Try the Check-in */}
      {step === 6 && (
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-xl font-bold text-ink mb-1">
            Try the Check in
          </h2>
          <p className="text-sm text-slate mb-6">
            See how patients will check in at{" "}
            <span className="font-medium">{createdLocationName}</span>.
          </p>

          {!demoReady && !demoError && (
            <div className="flex items-center justify-center gap-2 py-12">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-hilt-blue" />
              <span className="text-sm text-slate">Setting up...</span>
            </div>
          )}

          {demoError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-4">
              <p className="text-sm text-red-700">{demoError}</p>
            </div>
          )}

          {demoReady && tryPhase === "ready" && (
            <>
              <div className="flex justify-center mb-4">
                <canvas ref={canvasRef} className="rounded-lg" />
              </div>
              <p className="text-xs text-slate mb-4 break-all">{checkinUrl}</p>
              <a
                href={checkinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-hilt-blue-dark text-center mb-4"
              >
                Open Check in Page
              </a>
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hilt-blue opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-hilt-blue" />
                </span>
                <span className="text-sm text-slate">
                  Waiting for a check in...
                </span>
              </div>
              <p className="text-xs text-ash mb-2">
                Open the link above in another tab, fill out the form as a test patient, and submit.
              </p>
              <p className="text-xs text-ash">
                This demo uses 1.5 credits from your trial ({creditsRemaining} remaining).
              </p>
            </>
          )}

          {demoReady && tryPhase === "detected" && detectedVisit && (
            <div className="rounded-xl border-2 border-green-200 bg-green-50 p-6 mb-4">
              <p className="text-sm font-medium text-green-800 mb-1">
                New check in detected!
              </p>
              <p className="text-lg font-semibold text-ink mb-4">
                {detectedVisit.patientName}
              </p>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {approving ? "Approving..." : "Approve Check in"}
              </button>
            </div>
          )}

          {demoReady && tryPhase === "success" && (
            <div className="rounded-xl border-2 border-green-200 bg-green-50 p-6 mb-4">
              <div className="mb-2 flex justify-center"><Check className="h-8 w-8 text-green-600" /></div>
              <p className="text-sm font-medium text-green-800 mb-1">
                Your test patient is now talking with the AI!
              </p>
              <p className="text-xs text-green-700">
                They will answer symptom questions, and the doctor will get a structured summary.
              </p>
              <p className="text-xs text-green-700 mt-2">
                This shows the patient side. To see the full patient to doctor flow, try the{" "}
                <a href="/demo" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-green-900">
                  live demo on the homepage
                </a>.
              </p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            {demoReady && (
              <button
                onClick={() => setStep(7)}
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white ${
                  tryPhase === "success"
                    ? "bg-hilt-blue hover:bg-hilt-blue-dark"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
              >
                {tryPhase === "success" ? "Continue" : "Skip this step"}
              </button>
            )}

            <button
              onClick={() => setStep(5)}
              className="w-full flex items-center justify-center gap-1 text-sm text-slate hover:text-ink transition-colors py-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 7: All Set */}
      {step === 7 && (
        <div className="max-w-lg mx-auto text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-ink mb-2">
            You Are All Set!
          </h2>

          <button
            onClick={handleFinish}
            className="w-full rounded-lg bg-hilt-blue px-6 py-3 text-sm font-semibold text-white hover:bg-hilt-blue-dark flex items-center justify-center gap-2 mb-8"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="text-xs text-ash mb-4">
            Or jump to a specific section:
          </p>

          <div className="grid gap-3 sm:grid-cols-2 mb-4">
            <button
              onClick={async () => { clearWizardState(); await completeOnboarding(); router.push("/d/owner/kiosk"); }}
              className="rounded-xl border border-gray-100 bg-white p-4 text-left hover:border-hilt-blue transition-colors"
            >
              <Tablet className="h-5 w-5 text-hilt-blue mb-1" />
              <h3 className="text-sm font-semibold text-ink">
                Set up a check in tablet
              </h3>
              <p className="text-xs text-slate mt-1">
                Use an iPad or tablet in your waiting room
              </p>
            </button>
            <button
              onClick={async () => { clearWizardState(); await completeOnboarding(); router.push("/d/reviews"); }}
              className="rounded-xl border border-gray-100 bg-white p-4 text-left hover:border-hilt-blue transition-colors"
            >
              <Star className="h-5 w-5 text-hilt-blue mb-1" />
              <h3 className="text-sm font-semibold text-ink">
                Configure review collection
              </h3>
              <p className="text-xs text-slate mt-1">
                Automatically ask patients for reviews
              </p>
            </button>
            <button
              onClick={async () => { clearWizardState(); await completeOnboarding(); router.push("/d/owner/billing"); }}
              className="rounded-xl border border-gray-100 bg-white p-4 text-left hover:border-hilt-blue transition-colors"
            >
              <CreditCard className="h-5 w-5 text-hilt-blue mb-1" />
              <h3 className="text-sm font-semibold text-ink">
                Check billing &amp; credits
              </h3>
              <p className="text-xs text-slate mt-1">
                View your plan, usage, and credit balance
              </p>
            </button>
            <button
              onClick={async () => { clearWizardState(); await completeOnboarding(); router.push("/d/owner/staff"); }}
              className="rounded-xl border border-gray-100 bg-white p-4 text-left hover:border-hilt-blue transition-colors"
            >
              <Users className="h-5 w-5 text-hilt-blue mb-1" />
              <h3 className="text-sm font-semibold text-ink">
                Invite your team
              </h3>
              <p className="text-xs text-slate mt-1">
                Add doctors, receptionists, and nurses
              </p>
            </button>
          </div>

          <p className="text-xs text-ash">
            You can always find these in your dashboard sidebar.
          </p>
        </div>
      )}
    </div>
  );
}
