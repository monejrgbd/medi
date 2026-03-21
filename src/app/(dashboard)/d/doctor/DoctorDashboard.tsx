"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  useDoctorRealtime,
  type DoctorNotification,
} from "@/hooks/useDoctorRealtime";
import { unlockAudio } from "@/lib/notificationSound";
import {
  fetchNotificationPreference,
  toggleNotificationSound,
} from "@/app/(dashboard)/d/_actions/preferences";
import DoctorHeader from "@/components/doctor/DoctorHeader";
import QueueList from "@/components/doctor/QueueList";
import ClaimedPatientCard from "@/components/doctor/ClaimedPatientCard";
import CompletedVisitCard from "@/components/doctor/CompletedVisitCard";
import CheckInOutButton from "@/components/doctor/CheckInOutButton";
import NotificationPermission from "@/components/dashboard/NotificationPermission";
import NotificationBanner from "@/components/dashboard/NotificationBanner";
import StaleSessionAlert from "@/components/dashboard/StaleSessionAlert";
import PatientSearch from "@/components/dashboard/PatientSearch";
import FocusMode from "@/components/doctor/FocusMode";

export interface QueueVisit {
  visit_id: string;
  first_name: string;
  last_name: string;
  sex?: string;
  priority: number;
  wait_seconds: number;
  is_sensitive: boolean;
  timeout_flagged: boolean;
  has_previous_visits: boolean;
  nurse_reviewed: boolean;
  created_at: string;
}

export interface ClaimedVisit {
  visit_id: string;
  first_name: string;
  last_name: string;
  sex?: string;
  claimed_at: string;
  priority: number;
  is_sensitive: boolean;
  has_previous_visits: boolean;
}

export interface CompletedVisit {
  visit_id: string;
  first_name: string;
  last_name: string;
  completed_at?: string;
  created_at?: string;
  diagnosis_preview?: string;
}

interface Doctor {
  staff_user_id: string;
  full_name: string;
}

interface Location {
  id: string;
  name: string;
}

interface DoctorDashboardProps {
  mode: "select_location" | "dashboard";
  locations: Location[];
  staffUserId: string | null;
  isOwner?: boolean;
  orgId: string;
  locationId: string | null;
  suggestedLocationId?: string | null;
  locationName?: string;
  initialQueue: QueueVisit[];
  initialClaimed: ClaimedVisit[];
  initialCompleted: CompletedVisit[];
  initialLeft: CompletedVisit[];
  initialDoctors: Doctor[];
  demoMode?: boolean;
  demoVisitId?: string | null;
  initialHasMoreCompleted?: boolean;
  initialHasMoreLeft?: boolean;
}

type Tab = "pending" | "claimed" | "completed" | "left";

