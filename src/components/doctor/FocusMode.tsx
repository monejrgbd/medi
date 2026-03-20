"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDoctorRealtime } from "@/hooks/useDoctorRealtime";
import {
  claimPatient,
  cancelClaim,
  fetchVisitDetail,
  fetchQueue,
} from "@/app/(dashboard)/d/_actions/doctor";
import PatientProfileCard from "@/components/doctor/PatientProfileCard";
import TranscriptView from "@/components/doctor/TranscriptView";
import SummaryDisplay from "@/components/doctor/SummaryDisplay";
import AIDiagnosticPanel from "@/components/doctor/AIDiagnosticPanel";
import NotesPanel from "@/components/doctor/NotesPanel";
import AttachmentsSection from "@/components/doctor/AttachmentsSection";
import DiagnosisForm from "@/components/doctor/DiagnosisForm";
import type { ClaimedVisit, QueueVisit } from "@/app/(dashboard)/d/doctor/DoctorDashboard";

interface VisitNote {
  id: string;
  content: string;
  is_private: boolean;
  author_name: string;
  is_own: boolean;
  created_at: string;
}

interface VisitAttachment {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploader_name: string;
  created_at: string;
}

interface VisitDetail {
  visit: {
    id: string;
    status: string;
    ai_summary: string | null;
    ai_structured_card: Record<string, unknown> | null;
    ai_diagnostic: string | null;
    ai_model_used: string | null;
    doctor_diagnosis: string | null;
    priority: number;
    is_sensitive: boolean;
    timeout_flagged: boolean;
    created_at: string;
    completed_at: string | null;
    claimed_at: string | null;
    claimed_by: string | null;
    entered_queue_at: string | null;
    updated_at: string;
    is_follow_up: boolean;
    follow_up_of: string | null;
    diagnostic_enabled: boolean;
  };
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    birthday: string;
    phone_masked: string | null;
    medications: { name: string }[];
    allergies: { name: string }[];
    chronic_conditions: { name: string }[];
    visit_count: number;
    last_visit_date: string | null;
    last_visit_summary: string | null;
  };
  transcript: { id: string; role: string; content: string; created_at: string }[];
  addendums: { id: string; content: string; created_at: string }[];
  notes: VisitNote[];
  attachments: VisitAttachment[];
}

type FocusTab = "summary" | "transcript" | "notes" | "attachments";

interface FocusModeProps {
  locationId: string;
  locationName: string;
  initialClaimed: ClaimedVisit[];
  initialQueue: QueueVisit[];
  soundEnabled: boolean;
  onExit: () => void;
  demoVisitId?: string | null;
  demoMode?: boolean;
}

