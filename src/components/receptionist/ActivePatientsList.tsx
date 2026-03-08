"use client";

import { useState } from "react";
import PatientStatusBadge from "@/components/patient/PatientStatusBadge";
import {
  markPatientLeft,
  toggleGaveTablet,
  handlePatient,
} from "@/app/(dashboard)/d/_actions/receptionist";

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

  // Show all non-completed/left visits including pending_approval
  const activeVisits = visits;

  return (
    <div>
      {activeVisits.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-ash">No active patients.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeVisits.map((visit) => {
            const canMarkLeft = [
              "pending_approval",
              "still_answering_ai",
              "waiting_doctor_claim",
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
                      <h3 className="font-medium text-ink truncate">
                        {visit.patients.first_name} {visit.patients.last_name}
                      </h3>
                      <PatientStatusBadge status={visit.status} />
                    </div>
                    <p className="text-xs text-ash">
                      DOB: {visit.patients.birthday}
                      {visit.claimed_doctor && (
                        <span className="ml-2">
                          — Dr. {visit.claimed_doctor.full_name}
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
            {completedVisits.map((visit) => (
              <div
                key={visit.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3"
              >
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
                {visit.gave_tablet && (
                  <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                    Tablet not returned
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
