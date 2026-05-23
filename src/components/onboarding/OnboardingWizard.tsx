"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";
import { createLocation } from "@/app/(dashboard)/d/_actions/locations";
import {
  completeOnboarding,
  updateOrganizationProfile,
} from "@/app/(dashboard)/d/_actions/onboarding";
import { ALLOWED_SPECIALTIES } from "@/lib/constants";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { Check, Tablet, Star, CreditCard, ArrowRight, Users, ChevronLeft, ArrowLeftRight, Download, Plus, X } from "lucide-react";
import StepIndicator from "./StepIndicator";
import AddStaffStep from "./AddStaffStep";
import ClinicFeaturesStep from "./ClinicFeaturesStep";
import StaffCredentialCards, { type AddedStaff } from "./StaffCredentialCards";
import CountryCombobox from "@/components/CountryCombobox";
import { COUNTRIES } from "@/lib/countries";

interface OrgInfo {
  id: string;
  name: string;
  slug: string;
  credits_total: number;
  credits_used: number;
  trial_end_date: string;
  country?: string | null;
}

interface ExistingLocation {
  id: string;
  name: string;
}

// Bump when the wizard step numbering or saved shape changes. Saved state without
// this version (or with an older one) gets put through STEP_MIGRATION on restore.
const SCHEMA_VERSION = 2;

const STEP_MIGRATION: Record<number, number> = {
  0: 0, 1: 1,
  2: 2,        // old Raven -> new Configure
  3: 2,        // old Configure -> new Configure
  4: 3,        // old Staff -> new Staff
  5: 4, 6: 4, 7: 4,  // old Transfer / Try It / Done -> new Done
};

