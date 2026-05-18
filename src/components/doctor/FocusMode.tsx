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
import TranscriptTabs from "@/components/doctor/TranscriptTabs";
import type { PrescreeningData } from "@/types/medical";
import SummaryDisplay from "@/components/doctor/SummaryDisplay";
import AIDiagnosticPanel from "@/components/doctor/AIDiagnosticPanel";
import NotesPanel from "@/components/doctor/NotesPanel";
import AttachmentsSection from "@/components/doctor/AttachmentsSection";
import DiagnosisForm from "@/components/doctor/DiagnosisForm";
import ReferralForm from "@/components/doctor/ReferralForm";
import ReferralHistory from "@/components/doctor/ReferralHistory";
import VisitHistoryAccordion from "@/components/doctor/VisitHistoryAccordion";
import SoapNoteEditor from "@/components/doctor/SoapNoteEditor";
import ScribePanel from "@/components/doctor/ScribePanel";
import VitalsHistory from "@/components/nurse/VitalsHistory";
import VaccineHistory from "@/components/nurse/VaccineHistory";
import { useRoleSafe } from "@/contexts/RoleContext";
import AddPatientToQueueModal from "@/components/dashboard/AddPatientToQueueModal";
import { toast } from "sonner";
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

interface VitalRecord {
  id: string;
  measured_at: string;
  value: number;
  vital_name: string;
  vital_unit: string;
  display_order?: number;
  notes: string | null;
  recorded_by_name: string;
}

interface VaccineRecord {
  id: string;
  vaccine_name: string;
  dose_number: number | null;
  administered_at: string;
  refused: boolean;
  refusal_reason: string | null;
  lot_number: string | null;
  manufacturer: string | null;
  site: string | null;
  notes: string | null;
  administered_by_name: string;
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
    nurse_reviewed?: boolean;
    nurse_notes?: string;
    diagnostic_enabled: boolean;
    ai_skipped?: boolean;
    manually_added?: boolean;
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
  prescreening_data?: PrescreeningData | null;
  scribe_transcript?: string | null;
  addendums: { id: string; content: string; created_at: string }[];
  notes: VisitNote[];
  attachments: VisitAttachment[];
  vitals?: VitalRecord[];
  vaccines?: VaccineRecord[];
}

type FocusTab = "summary" | "transcript" | "notes" | "attachments" | "vitals" | "vaccines" | "history" | "referrals";

