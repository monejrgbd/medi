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
} from "@/app/(dashboard)/d/_actions/onboarding";
import { ALLOWED_SPECIALTIES } from "@/lib/constants";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { Check, Tablet, Star, CreditCard, ArrowRight } from "lucide-react";
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
  const [step, setStep] = useState(existingLocations.length > 0 ? 3 : 0);

  // Step 2 state (Customize Clinic)
  const [nurseEnabled, setNurseEnabled] = useState(false);
  const [vitalsEnabled, setVitalsEnabled] = useState(false);
  const [vaccinesEnabled, setVaccinesEnabled] = useState(false);

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

  // Step 4 (Try It) state
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
    if (step !== 4 || !locationId || demoReady) return;

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
    if (step === 4 && locationId && demoReady && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        `${process.env.NEXT_PUBLIC_APP_URL || "https://hilthealth.com"}/checkin/${locationId}`,
        { width: 200, margin: 2, color: { dark: "#111827", light: "#ffffff" } }
      );
    }
  }, [step, locationId, demoReady, tryPhase]);

  // Realtime subscription — starts immediately when step 4 is ready
  useEffect(() => {
    if (step !== 4 || !locationId || !demoReady || tryPhase !== "ready") return;

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
      setStep(2);
    } else {
      setCreateError(result.error || "Failed to create location");
    }
  }, [locationName, specialty, org.id]);

  const handleApprove = useCallback(async () => {
    if (!detectedVisit) return;
    setApproving(true);
    const result = await approveOnboardingVisit(detectedVisit.id);
    setApproving(false);
    if (result.success) {
      setTryPhase("success");
    }
  }, [detectedVisit]);

  const handleFinish = useCallback(async () => {
    await completeOnboarding();
    router.push("/d/owner");
  }, [router]);

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

  return (
    <div>
      <StepIndicator currentStep={step} />

      {/* Step 0: Welcome */}
      {step === 0 && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-ink mb-2">
            Welcome to Hilt Health
          </h2>
          <p className="text-lg text-slate mb-6">{org.name}</p>

          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-4 py-2 mb-8">
            <span className="text-sm font-medium text-blue-800">
              {creditsRemaining} credits &middot; {daysRemaining} days remaining
            </span>
          </div>

          <div className="max-w-md mx-auto text-left space-y-3 mb-8">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700"><Check className="h-3 w-3" /></span>
              <div>
                <p className="text-sm font-medium text-ink">
                  AI intake in 130+ languages
                </p>
                <p className="text-xs text-slate mt-0.5">
                  Patients describe symptoms by text or voice. Doctors read a structured summary before walking in.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700"><Check className="h-3 w-3" /></span>
              <div>
                <p className="text-sm font-medium text-ink">
                  Returning patients are remembered
                </p>
                <p className="text-xs text-slate mt-0.5">
                  AI references past visits and picks up where the doctor left off.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700"><Check className="h-3 w-3" /></span>
              <div>
                <p className="text-sm font-medium text-ink">
                  Reviews collected automatically
                </p>
                <p className="text-xs text-slate mt-0.5">
                  Happy patients guided to Google or Yelp. Low ratings come to you privately first.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700"><Check className="h-3 w-3" /></span>
              <div>
                <p className="text-sm font-medium text-ink">
                  Follow ups that carry doctor instructions
                </p>
                <p className="text-xs text-slate mt-0.5">
                  Doctors tag what to ask next time. AI continues with full memory on the return visit.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700"><Check className="h-3 w-3" /></span>
              <div>
                <p className="text-sm font-medium text-ink">
                  Marketing that reads every chart
                </p>
                <p className="text-xs text-slate mt-0.5">
                  Describe who you want to reach in plain English. AI scans visit histories, medications, and conditions to find them.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700"><Check className="h-3 w-3" /></span>
              <div>
                <p className="text-sm font-medium text-ink">
                  Analytics and referral tracking
                </p>
                <p className="text-xs text-slate mt-0.5">
                  Wait times, patient volume, and staff performance across every location. Refer patients digitally and track incoming referrals from other clinics.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(1)}
            className="rounded-lg bg-hilt-blue px-6 py-3 text-sm font-semibold text-white hover:bg-hilt-blue-dark"
          >
            Set Up Your First Location
          </button>
        </div>
      )}

      {/* Step 1: Create Location */}
      {step === 1 && (
        <div className="max-w-md mx-auto">
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
          </div>
        </div>
      )}

      {/* Step 2: Customize Clinic */}
      {step === 2 && locationId && (
        <ClinicFeaturesStep
          locationId={locationId}
          onComplete={(features) => {
            setNurseEnabled(features.nurse);
            setVitalsEnabled(features.vitals);
            setVaccinesEnabled(features.vaccines);
            setStep(3);
          }}
        />
      )}

      {/* Step 3: Add Staff */}
      {step === 3 && locationId && (
        <AddStaffStep
          orgId={org.id}
          orgSlug={org.slug}
          locationId={locationId}
          locationName={createdLocationName}
          nurseEnabled={nurseEnabled}
          onContinue={() => setStep(4)}
        />
      )}

      {/* Step 4: Try the Check-in */}
      {step === 4 && (
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
                onClick={() => setStep(5)}
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white ${
                  tryPhase === "success"
                    ? "bg-hilt-blue hover:bg-hilt-blue-dark"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
              >
                {tryPhase === "success" ? "Continue" : "Skip this step"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 5: All Set */}
      {step === 5 && (
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
              onClick={async () => { await completeOnboarding(); router.push("/d/owner/kiosk"); }}
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
              onClick={async () => { await completeOnboarding(); router.push("/d/reviews"); }}
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
              onClick={async () => { await completeOnboarding(); router.push("/d/owner/billing"); }}
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
          </div>

          <p className="text-xs text-ash">
            You can always find these in your dashboard sidebar.
          </p>
        </div>
      )}
    </div>
  );
}
