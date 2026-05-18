"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cancelClaim, fetchVisitDetail } from "@/app/(dashboard)/d/_actions/doctor";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "sonner";
import PatientProfileCard from "@/components/doctor/PatientProfileCard";
import TranscriptTabs from "@/components/doctor/TranscriptTabs";
import type { PrescreeningData } from "@/types/medical";
import SummaryDisplay from "@/components/doctor/SummaryDisplay";
import AIDiagnosticPanel from "@/components/doctor/AIDiagnosticPanel";
import DiagnosisForm from "@/components/doctor/DiagnosisForm";
import VisitHistoryAccordion from "@/components/doctor/VisitHistoryAccordion";
import AddendumBadge from "@/components/doctor/AddendumBadge";
import NotesPanel from "@/components/doctor/NotesPanel";
import AttachmentsSection from "@/components/doctor/AttachmentsSection";
import ReferralForm from "@/components/doctor/ReferralForm";
import ReferralHistory from "@/components/doctor/ReferralHistory";
import LetterGeneratorModal from "@/components/doctor/LetterGeneratorModal";
import SoapNoteEditor from "@/components/doctor/SoapNoteEditor";
import ScribePanel from "@/components/doctor/ScribePanel";
import DocumentHistory from "@/components/doctor/DocumentHistory";

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
    location_id: string;
    updated_at: string;
    is_follow_up: boolean;
    follow_up_of: string | null;
    diagnostic_enabled: boolean;
    nurse_reviewed?: boolean;
    nurse_notes?: string;
    ai_session_instructions?: string;
    ai_skipped?: boolean;
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
}

interface PatientDetailViewProps {
  detail: VisitDetail;
  isOwner: boolean;
  staffUserId: string | null;
}

type DetailTab = "transcript" | "summary" | "history" | "notes" | "attachments" | "referrals" | "documents";

