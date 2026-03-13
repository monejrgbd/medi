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
  priority: number;
  wait_seconds: number;
  is_sensitive: boolean;
  timeout_flagged: boolean;
  has_previous_visits: boolean;
  created_at: string;
}

export interface ClaimedVisit {
  visit_id: string;
  first_name: string;
  last_name: string;
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
  orgId: string;
  locationId: string | null;
  locationName?: string;
  initialQueue: QueueVisit[];
  initialClaimed: ClaimedVisit[];
  initialCompleted: CompletedVisit[];
  initialLeft: CompletedVisit[];
  initialDoctors: Doctor[];
}

type Tab = "pending" | "claimed" | "completed" | "left";

export default function DoctorDashboard({
  mode,
  locations,
  staffUserId,
  orgId,
  locationId,
  locationName = "Clinic",
  initialQueue,
  initialClaimed,
  initialCompleted,
  initialLeft,
  initialDoctors,
}: DoctorDashboardProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [queue, setQueue] = useState<QueueVisit[]>(initialQueue);
  const [claimed, setClaimed] = useState<ClaimedVisit[]>(initialClaimed);
  const [completed, setCompleted] = useState<CompletedVisit[]>(initialCompleted);
  const [left, setLeft] = useState<CompletedVisit[]>(initialLeft);
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkinError, setCheckinError] = useState<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [urgentPatient, setUrgentPatient] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);

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
    setQueue(initialQueue);
    setClaimed(initialClaimed);
    setCompleted(initialCompleted);
    setLeft(initialLeft);
    setDoctors(initialDoctors);
  }, [initialQueue, initialClaimed, initialCompleted, initialLeft, initialDoctors]);

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

  useDoctorRealtime(
    mode === "dashboard" ? locationId : null,
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

    const supabase = createClient();
    const { data, error } = await supabase.rpc("staff_check_in", {
      p_location_id: locId,
      p_role: "doctor",
    });

    if (error || (data && !data.success)) {
      setCheckinError(
        data?.error ?? error?.message ?? "Check-in failed. Try again."
      );
      setCheckingIn(false);
      return;
    }

    router.refresh();
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

          <div className="space-y-3">
            {locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => handleCheckIn(loc.id)}
                disabled={checkingIn || !staffUserId}
                className="w-full rounded-xl border-2 border-gray-200 bg-white p-4 text-left transition-all hover:border-hilt-blue disabled:opacity-50"
              >
                <h3 className="font-semibold text-ink">{loc.name}</h3>
              </button>
            ))}
          </div>

          {checkinError && (
            <p className="text-sm text-red-600 text-center mt-4">
              {checkinError}
            </p>
          )}

          {!staffUserId && (
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

        {locationId && <StaleSessionAlert locationId={locationId} />}

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
        <div className="mb-4 flex justify-end">
          <CheckInOutButton />
        </div>

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
              <p className="text-sm text-slate text-center py-8">
                No claimed patients.
              </p>
            ) : (
              claimed.map((v) => (
                <ClaimedPatientCard key={v.visit_id} visit={v} />
              ))
            )}
          </div>
        )}

        {tab === "completed" && (
          <div className="space-y-3">
            {completed.length === 0 ? (
              <p className="text-sm text-slate text-center py-8">
                No completed visits today.
              </p>
            ) : (
              completed.map((v) => (
                <CompletedVisitCard
                  key={v.visit_id}
                  visit={v}
                  type="completed"
                />
              ))
            )}
          </div>
        )}

        {tab === "left" && (
          <div className="space-y-3">
            {left.length === 0 ? (
              <p className="text-sm text-slate text-center py-8">
                No cancelled visits today.
              </p>
            ) : (
              left.map((v) => (
                <CompletedVisitCard
                  key={v.visit_id}
                  visit={v}
                  type="left"
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