export default function DoctorDashboard({
  mode,
  locations,
  staffUserId,
  isOwner = false,
  orgId,
  locationId,
  suggestedLocationId,
  locationName = "Clinic",
  initialQueue,
  initialClaimed,
  initialCompleted,
  initialLeft,
  initialDoctors,
  initialHasMoreCompleted = false,
  initialHasMoreLeft = false,
  demoMode = false,
  demoVisitId,
}: DoctorDashboardProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [queue, setQueue] = useState<QueueVisit[]>(
    demoMode ? (demoVisitId ? initialQueue.filter((q) => q.visit_id === demoVisitId) : []) : initialQueue
  );
  const [claimed, setClaimed] = useState<ClaimedVisit[]>(
    demoMode ? (demoVisitId ? initialClaimed.filter((c) => c.visit_id === demoVisitId) : []) : initialClaimed
  );
  const [completed, setCompleted] = useState<CompletedVisit[]>(
    demoMode ? (demoVisitId ? initialCompleted.filter((c) => c.visit_id === demoVisitId) : []) : initialCompleted
  );
  const [left, setLeft] = useState<CompletedVisit[]>(
    demoMode ? (demoVisitId ? initialLeft.filter((c) => c.visit_id === demoVisitId) : []) : initialLeft
  );
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    suggestedLocationId ?? (locations.length === 1 ? locations[0].id : null)
  );
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkinError, setCheckinError] = useState<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [urgentPatient, setUrgentPatient] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(demoMode);
  const [hasMoreCompleted, setHasMoreCompleted] = useState(initialHasMoreCompleted);
  const [hasMoreLeft, setHasMoreLeft] = useState(initialHasMoreLeft);
  const [loadingMore, setLoadingMore] = useState(false);

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

  const handleDoctorNotification = useCallback(
    (notification: DoctorNotification) => {
      if (notification.type === "urgent" && notification.patientName) {
        setUrgentPatient(notification.patientName);
      }
    },
    []
  );

  // Sync state when server component re-renders with new props (via router.refresh())
  useEffect(() => {
    if (demoMode && demoVisitId) {
      // Filter to only show the current demo session's visit
      setQueue(initialQueue.filter((q) => q.visit_id === demoVisitId));
      setClaimed(initialClaimed.filter((c) => c.visit_id === demoVisitId));
      setCompleted(initialCompleted.filter((c) => c.visit_id === demoVisitId));
      setLeft(initialLeft.filter((c) => c.visit_id === demoVisitId));
    } else if (!demoMode) {
      setQueue(initialQueue);
      setClaimed(initialClaimed);
      setCompleted(initialCompleted);
      setLeft(initialLeft);
    }
    setDoctors(initialDoctors);
    setHasMoreCompleted(initialHasMoreCompleted);
    setHasMoreLeft(initialHasMoreLeft);
  }, [initialQueue, initialClaimed, initialCompleted, initialLeft, initialDoctors, initialHasMoreCompleted, initialHasMoreLeft, demoMode, demoVisitId]);

  // Ensure fresh data when demo visit is created
  useEffect(() => {
    if (demoMode && demoVisitId) {
      router.refresh();
    }
  }, [demoMode, demoVisitId, router]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  const handleVisitChange = useCallback(
    () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        router.refresh();
      }, 500);
    },
    [router]
  );

  const loadMoreVisits = useCallback(async (type: "completed" | "left") => {
    if (!locationId || loadingMore) return;
    setLoadingMore(true);
    const supabase = createClient();
    const items = type === "completed" ? completed : left;
    const lastItem = items[items.length - 1];
    const cursorCompleted = type === "completed" && lastItem?.completed_at ? lastItem.completed_at : null;
    const cursorLeft = type === "left" && lastItem?.created_at ? lastItem.created_at : null;
    const { data } = await supabase.rpc("get_completed_and_left_visits", {
      p_location_id: locationId,
      p_cursor_completed: cursorCompleted,
      p_cursor_left: cursorLeft,
    });
    if (data?.success) {
      if (type === "completed") {
        setCompleted(prev => [...prev, ...(data.completed ?? [])]);
        setHasMoreCompleted(data.has_more_completed ?? false);
      } else {
        setLeft(prev => [...prev, ...(data.left ?? [])]);
        setHasMoreLeft(data.has_more_left ?? false);
      }
    }
    setLoadingMore(false);
  }, [locationId, completed, left, loadingMore]);

  useDoctorRealtime(
    mode === "dashboard" && !focusMode ? locationId : null,
    handleVisitChange,
    {
      soundEnabled,
      onNotification: handleDoctorNotification,
    }
  );

  // Location picker
  async function handleCheckIn(locId: string) {
    if (!staffUserId) return;
    setCheckingIn(true);
    setCheckinError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("staff_check_in", {
        p_location_id: locId,
        p_role: "doctor",
      });

      if (error || (data && !(data as { success?: boolean }).success)) {
        setCheckinError(
          (data as { error?: string })?.error ?? error?.message ?? "Check-in failed. Try again."
        );
        setCheckingIn(false);
        return;
      }

      router.refresh();
    } catch {
      setCheckinError("Check-in failed. Try again.");
      setCheckingIn(false);
    }
  }

  if (mode === "select_location") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-ink mb-2 text-center">
            Doctor Check-In
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
            <p className="text-sm text-red-600 text-center mt-4">
              {checkinError}
            </p>
          )}

          {!staffUserId && !isOwner && (
            <p className="text-sm text-ash text-center mt-4">
              You need a staff account to check in. Create one from the Owner
              Dashboard.
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

  // Focus mode
  if (focusMode && locationId && staffUserId) {
    return (
      <FocusMode
        locationId={locationId}
        locationName={locationName}
        initialClaimed={claimed}
        initialQueue={queue}
        soundEnabled={soundEnabled}
        onExit={() => setFocusMode(false)}
        demoVisitId={demoVisitId}
        demoMode={demoMode}
      />
    );
  }

  // Dashboard mode
  const tabs: { key: Tab; label: string }[] = [
    { key: "pending", label: `Pending (${queue.length})` },
    { key: "claimed", label: `Claimed (${claimed.length})` },
    { key: "completed", label: `Completed (${completed.length})` },
    { key: "left", label: `Left (${left.length})` },
  ];

  return (
    <div>
      <DoctorHeader
        locationName={locationName}
        queueCount={queue.length}
        claimedCount={claimed.length}
        completedCount={completed.length}
        doctorsIn={doctors.length}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        focusMode={focusMode}
        onToggleFocusMode={() => setFocusMode(true)}
      />

      <div className="px-4 py-4 lg:px-6">
        <NotificationPermission />

        {locationId && !demoMode && <StaleSessionAlert locationId={locationId} />}

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

        {/* Check-out */}
        {!demoMode && (
        <div className="mb-4 flex justify-end">
          <CheckInOutButton />
        </div>
        )}

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
          <QueueList queue={queue} onClaimed={() => router.refresh()} />
        )}

        {tab === "claimed" && (
          <div className="space-y-3">
            {claimed.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
                <svg className="mx-auto mb-3 h-10 w-10 text-ash" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                </svg>
                <p className="text-sm font-medium text-slate">No claimed patients</p>
                <p className="mt-1 text-xs text-ash">Claim a patient from the pending queue to get started.</p>
              </div>
            ) : (
              claimed.map((v) => (
                <ClaimedPatientCard
                  key={v.visit_id}
                  visit={v}
                  onClickOverride={demoMode ? () => setFocusMode(true) : undefined}
                />
              ))
            )}
          </div>
        )}

        {tab === "completed" && (
          <div className="space-y-3">
            {completed.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
                <svg className="mx-auto mb-3 h-10 w-10 text-ash" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <p className="text-sm font-medium text-slate">No completed visits today</p>
                <p className="mt-1 text-xs text-ash">Completed visits will appear here after you enter a diagnosis.</p>
              </div>
            ) : (
              completed.map((v) => (
                <CompletedVisitCard
                  key={v.visit_id}
                  visit={v}
                  type="completed"
                />
              ))
            )}
            {hasMoreCompleted && (
              <button
                onClick={() => loadMoreVisits("completed")}
                disabled={loadingMore}
                className="mt-3 w-full rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-slate hover:bg-gray-200 disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            )}
          </div>
        )}

        {tab === "left" && (
          <div className="space-y-3">
            {left.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
                <svg className="mx-auto mb-3 h-10 w-10 text-ash" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
                <p className="text-sm font-medium text-slate">No cancelled visits today</p>
                <p className="mt-1 text-xs text-ash">Patients who left or were cancelled will appear here.</p>
              </div>
            ) : (
              left.map((v) => (
                <CompletedVisitCard
                  key={v.visit_id}
                  visit={v}
                  type="left"
                />
              ))
            )}
            {hasMoreLeft && (
              <button
                onClick={() => loadMoreVisits("left")}
                disabled={loadingMore}
                className="mt-3 w-full rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-slate hover:bg-gray-200 disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