export default function PatientDetailView({
  detail: initialDetail,
  isOwner,
  staffUserId,
}: PatientDetailViewProps) {
  const router = useRouter();
  const { org } = useRole();
  const [detail, setDetail] = useState(initialDetail);
  const [tab, setTab] = useState<DetailTab>("summary");
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [showSoapEditor, setShowSoapEditor] = useState(false);
  const [showScribe, setShowScribe] = useState(false);
  const [scribeDocId, setScribeDocId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [updateNotice, setUpdateNotice] = useState(false);
  const supabaseRef = useRef(createClient());
  const updatedAtRef = useRef(detail.visit.updated_at);
  updatedAtRef.current = detail.visit.updated_at;

  const { visit, patient, transcript, addendums, notes, attachments } = detail;
  const isClaimed = visit.status === "claimed_by_doctor";
  const isCompleted = visit.status === "completed";
  const canAct =
    isClaimed && (isOwner || visit.claimed_by === staffUserId);
  // Documents stay accessible after completion so doctors can issue sick notes etc.
  const canCreateDocument =
    (isClaimed || isCompleted) && (isOwner || visit.claimed_by === staffUserId);

  // Subscribe to visit updates (addendum detection)
  useEffect(() => {
    const supabase = supabaseRef.current;

    const channel = supabase
      .channel(`visit-detail:${visit.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "visits",
          filter: `id=eq.${visit.id}`,
        },
        (payload) => {
          const newRow = payload.new as Record<string, unknown>;
          if (newRow.updated_at !== updatedAtRef.current) {
            setUpdateNotice(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [visit.id]);

  async function handleRefresh() {
    const result = await fetchVisitDetail(visit.id);
    if (result.success && result.data) {
      setDetail(result.data);
      setUpdateNotice(false);
    }
  }

  async function handleCancelClaim() {
    setCancelling(true);
    const result = await cancelClaim(visit.id);
    if (result.success) {
      router.push("/d/doctor");
    } else {
      alert(result.error || "Failed to cancel claim");
      setCancelling(false);
    }
  }

  const tabs: { key: DetailTab; label: string; show: boolean }[] = [
    { key: "summary", label: "Summary", show: true },
    { key: "transcript", label: "Transcript", show: true },
    {
      key: "notes",
      label: `Notes (${(notes || []).length})`,
      show: true,
    },
    {
      key: "attachments",
      label: `Files (${(attachments || []).length})`,
      show: true,
    },
    { key: "history", label: "History", show: true },
    { key: "referrals", label: "Referrals", show: true },
    { key: "documents", label: "Documents", show: true },
  ];

  return (
    <div className="min-h-screen bg-snow pb-24">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3 lg:px-6">
        <button
          onClick={() => router.push("/d/doctor")}
          className="text-sm text-slate hover:text-ink transition-colors"
        >
          &larr; Back to queue
        </button>
      </div>

      {/* Timeout warning */}
      {visit.timeout_flagged && (
        <div className="mx-4 mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 lg:mx-6">
          <p className="text-sm text-amber-800">
            Patient took more than 30 mins. Transcript may be incomplete.
            Please ask follow-up questions directly.
          </p>
        </div>
      )}

      {/* Follow-up badge */}
      {visit.is_follow_up && (
        <div className="mx-4 mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 lg:mx-6">
          <p className="text-sm font-medium text-blue-800">
            Follow-up visit
          </p>
        </div>
      )}

      {/* Update notice */}
      {updateNotice && (
        <div className="mx-4 mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 lg:mx-6 flex items-center justify-between">
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

      <div className="px-4 py-4 lg:px-6 overflow-x-hidden">
        {/* Patient profile */}
        <PatientProfileCard patient={patient} />

        {/* Completed diagnosis display */}
        {visit.status === "completed" && visit.doctor_diagnosis && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
            <h3 className="text-sm font-semibold text-green-800 mb-1">
              Diagnosis
            </h3>
            <p className="text-sm text-green-900 whitespace-pre-wrap">
              {visit.doctor_diagnosis}
            </p>
          </div>
        )}

        {/* Nurse notes */}
        {visit.nurse_notes && (
          <div className="mt-4 rounded-lg bg-teal-50 border border-teal-200 p-4">
            <h4 className="text-sm font-semibold text-teal-800 mb-1">Nurse Notes</h4>
            <p className="text-sm text-ink whitespace-pre-wrap">{visit.nurse_notes}</p>
          </div>
        )}

        {/* Session instructions from receptionist */}
        {visit.ai_session_instructions && (
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
            <h4 className="text-sm font-semibold text-amber-800 mb-1">Session Instructions Given to AI</h4>
            <p className="text-sm text-ink whitespace-pre-wrap">{visit.ai_session_instructions}</p>
          </div>
        )}

        {/* AI Diagnostic */}
        {(visit.ai_diagnostic || visit.diagnostic_enabled) && (
          <div className="mt-4">
            <AIDiagnosticPanel diagnostic={visit.ai_diagnostic} loading={visit.diagnostic_enabled && !visit.ai_diagnostic} />
          </div>
        )}

        {/* Tabs — scroll inside the strip on narrow viewports so the page itself
            does not become wider than the viewport (which on iOS Safari allows
            pinch-zoom-out to reveal whitespace). */}
        <div className="mt-6 -mx-4 lg:mx-0 overflow-x-auto border-b border-gray-200">
          <div className="flex gap-1 px-4 lg:px-0 w-max">
            {tabs
              .filter((t) => t.show)
              .map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    tab === t.key
                      ? "border-hilt-blue text-hilt-blue"
                      : "border-transparent text-slate hover:text-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="mt-4">
          {tab === "summary" && (
            <div>
              <SummaryDisplay
                summary={visit.ai_summary}
                structuredCard={visit.ai_structured_card}
              />
              {addendums.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate">
                    Addendums ({addendums.length})
                  </h4>
                  {addendums.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-lg border border-amber-100 bg-amber-50/50 p-4"
                    >
                      <AddendumBadge createdAt={a.created_at} />
                      <p className="mt-2 text-sm text-ink whitespace-pre-wrap">
                        {a.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "transcript" && (
            <TranscriptTabs
              messages={transcript}
              prescreening={detail.prescreening_data ?? null}
              scribeTranscript={detail.scribe_transcript ?? null}
              aiSkipped={visit.ai_skipped}
            />
          )}

          {tab === "notes" && (
            <NotesPanel
              visitId={visit.id}
              patientId={patient.id}
              initialNotes={notes || []}
            />
          )}

          {tab === "attachments" && (
            <AttachmentsSection
              visitId={visit.id}
              initialAttachments={attachments || []}
              canUpload={canAct || isOwner}
            />
          )}

          {tab === "history" && (
            <VisitHistoryAccordion patientId={patient.id} />
          )}

          {tab === "referrals" && <ReferralHistory />}

          {tab === "documents" && <DocumentHistory visitId={visit.id} />}
        </div>
      </div>

      {/* Action bar */}
      {(canAct || canCreateDocument) && (
        <div className="fixed bottom-0 inset-x-0 border-t border-gray-200 bg-white px-4 py-3 lg:px-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 max-w-3xl mx-auto">
            {canAct && (
              <>
                <button
                  onClick={() => setShowDiagnosis(true)}
                  className="flex-1 min-w-[140px] rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Complete Visit
                </button>
                <button
                  onClick={handleCancelClaim}
                  disabled={cancelling}
                  className="flex-1 sm:flex-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-slate hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
                >
                  {cancelling ? "Releasing..." : "Cancel Claim"}
                </button>
                <button
                  onClick={() => {
                    if (!org?.verified) {
                      toast.error("To send referrals, your clinic must be verified. Contact business@hilthealth.com to apply.");
                      return;
                    }
                    setShowReferral(true);
                  }}
                  className="flex-1 sm:flex-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-slate hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  Refer
                </button>
              </>
            )}
            {canCreateDocument && (
              <button
                onClick={() => setShowLetterModal(true)}
                className="flex-1 sm:flex-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-slate hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Create Document
              </button>
            )}
            {canCreateDocument && (
              <button
                onClick={() => setShowScribe(true)}
                className="flex-1 sm:flex-none rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Activate Scribe
              </button>
            )}
          </div>
        </div>
      )}

      {/* Diagnosis modal */}
      {showDiagnosis && (
        <DiagnosisForm
          visitId={visit.id}
          onClose={() => setShowDiagnosis(false)}
          onComplete={() => router.push("/d/doctor")}
        />
      )}

      {/* Referral modal */}
      {showReferral && (
        <ReferralForm
          visitId={visit.id}
          patientId={patient.id}
          onClose={() => setShowReferral(false)}
          onComplete={() => setShowReferral(false)}
        />
      )}

      {/* Letter / document generator modal */}
      {showLetterModal && (
        <LetterGeneratorModal
          visitId={visit.id}
          patientId={patient.id}
          locationId={visit.location_id}
          onClose={() => setShowLetterModal(false)}
          onComplete={() => setShowLetterModal(false)}
          onRequestSoapEditor={() => {
            setShowLetterModal(false);
            setShowSoapEditor(true);
          }}
        />
      )}

      {/* AI scribe panel */}
      {showScribe && (
        <ScribePanel
          visitId={visit.id}
          onClose={() => setShowScribe(false)}
          onOpenSoapEditor={(documentId) => {
            setShowScribe(false);
            setScribeDocId(documentId);
            setShowSoapEditor(true);
          }}
        />
      )}

      {/* SOAP note full-screen editor */}
      {showSoapEditor && (
        <SoapNoteEditor
          visitId={visit.id}
          patientId={patient.id}
          locationId={visit.location_id}
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
    </div>
  );
}
