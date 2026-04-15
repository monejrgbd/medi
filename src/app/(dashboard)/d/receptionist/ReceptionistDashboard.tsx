"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  useReceptionistRealtime,
  type ReceptionistNotification,
} from "@/hooks/useReceptionistRealtime";
import { unlockAudio } from "@/lib/notificationSound";
import { useRole } from "@/contexts/RoleContext";
import {
  fetchNotificationPreference,
  toggleNotificationSound,
} from "@/app/(dashboard)/d/_actions/preferences";
import ReceptionistHeader from "@/components/receptionist/ReceptionistHeader";
import ApprovalQueue from "@/components/receptionist/ApprovalQueue";
import ActivePatientsList from "@/components/receptionist/ActivePatientsList";
import ReferralInbox from "@/components/receptionist/ReferralInbox";
import NotificationPermission from "@/components/dashboard/NotificationPermission";
import RoleSwitchBar from "@/components/dashboard/RoleSwitchBar";
import NotificationBanner from "@/components/dashboard/NotificationBanner";
import StaleSessionAlert from "@/components/dashboard/StaleSessionAlert";
import NoDoctorsWarning from "@/components/dashboard/NoDoctorsWarning";
import PatientSearch from "@/components/dashboard/PatientSearch";
import ShareCheckinLink from "@/components/receptionist/ShareCheckinLink";
import { toast } from "sonner";

interface PendingVisit {
  visit_id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  birthday: string;
  created_at: string;
  has_previous_visits: boolean;
  match_type: string;
  phone_verified?: boolean;
  phone_masked?: string | null;
  phone_verification_pending?: boolean;
  active_follow_ups: {
    id: string;
    doctor_name: string;
    due_at: string;
    ai_instructions_preview: string | null;
    visit_id: string;
    visit_date: string;
    visit_summary_preview: string | null;
  }[];
  referral_match?: {
    referral_id: string;
    specialty: string;
    from_org_name: string;
    from_doctor_name: string;
  } | null;
}

interface ActiveVisit {
  id: string;
  status: string;
  priority: number;
  gave_tablet: boolean;
  handled: boolean;
  has_previous_visits: boolean;
  created_at: string;
  claimed_by: string | null;
  nurse_reviewed: boolean;
  claimed_is_nurse: boolean;
  staff_room?: string | null;
  patients: {
    first_name: string;
    last_name: string;
    birthday: string;
  };
  claimed_doctor?: {
    full_name: string;
  } | null;
}

interface CompletedVisit {
  id: string;
  status: string;
  gave_tablet: boolean;
  has_previous_visits: boolean;
  created_at: string;
  completed_at: string;
  patients: {
    first_name: string;
    last_name: string;
    birthday: string;
  };
}

interface Counts {
  awaiting: number;
  with_ai: number;
  in_queue: number;
  with_doctor: number;
  tablets_out: number;
  doctors_checked_in: number;
  nurses_checked_in: number;
}

interface Location {
  id: string;
  name: string;
}

interface ReceptionistDashboardProps {
  mode: "select_location" | "dashboard";
  locations: Location[];
  staffUserId: string | null;
  isOwner?: boolean;
  orgId: string;
  locationId: string | null;
  suggestedLocationId?: string | null;
  locationName?: string;
  initialPending: PendingVisit[];
  initialActive: ActiveVisit[];
  initialCompleted: CompletedVisit[];
  initialCounts: Counts | null;
  demoMode?: boolean;
  demoVisitId?: string | null;
  aiAutoSkipped?: boolean;
}

const DEFAULT_COUNTS: Counts = {
  awaiting: 0,
  with_ai: 0,
  in_queue: 0,
  with_doctor: 0,
  tablets_out: 0,
  doctors_checked_in: 0,
  nurses_checked_in: 0,
};

