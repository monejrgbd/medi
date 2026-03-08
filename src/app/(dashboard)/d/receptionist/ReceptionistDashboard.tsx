"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useReceptionistRealtime } from "@/hooks/useReceptionistRealtime";
import ReceptionistHeader from "@/components/receptionist/ReceptionistHeader";
import ApprovalQueue from "@/components/receptionist/ApprovalQueue";
import ActivePatientsList from "@/components/receptionist/ActivePatientsList";

interface PendingVisit {
  visit_id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  birthday: string;
  created_at: string;
  has_previous_visits: boolean;
  match_type: string;
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
}

interface Location {
  id: string;
  name: string;
}

interface ReceptionistDashboardProps {
  mode: "select_location" | "dashboard";
  locations: Location[];
  staffUserId: string | null;
  orgId: string;
  locationId: string | null;
  locationName?: string;
  initialPending: PendingVisit[];
  initialActive: ActiveVisit[];
  initialCompleted: CompletedVisit[];
  initialCounts: Counts | null;
}

const DEFAULT_COUNTS: Counts = {
  awaiting: 0,
  with_ai: 0,
  in_queue: 0,
  with_doctor: 0,
  tablets_out: 0,
  doctors_checked_in: 0,
};

export default function ReceptionistDashboard({
  mode,
  locations,
  staffUserId,
  orgId,
  locationId,
  locationName = "Reception",
  initialPending,
  initialActive,
  initialCompleted,
  initialCounts,
}: ReceptionistDashboardProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"pending" | "active">("pending");
  const [pending, setPending] = useState<PendingVisit[]>(initialPending);
  const [active, setActive] = useState<ActiveVisit[]>(initialActive);
  const [completed, setCompleted] = useState<CompletedVisit[]>(initialCompleted);
  const [counts, setCounts] = useState<Counts>(initialCounts ?? DEFAULT_COUNTS);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkinError, setCheckinError] = useState<string | null>(null);

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

  useReceptionistRealtime(locationId, handleVisitChange);

  // Handle check-in to location
  async function handleCheckIn(locId: string) {
    if (!staffUserId) return;
    setCheckingIn(true);
    setCheckinError(null);

    const supabase = createClient();
    const { data, error } = await supabase.rpc("staff_check_in", {
      p_location_id: locId,
      p_role: "receptionist",
    });

    if (error || (data && !data.success)) {
      setCheckinError(data?.error ?? error?.message ?? "Check-in failed. Try again.");
      setCheckingIn(false);
      return;
    }

    router.refresh();
  }

  async function handleCheckOut() {
    const supabase = createClient();
    await supabase.rpc("staff_check_out");
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
            <p className="text-sm text-red-600 text-center mt-4">{checkinError}</p>
          )}

          {!staffUserId && (
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
  ];

  return (
    <div>
      <ReceptionistHeader
        counts={counts}
        locationName={locationName}
        onCheckOut={handleCheckOut}
      />

      <div className="px-4 py-4 lg:px-6">
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
            onActionComplete={handleApprovalComplete}
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
      </div>
    </div>
  );
}