export default function FocusMode({
  locationId,
  locationName,
  initialClaimed,
  initialQueue,
  soundEnabled,
  onExit,
  demoVisitId,
  demoMode = false,
}: FocusModeProps) {
  const router = useRouter();
  const [currentVisit, setCurrentVisit] = useState<ClaimedVisit | null>(
    initialClaimed[0] || null
  );
  const [queue, setQueue] = useState(initialQueue);
  const [detail, setDetail] = useState<VisitDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoClaiming, setAutoClaiming] = useState(false);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [demoCompleted, setDemoCompleted] = useState(false);
  const [tab, setTab] = useState<FocusTab>("summary");
  const [updateNotice, setUpdateNotice] = useState(false);
  const supabaseRef = useRef(createClient());
  const updatedAtRef = useRef<string | null>(null);
  const currentVisitRef = useRef(currentVisit);
  const autoClaimingRef = useRef(autoClaiming);

  useEffect(() => { currentVisitRef.current = currentVisit; }, [currentVisit]);
  useEffect(() => { autoClaimingRef.current = autoClaiming; }, [autoClaiming]);

  // In demo mode, sync currentVisit with the correct visit when demoVisitId arrives
  useEffect(() => {
    if (!demoVisitId) return; // Still loading from sessionStorage, don't clear
    if (currentVisitRef.current?.visit_id === demoVisitId) return; // Already correct
    const match = initialClaimed.find(v => v.visit_id === demoVisitId);
    if (match) setCurrentVisit(match);
  }, [demoVisitId, initialClaimed]);

  // Keyboard shortcuts for focus mode speed
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger shortcuts when typing in inputs/textareas
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      if (e.key === "Escape") {
        e.preventDefault();
        if (showDiagnosis) {
          setShowDiagnosis(false);
        } else if (cancelling || demoMode) {
          // do nothing while cancelling or in demo
        } else {
          onExit();
        }
      }

      // Ctrl/Cmd + Enter to open diagnosis form (complete)
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && currentVisitRef.current && !showDiagnosis) {
        e.preventDefault();
        setShowDiagnosis(true);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showDiagnosis, cancelling, onExit]);

  useEffect(() => {
    if (!currentVisit) {
      setDetail(null);
      setTab("summary");
      setUpdateNotice(false);
      return;
    }

    setLoading(true);
    fetchVisitDetail(currentVisit.visit_id).then((result) => {
      if (result.success && result.data) {
        setDetail(result.data as VisitDetail);
        updatedAtRef.current = (result.data as VisitDetail).visit.updated_at;
      }
      setLoading(false);
    });
  }, [currentVisit]);

  // Subscribe to visit updates
  useEffect(() => {
    if (!detail) return;
    const supabase = supabaseRef.current;

    const channel = supabase
      .channel(`focus-visit:${detail.visit.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "visits",
          filter: `id=eq.${detail.visit.id}`,
        },
        (payload) => {
          const newRow = payload.new as Record<string, unknown>;
          if (newRow.updated_at !== updatedAtRef.current) {
            // Auto-refresh if diagnostic just arrived (was null, now set)
            if (newRow.ai_diagnostic && !detail.visit.ai_diagnostic) {
              fetchVisitDetail(detail.visit.id).then((result) => {
                if (result.success && result.data) {
                  setDetail(result.data as VisitDetail);
                  updatedAtRef.current = (result.data as VisitDetail).visit.updated_at;
                }
              });
            } else {
              setUpdateNotice(true);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [detail?.visit.id]);

  async function handleRefresh() {
    if (!currentVisit) return;
    const result = await fetchVisitDetail(currentVisit.visit_id);
    if (result.success && result.data) {
      setDetail(result.data as VisitDetail);
      updatedAtRef.current = (result.data as VisitDetail).visit.updated_at;
      setUpdateNotice(false);
    }
  }

  const handleVisitChange = useCallback(() => {
    router.refresh();
    fetchQueue(locationId).then((result) => {
      if (result.success) {
        let newQueue = result.queue || [];
        // In demo mode, only show the current session's visit
        if (demoVisitId) {
          newQueue = newQueue.filter((q: QueueVisit) => q.visit_id === demoVisitId);
        }
        setQueue(newQueue);
        if (!currentVisitRef.current && newQueue.length > 0 && !autoClaimingRef.current) {
          doClaimNext(newQueue);
        }
      }
    });
  }, [router, locationId, demoVisitId]);

  useDoctorRealtime(locationId, handleVisitChange, { soundEnabled });

  async function doClaimNext(fromQueue?: QueueVisit[]) {
    const q = fromQueue || queue;
    if (q.length === 0 || autoClaimingRef.current) return;

    setAutoClaiming(true);
    const result = await claimPatient(q[0].visit_id);
    setAutoClaiming(false);

    if (result.success) {
      setCurrentVisit({
        visit_id: q[0].visit_id,
        first_name: q[0].first_name,
        last_name: q[0].last_name,
        claimed_at: new Date().toISOString(),
        priority: q[0].priority,
        is_sensitive: q[0].is_sensitive,
        has_previous_visits: q[0].has_previous_visits,
      });
      setQueue((prev) => {
        const target = fromQueue || prev;
        return target.slice(1);
      });
      setShowDiagnosis(false);
      setTab("summary");
    }
  }

  function handleVisitCompleted() {
    setCurrentVisit(null);
    setDetail(null);
    setShowDiagnosis(false);
    if (demoMode) {
      setDemoCompleted(true);
    } else {
      setTimeout(() => doClaimNext(), 500);
    }
  }

  if (!currentVisit) {
    if (demoCompleted) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">Visit Completed</h2>
          <p className="text-sm text-slate">
            The patient will receive an SMS with their visit summary and a review request.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <svg className="h-8 w-8 text-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {queue.length > 0 ? (
          <>
            <h2 className="text-xl font-bold text-ink mb-2">
              {queue.length} patient{queue.length > 1 ? "s" : ""} in queue
            </h2>
            <button
              onClick={() => doClaimNext()}
              disabled={autoClaiming}
              className="rounded-lg bg-hilt-blue px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors mt-4"
            >
              {autoClaiming ? "Claiming..." : "Claim Next Patient"}
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-ink mb-2">
              No patients in queue
            </h2>
            <p className="text-sm text-slate">
              You&apos;ll be notified when a patient arrives.
            </p>
          </>
        )}

        {!demoMode && (
          <button
            onClick={onExit}
            className="mt-6 text-sm text-slate hover:text-ink transition-colors"
          >
            Exit Focus Mode
          </button>
        )}
      </div>
    );
  }

  const tabs: { key: FocusTab; label: string; show: boolean }[] = [
    { key: "summary", label: "Summary", show: true },
    { key: "transcript", label: "Transcript", show: true },
    { key: "notes", label: `Notes (${(detail?.notes || []).length})`, show: true },
    { key: "attachments", label: `Files (${(detail?.attachments || []).length})`, show: true },
  ];

  return (
    <div className="min-h-screen bg-snow pb-24">
      {/* Focus header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div>
            <h2 className="text-lg font-bold text-ink">
              {currentVisit.first_name} {currentVisit.last_name}
            </h2>
            <p className="text-xs text-slate">
              {locationName} | Focus Mode
              {!demoVisitId && queue.length > 0 && ` | ${queue.length} more in queue`}
            </p>
          </div>
          {!demoMode && (
            <button
              onClick={onExit}
              className="text-sm text-slate hover:text-ink transition-colors"
              aria-label="Exit focus mode"
            >
              Exit Focus
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-hilt-blue" />
        </div>
      ) : detail ? (
        <div className="px-4 py-4 lg:px-6 max-w-3xl mx-auto">
          {/* Timeout warning */}
          {detail.visit.timeout_flagged && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm text-amber-800">
                Patient took more than 30 mins. Transcript may be incomplete.
                Please ask follow-up questions directly.
              </p>
            </div>
          )}

          {/* Follow-up badge */}
          {detail.visit.is_follow_up && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm font-medium text-blue-800">
                Follow-up visit
              </p>
            </div>
          )}

          {/* Update notice */}
          {updateNotice && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-center justify-between">
              <p className="text-sm text-blue-800">
                Visit updated — new notes, attachments, or addendums.
              </p>
              <button
                onClick={handleRefresh}
                className="text-sm font-medium text-blue-700 hover:text-blue-900"
              >
                Refresh
              </button>
            </div>
          )}

          {/* Patient profile card with medications, allergies, chronic conditions */}
          <PatientProfileCard patient={detail.patient} />

          {/* AI Diagnostic — inline above tabs */}
          {(detail.visit.ai_diagnostic || detail.visit.diagnostic_enabled) && (
            <div className="mt-4">
              <AIDiagnosticPanel
                diagnostic={detail.visit.ai_diagnostic}
                loading={detail.visit.diagnostic_enabled && !detail.visit.ai_diagnostic}
              />
            </div>
          )}

          {/* Tabs */}
          <div className="mt-6 flex gap-1 border-b border-gray-200 overflow-x-auto">
            {tabs
              .filter((t) => t.show)
              .map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
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
          <div className="mt-4">
            {tab === "summary" && (
              <SummaryDisplay
                summary={detail.visit.ai_summary}
                structuredCard={detail.visit.ai_structured_card}
              />
            )}

            {tab === "transcript" && (
              <TranscriptView messages={detail.transcript} />
            )}

            {tab === "notes" && (
              <NotesPanel
                visitId={detail.visit.id}
                patientId={detail.patient.id}
                initialNotes={detail.notes || []}
              />
            )}

            {tab === "attachments" && (
              <AttachmentsSection
                visitId={detail.visit.id}
                initialAttachments={detail.attachments || []}
                canUpload={true}
              />
            )}
          </div>
        </div>
      ) : null}

      {/* Action bar */}
      {detail && (
        <div className="fixed bottom-0 inset-x-0 border-t border-gray-200 bg-white px-4 py-3 lg:px-6">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <button
              onClick={async () => {
                if (!currentVisit) return;
                setCancelling(true);
                const result = await cancelClaim(currentVisit.visit_id);
                setCancelling(false);
                if (result.success) {
                  setCurrentVisit(null);
                  setDetail(null);
                  setShowDiagnosis(false);
                }
              }}
              disabled={cancelling}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-slate hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {cancelling ? "Cancelling..." : "Cancel Claim"}
            </button>
            <button
              onClick={() => setShowDiagnosis(true)}
              className={`flex-1 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors ${demoMode ? "animate-pulse ring-2 ring-green-400 ring-offset-2" : ""}`}
            >
              {demoMode ? "Complete Visit" : "Complete Visit & Claim Next"}
              {!demoMode && (
                <kbd className="ml-2 hidden sm:inline rounded bg-green-700/50 px-1.5 py-0.5 text-[10px] font-mono">
                  {typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent) ? "⌘" : "Ctrl"}+↵
                </kbd>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Diagnosis modal (includes follow-up form) */}
      {showDiagnosis && detail && (
        <DiagnosisForm
          visitId={detail.visit.id}
          onClose={() => setShowDiagnosis(false)}
          onComplete={handleVisitCompleted}
          demoMode={demoMode}
        />
      )}
    </div>
  );
}