export default function ReceptionistDashboard({
  mode,
  locations,
  staffUserId,
  isOwner = false,
  orgId,
  locationId,
  suggestedLocationId,
  locationName = "Reception",
  initialPending,
  initialActive,
  initialCompleted,
  initialCounts,
  demoMode = false,
  demoVisitId,
  aiAutoSkipped = false,
}: ReceptionistDashboardProps) {
  const router = useRouter();
  const { org } = useRole();
  const [tab, setTab] = useState<"pending" | "active" | "referrals">("pending");
  const [showShareLink, setShowShareLink] = useState(false);
  const [pending, setPending] = useState<PendingVisit[]>(
    demoMode ? (demoVisitId ? initialPending.filter((p) => p.visit_id === demoVisitId) : []) : initialPending
  );
  const [active, setActive] = useState<ActiveVisit[]>(
    demoMode ? (demoVisitId ? initialActive.filter((a) => a.id === demoVisitId) : []) : initialActive
  );
  const [completed, setCompleted] = useState<CompletedVisit[]>(
    demoMode ? (demoVisitId ? initialCompleted.filter((c) => c.id === demoVisitId) : []) : initialCompleted
  );
  const [counts, setCounts] = useState<Counts>(initialCounts ?? DEFAULT_COUNTS);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    suggestedLocationId ?? (locations.length === 1 ? locations[0].id : null)
  );
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkinError, setCheckinError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [urgentPatient, setUrgentPatient] = useState<string | null>(null);

  // Sync state with server props after router.refresh()
  useEffect(() => {
    if (demoMode && demoVisitId) {
      const demoPending = initialPending.filter((p) => p.visit_id === demoVisitId);
      const demoActive = initialActive.filter((a) => a.id === demoVisitId);
      const demoCompleted = initialCompleted.filter((c) => c.id === demoVisitId);
      setPending(demoPending);
      setActive(demoActive);
      setCompleted(demoCompleted);
      // Derive counts from the single demo visit's status
      const visit = demoActive[0];
      const status = visit?.status;
      setCounts({
        awaiting: demoPending.length,
        with_ai: status === "still_answering_ai" ? 1 : 0,
        in_queue: status === "waiting_doctor_claim" ? 1 : 0,
        with_doctor: status === "claimed_by_doctor" ? 1 : 0,
        tablets_out: 0,
        doctors_checked_in: 1,
        nurses_checked_in: 0,
      });
    } else if (!demoMode) {
      setPending(initialPending);
      setActive(initialActive);
      setCompleted(initialCompleted);
      setCounts(initialCounts ?? DEFAULT_COUNTS);
    }
  }, [initialPending, initialActive, initialCompleted, initialCounts, demoMode, demoVisitId]);

  // In demo mode, always derive counts from local state (not server counts)
  useEffect(() => {
    if (!demoMode) return;
    const visit = active[0];
    const status = visit?.status;
    setCounts({
      awaiting: pending.length,
      with_ai: status === "still_answering_ai" ? 1 : 0,
      in_queue: status === "waiting_doctor_claim" ? 1 : 0,
      with_doctor: status === "claimed_by_doctor" ? 1 : 0,
      tablets_out: 0,
      doctors_checked_in: 1,
      nurses_checked_in: 0,
    });
  }, [demoMode, pending, active]);

  // Ensure fresh data when demo visit is created
  useEffect(() => {
    if (demoMode && demoVisitId) {
      router.refresh();
    }
  }, [demoMode, demoVisitId, router]);

  // Load notification preference + unlock audio
  useEffect(() => {
    unlockAudio();
    fetchNotificationPreference().then((res) => {
      if (res.success) setSoundEnabled(res.notification_sound);
    });
  }, []);

  async function handleToggleSound() {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    await toggleNotificationSound(newVal);
  }

  const handleNotification = useCallback(
    (notification: ReceptionistNotification) => {
      if (notification.type === "urgent" && notification.patientName) {
        setUrgentPatient(notification.patientName);
      }
    },
    []
  );

  // Realtime: update lists + counts on visit changes
  const handleVisitChange = useCallback(
    (payload: {
      eventType: "INSERT" | "UPDATE";
      new: Record<string, unknown>;
      old: Record<string, unknown>;
    }) => {
      const visit = payload.new;
      const oldVisit = payload.old;

      if (payload.eventType === "INSERT") {
        if (visit.status === "pending_approval") {
          // Refresh pending list from server
          router.refresh();
        }
        return;
      }

      // UPDATE — check for phone verification completion (same status, but pending flag changed)
      if (
        visit.status === "pending_approval" &&
        oldVisit.phone_verification_pending === true &&
        visit.phone_verification_pending === false
      ) {
        router.refresh();
      }

      // UPDATE — check for merge into an existing patient (patient_id rewritten,
      // or has_previous_visits recomputed). Both come from merge_visit_to_patient
      // and require re-fetching the pending list so the card shows the target
      // patient's info and the NEW/RETURNING badge flips.
      if (
        visit.status === "pending_approval" &&
        (oldVisit.patient_id !== visit.patient_id ||
          oldVisit.has_previous_visits !== visit.has_previous_visits)
      ) {
        router.refresh();
      }

      // UPDATE — diff old vs new status to update counts
      const oldStatus = oldVisit.status as string;
      const newStatus = visit.status as string;

      if (oldStatus && newStatus && oldStatus !== newStatus) {
        setCounts((prev) => {
          const next = { ...prev };
          // Decrement old
          if (oldStatus === "pending_approval") next.awaiting = Math.max(0, next.awaiting - 1);
          if (oldStatus === "still_answering_ai") next.with_ai = Math.max(0, next.with_ai - 1);
          if (oldStatus === "waiting_doctor_claim") next.in_queue = Math.max(0, next.in_queue - 1);
          if (oldStatus === "claimed_by_doctor") next.with_doctor = Math.max(0, next.with_doctor - 1);
          // Increment new
          if (newStatus === "pending_approval") next.awaiting++;
          if (newStatus === "still_answering_ai") next.with_ai++;
          if (newStatus === "waiting_doctor_claim") next.in_queue++;
          if (newStatus === "claimed_by_doctor") next.with_doctor++;
          // Handle tablets
          if (newStatus === "completed" || newStatus === "left") {
            if (visit.gave_tablet) next.tablets_out = Math.max(0, next.tablets_out - 1);
          }
          return next;
        });

        // Remove from pending if approved/denied
        if (oldStatus === "pending_approval") {
          setPending((prev) =>
            prev.filter((p) => p.visit_id !== (visit.id as string))
          );
        }

        // Remove from active if completed/left
        if (newStatus === "completed" || newStatus === "left") {
          setActive((prev) => prev.filter((a) => a.id !== (visit.id as string)));
        }

        // Refresh to pick up any data we can't derive from the event
        router.refresh();
      }

      // Handle tablet toggle
      if (
        oldVisit.gave_tablet !== undefined &&
        visit.gave_tablet !== oldVisit.gave_tablet
      ) {
        const wasGiven = visit.gave_tablet as boolean;
        setCounts((prev) => ({
          ...prev,
          tablets_out: wasGiven ? prev.tablets_out + 1 : Math.max(0, prev.tablets_out - 1),
        }));
        setActive((prev) =>
          prev.map((a) =>
            a.id === (visit.id as string)
              ? { ...a, gave_tablet: wasGiven }
              : a
          )
        );
      }

      // Handle handled toggle
      if (visit.handled === true && oldVisit.handled === false) {
        setActive((prev) => prev.filter((a) => a.id !== (visit.id as string)));
      }
    },
    [router]
  );

  useReceptionistRealtime(locationId, handleVisitChange, {
    soundEnabled,
    onNotification: handleNotification,
  });

  // Handle check-in to location
  async function handleCheckIn(locId: string) {
    if (!staffUserId) return;
    setCheckingIn(true);
    setCheckinError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("staff_check_in", {
        p_location_id: locId,
        p_role: "receptionist",
      });

      if (error || (data && !(data as { success?: boolean }).success)) {
        setCheckinError((data as { error?: string })?.error ?? error?.message ?? "Check-in failed. Try again.");
        setCheckingIn(false);
        return;
      }

      router.refresh();
    } catch {
      setCheckinError("Check-in failed. Try again.");
      setCheckingIn(false);
    }
  }

  async function handleCheckOut() {
    const supabase = createClient();
    const { error } = await supabase.rpc("staff_check_out");
    if (error) {
      alert("Failed to check out. Please try again.");
      return;
    }
    router.push("/d/select-role");
  }

  // Location picker mode
  if (mode === "select_location") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-ink mb-2 text-center">
            Receptionist Check-In
          </h1>
          <p className="text-sm text-slate mb-6 text-center">
            Select a location to begin your shift.
          </p>

          {locations.length === 0 ? (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-6 text-center">
              <p className="text-sm text-amber-800 mb-3">
                No locations have been set up yet.
              </p>
              <button
                onClick={() => router.push("/d/owner")}
                className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-semibold text-white hover:bg-hilt-blue-dark"
              >
                Go to Locations
              </button>
            </div>
          ) : (
          <>
          <div className="space-y-3">
            {locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => setSelectedLocationId(loc.id)}
                disabled={checkingIn}
                className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                  selectedLocationId === loc.id
                    ? "border-hilt-blue bg-blue-50"
                    : "border-gray-200 bg-white hover:border-hilt-blue"
                } disabled:opacity-50`}
              >
                <h3 className="font-semibold text-ink">{loc.name}</h3>
              </button>
            ))}
          </div>

          {selectedLocationId && (
            <>
              {staffUserId && (
                <button
                  onClick={() => handleCheckIn(selectedLocationId)}
                  disabled={checkingIn}
                  className="mt-4 w-full rounded-lg bg-hilt-blue px-4 py-3 text-sm font-semibold text-white hover:bg-hilt-blue-dark disabled:opacity-50 transition-colors"
                >
                  {checkingIn ? "Checking in..." : "Begin Shift"}
                </button>
              )}
              {isOwner && (
                <button
                  onClick={() => router.push(`?location=${selectedLocationId}&skip=1`)}
                  disabled={checkingIn}
                  className={`${staffUserId ? "mt-2" : "mt-4"} w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-slate hover:bg-gray-50 disabled:opacity-50 transition-colors`}
                >
                  Skip
                </button>
              )}
            </>
          )}
          </>
          )}

          {checkinError && (
            <p className="text-sm text-red-600 text-center mt-4">{checkinError}</p>
          )}

          {!staffUserId && !isOwner && (
            <p className="text-sm text-ash text-center mt-4">
              You need a staff account to check in. Create one from the Owner Dashboard.
            </p>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/d/select-role")}
              className="text-sm text-slate hover:text-ink transition-colors"
            >
              Back to role selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard mode
  function handleApprovalComplete(visitId: string, action: "approve" | "deny") {
    setPending((prev) => prev.filter((p) => p.visit_id !== visitId));
    if (action === "approve") {
      setCounts((prev) => ({
        ...prev,
        awaiting: Math.max(0, prev.awaiting - 1),
        with_ai: prev.with_ai + 1,
      }));
    } else {
      setCounts((prev) => ({
        ...prev,
        awaiting: Math.max(0, prev.awaiting - 1),
      }));
    }
  }

  function handleVisitUpdate(
    visitId: string,
    update: Partial<ActiveVisit>
  ) {
    setActive((prev) =>
      prev.map((v) => (v.id === visitId ? { ...v, ...update } : v))
    );
  }

  function handleVisitRemove(visitId: string) {
    setActive((prev) => prev.filter((v) => v.id !== visitId));
  }

  const tabs = [
    { key: "pending" as const, label: `Pending (${counts.awaiting})` },
    { key: "active" as const, label: "Active" },
    { key: "referrals" as const, label: "Referrals" },
  ];

  return (
    <div>
      <RoleSwitchBar currentRole="receptionist" />
      <ReceptionistHeader
        counts={counts}
        locationName={locationName}
        onCheckOut={handleCheckOut}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        demoMode={demoMode}
      />

      <div className="px-4 py-4 lg:px-6">
        {!demoMode && <NotificationPermission />}

        {locationId && !demoMode && <StaleSessionAlert locationId={locationId} />}

        {locationId && (
          <NoDoctorsWarning
            locationId={locationId}
            patientsWaiting={counts.in_queue}
          />
        )}

        {urgentPatient && (
          <NotificationBanner
            patientName={urgentPatient}
            onDismiss={() => setUrgentPatient(null)}
          />
        )}

        {/* Patient search */}
        <div className="mb-4">
          <PatientSearch />
        </div>

        {/* Share check-in link */}
        <button
          onClick={() => setShowShareLink(true)}
          className="mb-4 w-full rounded-lg border border-hilt-blue/20 bg-blue-50 px-4 py-3 text-left transition-colors hover:bg-blue-100 flex items-center gap-3"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hilt-blue/10">
            <svg className="h-4 w-4 text-hilt-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-hilt-blue">Share Custom Check in Link</p>
            <p className="text-xs text-slate">For a specific patient</p>
          </div>
        </button>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-gray-200">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.key
                  ? "border-hilt-blue text-hilt-blue"
                  : "border-transparent text-slate hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "pending" && (
          <ApprovalQueue
            pending={pending}
            orgId={orgId}
            subscriptionPlan={org?.subscription_plan}
            onActionComplete={handleApprovalComplete}
            aiAutoSkipped={aiAutoSkipped}
            demoMode={demoMode}
          />
        )}

        {tab === "active" && (
          <ActivePatientsList
            visits={active}
            completedVisits={completed}
            onVisitUpdate={handleVisitUpdate}
            onVisitRemove={handleVisitRemove}
          />
        )}

        {tab === "referrals" && locationId && (
          <ReferralInbox locationId={locationId} />
        )}
      </div>

      {showShareLink && locationId && (
        <ShareCheckinLink
          locationId={locationId}
          onClose={() => setShowShareLink(false)}
          demoMode={demoMode}
        />
      )}
    </div>
  );
}