export default function OnboardingWizard({
  org,
  existingLocations,
  detectedCountry = "",
}: {
  org: OrgInfo;
  existingLocations: ExistingLocation[];
  detectedCountry?: string;
}) {
  const router = useRouter();
  const storageKey = `hilt_onboarding_${org.id}`;
  const [hydrated, setHydrated] = useState(false);

  const [step, setStep] = useState(existingLocations.length > 0 ? 4 : 0);

  // Step 2 state (Configure Clinic)
  const [nurseEnabled, setNurseEnabled] = useState(false);

  // Step 0 state (Profile)
  const [profileFullName, setProfileFullName] = useState("");
  const [profileOrgName, setProfileOrgName] = useState(org.name === "My Clinic" ? "" : org.name);
  const [profileCountry, setProfileCountry] = useState(org.country ?? detectedCountry ?? "");
  const [premiumCode, setPremiumCode] = useState("");
  // Tracks the last code we already warned the user about. If they click Continue
  // again with the same invalid code in the field, we skip applying it instead of
  // blocking them, so a typo or expired link does not stall onboarding.
  const [warnedCode, setWarnedCode] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Step 1 state
  const [locationName, setLocationName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [presetRooms, setPresetRooms] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Created or existing location
  const [locationId, setLocationId] = useState(
    existingLocations[0]?.id ?? ""
  );
  const [createdLocationName, setCreatedLocationName] = useState(
    existingLocations[0]?.name ?? ""
  );

  // Step 3 (Staff) — lifted state so Done can render the credential cards
  const [addedStaff, setAddedStaff] = useState<AddedStaff[]>([]);

  // Step 4 (Done) — checkin mode is fetched from the location so we can tailor the
  // QR hint. Only "approve_to_start" requires a receptionist to be logged in for
  // QR scans to land, the other modes accept scans anytime.
  const [doneCheckinMode, setDoneCheckinMode] = useState<string>("approve_to_start");

  // Step 4 (Done) — staff list fetched from DB as a fallback for refreshed sessions
  // where addedStaff is empty in memory. Passwords are not in the DB so this view
  // is read only (name + login + roles), with a hint to reset from dashboard.
  const [dbStaffList, setDbStaffList] = useState<{ id: string; full_name: string; username: string; roles: { role: string; location_id: string }[] }[]>([]);
  const [staffListLoading, setStaffListLoading] = useState(false);

  // Done screen QR canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Restore wizard state from localStorage on mount. Old format (no version) is
  // run through STEP_MIGRATION. New format (version === SCHEMA_VERSION) is trusted as is.
  // addedStaff is intentionally NOT persisted (plaintext passwords on disk is unsafe).
  // After a refresh the Done screen falls back to the DB staff list (no passwords).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const s = JSON.parse(saved);
        const locationValid = s.locationId && existingLocations.some((l) => l.id === s.locationId);
        if (locationValid) {
          if (typeof s.step === "number") {
            const migrated = s.version === SCHEMA_VERSION ? s.step : (STEP_MIGRATION[s.step] ?? 0);
            const clamped = Math.max(0, Math.min(4, migrated));
            setStep(clamped);
          }
          setLocationId(s.locationId);
          if (s.locationName) setCreatedLocationName(s.locationName);
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
        JSON.stringify({ version: SCHEMA_VERSION, step, locationId, locationName: createdLocationName })
      );
    } catch {}
  }, [hydrated, step, locationId, createdLocationName, storageKey]);

  // QR rendering on Done screen. `hydrated` is in deps so the effect re-fires
  // when the early-return spinner flips off and the canvas finally mounts.
  // Without that, a returning user lands on step 4 with the canvas absent
  // during the first effect run, and nothing ever draws to it.
  useEffect(() => {
    if (!hydrated) return;
    if (step !== 4 || !locationId || !canvasRef.current) return;
    QRCode.toCanvas(
      canvasRef.current,
      `${process.env.NEXT_PUBLIC_APP_URL || "https://hilthealth.com"}/checkin/${locationId}`,
      { width: 220, margin: 2, color: { dark: "#111827", light: "#ffffff" } }
    ).catch((err) => {
      console.error("QR render failed", err);
    });
  }, [hydrated, step, locationId]);

  // Clear the Step 0 error message whenever we leave Step 0, so it does not
  // persist if the user navigates back via Step 1's Back button.
  useEffect(() => {
    if (step !== 0) setProfileError("");
  }, [step]);

  // Load the location's checkin_mode when entering Done so the QR hint reflects
  // the actual setting (a returning user may not have run through Configure).
  useEffect(() => {
    if (step !== 4 || !locationId) return;
    const supabase = createClient();
    supabase.rpc("get_location_detail", { p_location_id: locationId }).then(({ data }) => {
      const mode = data?.location?.checkin_mode;
      if (mode) setDoneCheckinMode(mode);
    });
  }, [step, locationId]);

  // Fetch the staff list from the DB when entering Done. Used as the source of
  // truth if addedStaff is empty (refresh wipes the in memory credentials).
  useEffect(() => {
    if (step !== 4 || !locationId) return;
    setStaffListLoading(true);
    const supabase = createClient();
    supabase
      .rpc("get_staff_list", { p_org_id: org.id, p_location_id: locationId })
      .then(({ data }) => {
        if (data && Array.isArray(data)) {
          setDbStaffList(data as typeof dbStaffList);
        }
        setStaffListLoading(false);
      });
  }, [step, locationId, org.id]);

  const handleCreateLocation = useCallback(async () => {
    if (!locationName.trim()) {
      setCreateError("Location name is required");
      return;
    }
    setCreating(true);
    setCreateError("");
    // Trim, drop empties, drop overlong names, dedupe (case insensitive).
    const seen = new Set<string>();
    const allRooms = presetRooms
      .map((r) => r.trim())
      .filter((r) => {
        if (!r || r.length > 60) return false;
        const key = r.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    const result = await createLocation({
      orgId: org.id,
      name: locationName.trim(),
      specialty: specialty || undefined,
      presetRooms: allRooms,
    });
    setCreating(false);
    if (result.success && result.locationId) {
      setLocationId(result.locationId);
      setCreatedLocationName(locationName.trim());
      setStep(2);
    } else {
      setCreateError(result.error || "Failed to create location");
    }
  }, [locationName, specialty, presetRooms, org.id]);

  const clearWizardState = useCallback(() => {
    try { localStorage.removeItem(storageKey); } catch {}
  }, [storageKey]);

  const handleFinish = useCallback(async () => {
    clearWizardState();
    await completeOnboarding();
    router.push("/d/owner");
  }, [router, clearWizardState]);

  const handleDownloadQR = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${createdLocationName || "location"}-checkin-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [createdLocationName]);

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
      <StepIndicator currentStep={step} onStepClick={(s) => setStep(s)} />

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
              <label className="mb-1 block text-sm font-medium text-ink">Country</label>
              <CountryCombobox
                name="country"
                id="onboarding-country"
                options={COUNTRIES}
                required
                defaultValue={profileCountry}
                onValueChange={setProfileCountry}
                placeholder="Start typing your country..."
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
              if (!profileFullName.trim() || !profileOrgName.trim() || !profileCountry.trim()) {
                setProfileError("Name, organization, and country are required");
                return;
              }
              setProfileSaving(true);
              setProfileError("");
              const result = await updateOrganizationProfile(profileOrgName.trim(), profileFullName.trim(), profileCountry.trim());
              if (!result.success) {
                setProfileSaving(false);
                setProfileError(result.error || "Something went wrong");
                return;
              }

              // Apply premium code if provided. If the user already saw a warning
              // for this exact code, skip it and let them through (onboarding
              // proceeds with no code applied).
              const trimmedPremium = premiumCode.trim();
              if (trimmedPremium && warnedCode !== trimmedPremium) {
                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();
                const { data: codeResult, error: rpcError } = await supabase.rpc("apply_premium_code", {
                  p_code: trimmedPremium,
                });
                if (rpcError) {
                  setProfileSaving(false);
                  setWarnedCode(trimmedPremium);
                  setProfileError("Network error while checking your code. Click Continue again to proceed without it, or try again.");
                  return;
                }
                if (codeResult && !codeResult.success) {
                  setProfileSaving(false);
                  setWarnedCode(trimmedPremium);
                  const reason = codeResult.error || "That code is not valid";
                  setProfileError(`${reason}. Click Continue again to proceed without it, or edit the code and try again.`);
                  return;
                }
              }

              setProfileSaving(false);
              setStep(1);
            }}
            disabled={profileSaving || !profileFullName.trim() || !profileOrgName.trim() || !profileCountry.trim()}
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

                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    Exam rooms{" "}
                    <span className="font-normal text-ash">(optional)</span>
                  </label>

                  {presetRooms.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {presetRooms.map((room, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={room}
                            onChange={(e) =>
                              setPresetRooms((prev) =>
                                prev.map((r, idx) => (idx === i ? e.target.value : r))
                              )
                            }
                            maxLength={60}
                            placeholder={`Room ${i + 1}`}
                            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setPresetRooms((prev) => prev.filter((_, idx) => idx !== i))
                            }
                            className="rounded-md p-1.5 text-slate hover:bg-red-50 hover:text-red-600 transition-colors"
                            aria-label={`Remove room ${i + 1}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setPresetRooms((prev) => [...prev, ""])}
                    className="inline-flex items-center gap-1 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-sm font-medium text-slate hover:border-hilt-blue hover:text-hilt-blue transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add room
                  </button>

                  <p className="mt-2 text-xs text-ash">
                    Doctors and nurses pick from this list when they check in. Leave blank to let them type their own room each shift.
                  </p>
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

      {/* Step 2: Configure Clinic */}
      {step === 2 && locationId && (
        <ClinicFeaturesStep
          locationId={locationId}
          hasRaven={false}
          onBack={() => setStep(1)}
          onComplete={(features) => {
            setNurseEnabled(features.nurse);
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
          addedStaff={addedStaff}
          onStaffAdded={(s) => setAddedStaff((prev) => [...prev, s])}
          onContinue={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}

      {/* Step 4: Done */}
      {step === 4 && (
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-6">
            <div className="mb-3 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-ink mb-2">
              You Are All Set!
            </h2>
          </div>

          {/* Staff section: prefer in memory addedStaff (with passwords),
              fall back to DB list (no passwords) for refreshed sessions. */}
          {addedStaff.length > 0 ? (
            <div className="mb-6">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 mb-3">
                <p className="text-sm font-semibold text-ink">Your staff can log in now</p>
                <p className="text-xs text-slate mt-0.5">
                  Each person below can sign in with their email and password. Copy the credentials or email them now, they will not be shown again after you leave this screen.
                </p>
              </div>
              <StaffCredentialCards addedStaff={addedStaff} orgSlug={org.slug} heading="Staff you created" />
            </div>
          ) : staffListLoading ? (
            <div className="mb-6 flex items-center justify-center gap-2 rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-hilt-blue" />
              <span className="text-xs text-slate">Loading staff...</span>
            </div>
          ) : (() => {
            const staffAtLocation = dbStaffList.filter((s) =>
              s.roles.some((r) => r.location_id === locationId)
            );
            if (staffAtLocation.length === 0) {
              return (
                <div className="mb-6 rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="text-sm font-semibold text-ink">No staff added yet</p>
                  <p className="text-xs text-slate mt-0.5">
                    You can add doctors, nurses, and receptionists anytime from the Staff page in your dashboard.
                  </p>
                </div>
              );
            }
            return (
              <div className="mb-6">
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 mb-3">
                  <p className="text-sm font-semibold text-ink">Staff can now log in</p>
                  <p className="text-xs text-slate mt-0.5">
                    Passwords were shown once during setup. If you no longer have them, reset each person from the Staff page in your dashboard.
                  </p>
                </div>
                <div className="space-y-2">
                  {staffAtLocation.map((staff) => (
                    <div
                      key={staff.id}
                      className="rounded-xl border border-gray-200 bg-white p-3 flex items-center gap-3"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <Check className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink truncate">{staff.full_name}</p>
                        <p className="text-xs text-slate font-mono">{staff.username}@{org.slug}.staff.hilt</p>
                      </div>
                      <div className="flex flex-wrap gap-1 shrink-0">
                        {staff.roles
                          .filter((r) => r.location_id === locationId)
                          .map((r) => (
                            <span
                              key={r.role}
                              className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-slate ring-1 ring-gray-200 capitalize"
                            >
                              {r.role}
                            </span>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Location QR code */}
          {locationId && (
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="text-base font-semibold text-ink mb-1">
                Your check in QR code
              </h3>
              <p className="text-sm text-slate mb-4">
                Print this and place it at your front desk.
                {doneCheckinMode === "approve_to_start" && " A receptionist must be checked in for QR check ins to work."}
                {doneCheckinMode === "approve_on_arrival" && " Patients can scan and chat anytime, a receptionist approves them into the queue when they arrive."}
                {doneCheckinMode === "self_service_on_arrival" && " Patients can scan and join the queue on their own, no receptionist action needed."}
              </p>
              <div className="flex justify-center mb-3">
                <canvas ref={canvasRef} className="rounded-lg" />
              </div>
              <p className="text-xs text-slate text-center mb-4 break-all">{checkinUrl}</p>
              <button
                onClick={handleDownloadQR}
                className="w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-hilt-blue-dark flex items-center justify-center gap-2 mb-2"
              >
                <Download className="h-4 w-4" />
                Download QR code
              </button>
              <p className="text-center text-xs text-slate py-1.5">
                Need a branded QR with logo or a printable PDF?{" "}
                <a href="/d/owner/kiosk" className="text-hilt-blue hover:text-hilt-blue-dark underline">
                  Open QR Manager
                </a>
              </p>
            </div>
          )}

          {/* Data Transfer block */}
          <div className="mb-6">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1">
                <ArrowLeftRight className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">Free with every plan</span>
              </div>
              <h3 className="text-base font-semibold text-ink mb-1">Switching from another system?</h3>
              <p className="text-sm text-slate mb-4">
                Our team will transfer all your data from your current system, at no extra cost.
              </p>
              <ul className="space-y-2 mb-4">
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
              <a
                href="https://cal.com/102937474/hilt-health-meeting"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 text-center transition-colors"
              >
                Book a Meeting
              </a>
            </div>
          </div>

          {/* Go to Dashboard */}
          <button
            onClick={handleFinish}
            className="w-full rounded-lg bg-hilt-blue px-6 py-3 text-sm font-semibold text-white hover:bg-hilt-blue-dark flex items-center justify-center gap-2 mb-8"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="text-xs text-ash mb-4 text-center">
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

          <p className="text-xs text-ash text-center">
            You can always find these in your dashboard sidebar.
          </p>
        </div>
      )}
    </div>
  );
}
