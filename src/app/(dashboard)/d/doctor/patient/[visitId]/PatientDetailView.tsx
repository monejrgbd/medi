"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cancelClaim, fetchVisitDetail } from "@/app/(dashboard)/d/_actions/doctor";
import PatientProfileCard from "@/components/doctor/PatientProfileCard";
import TranscriptView from "@/components/doctor/TranscriptView";
import SummaryDisplay from "@/components/doctor/SummaryDisplay";
import AIDiagnosticPanel from "@/components/doctor/AIDiagnosticPanel";
import DiagnosisForm from "@/components/doctor/DiagnosisForm";
import VisitHistoryAccordion from "@/components/doctor/VisitHistoryAccordion";
import AddendumBadge from "@/components/doctor/AddendumBadge";
import NotesPanel from "@/components/doctor/NotesPanel";
import AttachmentsSection from "@/components/doctor/AttachmentsSection";
import ReferralForm from "@/components/doctor/ReferralForm";
import ReferralHistory from "@/components/doctor/ReferralHistory";

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

interface PatientDetailViewProps {
  detail: VisitDetail;
  isOwner: boolean;
  staffUserId: string | null;
}

type DetailTab = "transcript" | "summary" | "diagnostic" | "addendums" | "history" | "notes" | "attachments" | "referrals";

export default function PatientDetailView({
  detail: initialDetail,
  isOwner,
  staffUserId,
}: PatientDetailViewProps) {
  const router = useRouter();
  const [detail, setDetail] = useState(initialDetail);
  const [tab, setTab] = useState<DetailTab>("summary");
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [updateNotice, setUpdateNotice] = useState(false);
  const supabaseRef = useRef(createClient());
  const updatedAtRef = useRef(detail.visit.updated_at);
  updatedAtRef.current = detail.visit.updated_at;

  const { visit, patient, transcript, addendums, notes, attachments } = detail;
  const isClaimed = visit.status === "claimed_by_doctor";
  const canAct =
    isClaimed && (isOwner || visit.claimed_by === staffUserId);

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
      key: "diagnostic",
      label: "AI Diagnostic",
      show: !!visit.ai_diagnostic,
    },
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
    {
      key: "addendums",
      label: `Addendums (${addendums.length})`,
      show: addendums.length > 0,
    },
    { key: "history", label: "History", show: true },
    { key: "referrals", label: "Referrals", show: true },
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

      <div className="px-4 py-4 lg:px-6">
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

        {/* Tabs */}
        <div className="mt-6 flex gap-1 border-b border-gray-200">
          {tabs
            .filter((t) => t.show)
            .map((t) => (
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
        <div className="mt-4">
          {tab === "summary" && (
            <SummaryDisplay
              summary={visit.ai_summary}
              structuredCard={visit.ai_structured_card}
            />
          )}

          {tab === "transcript" && <TranscriptView messages={transcript} />}

          {tab === "diagnostic" && visit.ai_diagnostic && (
            <AIDiagnosticPanel diagnostic={visit.ai_diagnostic} />
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

          {tab === "addendums" && (
            <div className="space-y-3">
              {addendums.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <AddendumBadge createdAt={a.created_at} />
                  <p className="mt-2 text-sm text-ink whitespace-pre-wrap">
                    {a.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {tab === "history" && (
            <VisitHistoryAccordion patientId={patient.id} />
          )}

          {tab === "referrals" && <ReferralHistory />}
        </div>
      </div>

      {/* Action bar */}
      {canAct && (
        <div className="fixed bottom-0 inset-x-0 border-t border-gray-200 bg-white px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            <button
              onClick={() => setShowDiagnosis(true)}
              className="flex-1 rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Complete Visit
            </button>
            <button
              onClick={handleCancelClaim}
              disabled={cancelling}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-slate hover:bg-gray-50 disabled:opacity-50"
            >
              {cancelling ? "Releasing..." : "Cancel Claim"}
            </button>
            <button
              onClick={() => setShowReferral(true)}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-slate hover:bg-gray-50 transition-colors"
            >
              Refer
            </button>
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
    </div>
  );
}
