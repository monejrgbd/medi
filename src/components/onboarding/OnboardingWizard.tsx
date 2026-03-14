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
import StepIndicator from "./StepIndicator";

interface OrgInfo {
  id: string;
  name: string;
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
  const [step, setStep] = useState(existingLocations.length > 0 ? 2 : 0);

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

  // Step 2 (Try It) state
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
    if (step !== 2 || !locationId || demoReady) return;

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
    if (step === 2 && locationId && demoReady && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        `${window.location.origin}/checkin/${locationId}`,
        { width: 200, margin: 2, color: { dark: "#111827", light: "#ffffff" } }
      );
    }
  }, [step, locationId, demoReady, tryPhase]);

  // Realtime subscription — starts immediately when step 2 is ready
  useEffect(() => {
    if (step !== 2 || !locationId || !demoReady || tryPhase !== "ready") return;

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
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/checkin/${locationId}`
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

          <div className="max-w-md mx-auto text-left space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 text-sm font-semibold">1</span>
              <div>
                <p className="text-sm font-medium text-ink">
                  Save 5&ndash;10 minutes per patient on intake
                </p>
                <p className="text-xs text-slate mt-0.5">
                  AI handles symptom collection so doctors don&apos;t start from zero
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 text-sm font-semibold">2</span>
              <div>
                <p className="text-sm font-medium text-ink">
                  Doctors read a structured summary before walking in
                </p>
                <p className="text-xs text-slate mt-0.5">
                  No more &quot;so what brings you in today?&quot; from scratch
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 text-sm font-semibold">3</span>
              <div>
                <p className="text-sm font-medium text-ink">
                  Zero hardware needed to start
                </p>
                <p className="text-xs text-slate mt-0.5">
                  Patients check in on their own phone; add a waiting room tablet later if you want
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(1)}
            className="rounded-lg bg-hilt-blue px-6 py-3 text-sm font-semibold text-white hover:bg-hilt-blue-dark"
          >
            Set Up Your First Location &rarr;
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
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none"
              >
                <option value="">Select a specialty</option>
                {ALLOWED_SPECIALTIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
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
              I&apos;ll do this later
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Try the Check-in */}
      {step === 2 && (
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-xl font-bold text-ink mb-1">
            Try the Check-in
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
                Open Check-in Page
              </a>
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hilt-blue opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-hilt-blue" />
                </span>
                <span className="text-sm text-slate">
                  Waiting for a check-in...
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
                New check-in detected!
              </p>
              <p className="text-lg font-semibold text-ink mb-4">
                {detectedVisit.patientName}
              </p>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {approving ? "Approving..." : "Approve Check-in"}
              </button>
            </div>
          )}

          {demoReady && tryPhase === "success" && (
            <div className="rounded-xl border-2 border-green-200 bg-green-50 p-6 mb-4">
              <div className="text-3xl mb-2">&#10003;</div>
              <p className="text-sm font-medium text-green-800 mb-1">
                Your test patient is now talking with the AI!
              </p>
              <p className="text-xs text-green-700">
                They&apos;ll answer symptom questions, and the doctor will get a structured summary.
              </p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            {demoReady && (
              <button
                onClick={() => setStep(3)}
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

      {/* Step 3: All Set */}
      {step === 3 && (
        <div className="max-w-lg mx-auto text-center">
          <div className="text-4xl mb-3">&#10003;</div>
          <h2 className="text-2xl font-bold text-ink mb-2">
            You&apos;re All Set!
          </h2>
          <p className="text-sm text-slate mb-8">
            Here&apos;s what to explore next:
          </p>

          <div className="grid gap-3 sm:grid-cols-2 mb-8">
            <button
              onClick={() => router.push("/d/owner/staff")}
              className="rounded-xl border-2 border-gray-200 bg-white p-4 text-left hover:border-hilt-blue transition-colors"
            >
              <div className="text-lg mb-1">&#128101;</div>
              <h3 className="text-sm font-semibold text-ink">Add your staff</h3>
              <p className="text-xs text-slate mt-1">
                Create accounts for doctors and receptionists
              </p>
            </button>
            <button
              onClick={() => router.push("/d/owner/kiosk")}
              className="rounded-xl border-2 border-gray-200 bg-white p-4 text-left hover:border-hilt-blue transition-colors"
            >
              <div className="text-lg mb-1">&#128241;</div>
              <h3 className="text-sm font-semibold text-ink">
                Set up a check-in tablet
              </h3>
              <p className="text-xs text-slate mt-1">
                Use an iPad or tablet in your waiting room
              </p>
            </button>
            <button
              onClick={() => router.push("/d/reviews")}
              className="rounded-xl border-2 border-gray-200 bg-white p-4 text-left hover:border-hilt-blue transition-colors"
            >
              <div className="text-lg mb-1">&#11088;</div>
              <h3 className="text-sm font-semibold text-ink">
                Configure review collection
              </h3>
              <p className="text-xs text-slate mt-1">
                Automatically ask patients for reviews
              </p>
            </button>
            <button
              onClick={() => router.push("/d/owner/billing")}
              className="rounded-xl border-2 border-gray-200 bg-white p-4 text-left hover:border-hilt-blue transition-colors"
            >
              <div className="text-lg mb-1">&#128179;</div>
              <h3 className="text-sm font-semibold text-ink">
                Check billing &amp; credits
              </h3>
              <p className="text-xs text-slate mt-1">
                View your plan, usage, and credit balance
              </p>
            </button>
          </div>

          <button
            onClick={handleFinish}
            className="rounded-lg bg-hilt-blue px-6 py-3 text-sm font-semibold text-white hover:bg-hilt-blue-dark"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
