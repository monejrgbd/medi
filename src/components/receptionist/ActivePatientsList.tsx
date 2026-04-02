"use client";

import { useState } from "react";
import PatientStatusBadge from "@/components/patient/PatientStatusBadge";
import {
  markPatientLeft,
  toggleGaveTablet,
  handlePatient,
} from "@/app/(dashboard)/d/_actions/receptionist";
import { formatQueueNumber } from "@/lib/queueUtils";

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
  queue_number?: number | null;
  patients: {
    id?: string;
    first_name: string;
    last_name: string;
    birthday: string;
  };
  claimed_doctor?: {
    full_name: string;
  } | null;
}

interface FollowUpRecord {
  id: string;
  due_at: string | null;
  ai_instructions: string | null;
  status: string;
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
  follow_ups?: FollowUpRecord[];
}

interface ActivePatientsListProps {
  visits: ActiveVisit[];
  completedVisits: CompletedVisit[];
  onVisitUpdate: (visitId: string, update: Partial<ActiveVisit>) => void;
  onVisitRemove: (visitId: string) => void;
}

export default function ActivePatientsList({
  visits,
  completedVisits,
  onVisitUpdate,
  onVisitRemove,
}: ActivePatientsListProps) {
  const [loadingAction, setLoadingAction] = useState<Record<string, string>>(
    {}
  );
  async function handleMarkLeft(visitId: string) {
    setLoadingAction((prev) => ({ ...prev, [visitId]: "left" }));
    const result = await markPatientLeft(visitId);
    setLoadingAction((prev) => {
      const next = { ...prev };
      delete next[visitId];
      return next;
    });
    if (result.success) onVisitRemove(visitId);
  }

  async function handleToggleTablet(visitId: string) {
    setLoadingAction((prev) => ({ ...prev, [visitId]: "tablet" }));
    const result = await toggleGaveTablet(visitId);
    setLoadingAction((prev) => {
      const next = { ...prev };
      delete next[visitId];
      return next;
    });
    if (result.success) {
      onVisitUpdate(visitId, { gave_tablet: result.gave_tablet });
    }
  }

  async function handleDismiss(visitId: string) {
    setLoadingAction((prev) => ({ ...prev, [visitId]: "handled" }));
    const result = await handlePatient(visitId);
    setLoadingAction((prev) => {
      const next = { ...prev };
      delete next[visitId];
      return next;
    });
    if (result.success) onVisitRemove(visitId);
  }

  const activeVisits = visits;

  return (
    <div>
      {activeVisits.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
          <svg className="mx-auto mb-3 h-10 w-10 text-ash" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
          <p className="text-sm font-medium text-slate">No active patients</p>
          <p className="mt-1 text-xs text-ash">Patients in the AI conversation or queue will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeVisits.map((visit) => {
            const canMarkLeft = [
              "pending_approval",
              "still_answering_ai",
              "waiting_doctor_claim",
              "claimed_by_doctor",
            ].includes(visit.status);
            const isLoading = !!loadingAction[visit.id];

            return (
              <div
                key={visit.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {visit.queue_number != null && (
                        <span className="inline-flex items-center justify-center rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-600 tabular-nums">
                          #{formatQueueNumber(visit.queue_number, "fifo")}
                        </span>
                      )}
                      <h3 className="font-medium text-ink truncate">
                        {visit.patients.first_name} {visit.patients.last_name}
                      </h3>
                      <PatientStatusBadge status={visit.status} />
                    </div>
                    <p className="text-xs text-ash">
                      DOB: {visit.patients.birthday}{(visit.patients as Record<string, unknown>).sex ? ` · ${(visit.patients as Record<string, unknown>).sex}` : ""}
                      {visit.claimed_doctor && (
                        <span className="ml-2">
                          {visit.claimed_is_nurse
                            ? `, Nurse: ${visit.claimed_doctor.full_name}`
                            : `, Dr. ${visit.claimed_doctor.full_name}`}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleTablet(visit.id)}
                    disabled={isLoading}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      visit.gave_tablet
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    } disabled:opacity-50`}
                  >
                    {visit.gave_tablet ? "Tablet Out" : "Give Tablet"}
                  </button>

                  {canMarkLeft && (
                    <button
                      onClick={() => handleMarkLeft(visit.id)}
                      disabled={isLoading}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                    >
                      Mark Left
                    </button>
                  )}

                  <button
                    onClick={() => handleDismiss(visit.id)}
                    disabled={isLoading}
                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
                  >
                    Handled
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed section */}
      {completedVisits.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-ink mb-3">
            Completed Today ({completedVisits.length})
          </h3>
          <div className="space-y-2">
            {completedVisits.map((visit) => {
              const unscheduledFu = visit.follow_ups?.find(
                (fu) => fu.status === "active" && fu.due_at === null
              );
              const scheduledFu = visit.follow_ups?.find(
                (fu) => fu.status === "active" && fu.due_at !== null
              );
              return (
                <CompletedVisitCard
                  key={visit.id}
                  visit={visit}
                  unscheduledFollowUp={unscheduledFu || null}
                  scheduledFollowUp={scheduledFu || null}
                />
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

function CompletedVisitCard({
  visit,
  unscheduledFollowUp,
  scheduledFollowUp,
}: {
  visit: CompletedVisit;
  unscheduledFollowUp: FollowUpRecord | null;
  scheduledFollowUp: FollowUpRecord | null;
}) {
  const followUp = unscheduledFollowUp || scheduledFollowUp;

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-ink">
            {visit.patients.first_name} {visit.patients.last_name}
          </p>
          <p className="text-xs text-ash">
            Completed{" "}
            {new Date(visit.completed_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {visit.gave_tablet && (
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
              Tablet not returned
            </span>
          )}
          {followUp && (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              Follow up tagged
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