interface FocusModeProps {
  locationId: string;
  locationName: string;
  initialClaimed: ClaimedVisit[];
  initialQueue: QueueVisit[];
  soundEnabled: boolean;
  onExit: () => void;
  demoVisitId?: string | null;
  demoMode?: boolean;
  nurseEnabled?: boolean;
  currentRoom?: string | null;
  role?: "doctor" | "owner";
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
  nurseEnabled = false,
  currentRoom = null,
  role = "doctor",
}: FocusModeProps) {
  const router = useRouter();
  const roleCtx = useRoleSafe();
  const [showReferral, setShowReferral] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [currentVisit, setCurrentVisit] = useState<ClaimedVisit | null>(
    initialClaimed[0] || null
  );
  const [queue, setQueue] = useState(initialQueue);
  const [detail, setDetail] = useState<VisitDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoClaiming, setAutoClaiming] = useState(false);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [showScribe, setShowScribe] = useState(false);
  const [showSoapEditor, setShowSoapEditor] = useState(false);
  const [scribeDocId, setScribeDocId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [demoCompleted, setDemoCompleted] = useState(false);
  const [tab, setTab] = useState<FocusTab>("summary");
  const [updateNotice, setUpdateNotice] = useState(false);
  const [focusNurseOnly, setFocusNurseOnly] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('focus_nurse_only');
      if (stored !== null) return stored === 'true';
    }
    return !!nurseEnabled;
  });
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

  function handleNurseOnlyToggle(checked: boolean) {
    setFocusNurseOnly(checked);
    localStorage.setItem('focus_nurse_only', String(checked));
  }

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
        let detail = result.data as VisitDetail;
        setDetail(detail);
        updatedAtRef.current = detail.visit.updated_at;
      }
      setLoading(false);
    });
  }, [currentVisit, demoMode, nurseEnabled]);

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
    const effectiveNurseOnly = nurseEnabled && focusNurseOnly;
    const claimableQueue = effectiveNurseOnly
      ? q.filter((v: QueueVisit) => v.nurse_reviewed === true)
      : q;

    if (claimableQueue.length === 0 || autoClaimingRef.current) {
      if (claimableQueue.length === 0) setCurrentVisit(null);
      return;
    }

    setAutoClaiming(true);
    const target = claimableQueue[0];
    const result = await claimPatient(target.visit_id);
    setAutoClaiming(false);

    if (result.success) {
      setCurrentVisit({
        visit_id: target.visit_id,
        first_name: target.first_name,
        last_name: target.last_name,
        claimed_at: new Date().toISOString(),
        priority: target.priority,
        is_sensitive: target.is_sensitive,
        has_previous_visits: target.has_previous_visits,
      });
      setQueue((prev) => {
        const source = fromQueue || prev;
        return source.filter((v) => v.visit_id !== target.visit_id);
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

  const addModal =
    showAdd && locationId ? (
      <AddPatientToQueueModal
        locationId={locationId}
        role={role}
        onClose={() => setShowAdd(false)}
        onSuccess={() => handleVisitChange()}
      />
    ) : null;

  const addButton = !demoMode ? (
    <button
      onClick={() => setShowAdd(true)}
      className="rounded-lg bg-hilt-blue px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
    >
      + Add patient
    </button>
  ) : null;

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

        {(() => {
          const nurseFilterActive = nurseEnabled && focusNurseOnly;
          const nurseReviewedCount = queue.filter(v => v.nurse_reviewed).length;
          const claimableCount = nurseFilterActive ? nurseReviewedCount : queue.length;

          if (claimableCount > 0) {
            return (
              <>
                <h2 className="text-xl font-bold text-ink mb-2">
                  {claimableCount} patient{claimableCount > 1 ? "s" : ""} in queue
                </h2>
                <button
                  onClick={() => doClaimNext()}
                  disabled={autoClaiming}
                  className="rounded-lg bg-hilt-blue px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors mt-4"
                >
                  {autoClaiming ? "Claiming..." : "Claim Next Patient"}
                </button>
              </>
            );
          }

          if (nurseFilterActive && queue.length > 0 && nurseReviewedCount === 0) {
            return (
              <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-center">
                <p className="text-sm font-medium text-teal-800">Waiting for nurse reviewed patients...</p>
                <p className="text-xs text-teal-600 mt-1">
                  {queue.length} patient{queue.length !== 1 ? "s" : ""} in queue, not yet reviewed by a nurse
                </p>
              </div>
            );
          }

          return (
            <>
              <h2 className="text-xl font-bold text-ink mb-2">
                No patients in queue
              </h2>
              <p className="text-sm text-slate">
                You will be notified when a patient arrives.
              </p>
            </>
          );
        })()}

        {addButton && <div className="mt-6">{addButton}</div>}

        {!demoMode && (
          <button
            onClick={onExit}
            className="mt-4 text-sm text-slate hover:text-ink transition-colors"
          >
            Exit Focus Mode
          </button>
        )}
        {addModal}
      </div>
    );
  }

  const tabs: { key: FocusTab; label: string; show: boolean }[] = [
    { key: "summary", label: "Summary", show: true },
    { key: "transcript", label: "Transcript", show: true },
    { key: "notes", label: `Notes (${(detail?.notes || []).length})`, show: true },
    { key: "vitals", label: `Vitals (${(detail?.vitals || []).length})`, show: (detail?.vitals || []).length > 0 },
    { key: "vaccines", label: `Vaccines (${(detail?.vaccines || []).length})`, show: (detail?.vaccines || []).length > 0 },
    { key: "attachments", label: `Files (${(detail?.attachments || []).length})`, show: true },
    { key: "history", label: "History", show: true },
    { key: "referrals", label: "Referrals", show: true },
  ];

  return (
    <div className="min-h-screen bg-snow pb-24">
      {/* Focus header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-ink">
                {currentVisit.first_name} {currentVisit.last_name}
              </h2>
              {detail?.visit.ai_skipped && (
                <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  {detail.visit.manually_added ? "Manually added" : "AI Skipped"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate">
              {locationName} | Focus Mode
              {currentRoom && ` | Room: ${currentRoom}`}
              {!demoVisitId && queue.length > 0 && ` | ${queue.length} more in queue`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {addButton}
            {nurseEnabled && (
              <label className="flex items-center gap-2 text-xs text-slate">
                <input
                  type="checkbox"
                  checked={focusNurseOnly}
                  onChange={(e) => handleNurseOnlyToggle(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                Nurse reviewed only
              </label>
            )}
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

          {/* Nurse notes */}
          {detail.visit.nurse_notes && (
            <div className="mt-4 rounded-lg bg-teal-50 border border-teal-200 p-4">
              <h4 className="text-sm font-semibold text-teal-800 mb-1">Nurse Notes</h4>
              <p className="text-sm text-ink whitespace-pre-wrap">{detail.visit.nurse_notes}</p>
            </div>
          )}


          {/* AI Diagnostic — inline above tabs */}
          {!detail.visit.ai_skipped && (detail.visit.ai_diagnostic || detail.visit.diagnostic_enabled) && (
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
              detail.visit.ai_skipped ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
                  <p className="text-sm text-amber-800">
                    {detail.visit.manually_added
                      ? "Manually added, no AI screening"
                      : "AI intake was skipped for this visit"}
                  </p>
                </div>
              ) : (
                <SummaryDisplay
                  summary={detail.visit.ai_summary}
                  structuredCard={detail.visit.ai_structured_card}
                />
              )
            )}

            {tab === "transcript" && (
              <TranscriptTabs
                messages={detail.transcript}
                prescreening={detail.prescreening_data ?? null}
                scribeTranscript={detail.scribe_transcript ?? null}
                aiSkipped={detail.visit.ai_skipped}
                manuallyAdded={detail.visit.manually_added}
              />
            )}

            {tab === "notes" && (
              <NotesPanel
                visitId={detail.visit.id}
                patientId={detail.patient.id}
                initialNotes={detail.notes || []}
              />
            )}

            {tab === "vitals" && (
              <VitalsHistory vitals={detail.vitals || []} />
            )}

            {tab === "vaccines" && (
              <VaccineHistory records={detail.vaccines || []} />
            )}

            {tab === "attachments" && (
              <AttachmentsSection
                visitId={detail.visit.id}
                initialAttachments={detail.attachments || []}
                canUpload={true}
              />
            )}
            {tab === "history" && (
              <VisitHistoryAccordion patientId={detail.patient.id} />
            )}
            {tab === "referrals" && <ReferralHistory />}
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
              onClick={() => {
                if (demoMode) {
                  toast.info("Referral is not available in the demo");
                  return;
                }
                if (!roleCtx?.org?.verified) {
                  toast.error("To send referrals, your clinic must be verified. Contact business@hilthealth.com to apply.");
                  return;
                }
                setShowReferral(true);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-slate hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Refer
            </button>
            <button
              onClick={() => setShowScribe(true)}
              className="rounded-lg border border-hilt-blue px-4 py-2.5 text-sm font-medium text-hilt-blue hover:bg-blue-50 transition-colors"
            >
              Scribe
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

      {/* Referral modal */}
      {showReferral && detail && (
        <ReferralForm
          visitId={detail.visit.id}
          patientId={detail.patient.id}
          onClose={() => setShowReferral(false)}
          onComplete={() => setShowReferral(false)}
        />
      )}

      {/* AI scribe panel */}
      {showScribe && detail && (
        <ScribePanel
          visitId={detail.visit.id}
          onClose={() => setShowScribe(false)}
          onOpenSoapEditor={(documentId) => {
            setShowScribe(false);
            setScribeDocId(documentId);
            setShowSoapEditor(true);
          }}
        />
      )}

      {/* SOAP note editor (scribe draft review) */}
      {showSoapEditor && detail && (
        <SoapNoteEditor
          visitId={detail.visit.id}
          patientId={detail.patient.id}
          locationId={locationId}
          documentId={scribeDocId ?? undefined}
          onClose={() => {
            setShowSoapEditor(false);
            setScribeDocId(null);
          }}
          onComplete={() => {
            setShowSoapEditor(false);
            setScribeDocId(null);
          }}
        />
      )}

      {addModal}
    </div>
  );
}
