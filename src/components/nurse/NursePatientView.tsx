"use client";

import { useState, useEffect } from "react";
import { fetchVisitDetail } from "@/app/(dashboard)/d/_actions/doctor";
import PatientProfileCard from "@/components/doctor/PatientProfileCard";
import TranscriptView from "@/components/doctor/TranscriptView";
import SummaryDisplay from "@/components/doctor/SummaryDisplay";
import VitalsForm from "./VitalsForm";
import VitalsHistory from "./VitalsHistory";
import VaccineRecordForm from "./VaccineRecordForm";
import VaccineHistory from "./VaccineHistory";
import VaccineScheduleView from "./VaccineScheduleView";
import NurseReleaseDialog from "./NurseReleaseDialog";
import NurseCompleteDialog from "./NurseCompleteDialog";
import { fetchVitalsHistory, fetchVaccineHistory } from "@/app/(dashboard)/d/_actions/nurse";

interface NursePatientViewProps {
  visitId: string;
  patientName: string;
  onBack: () => void;
  onComplete: () => void;
}

interface VisitDetail {
  visit: {
    id: string;
    status: string;
    ai_summary: string | null;
    ai_structured_card: Record<string, unknown> | null;
    priority: number;
    is_sensitive: boolean;
    timeout_flagged: boolean;
    ai_skipped: boolean;
    created_at: string;
    claimed_at: string | null;
    is_follow_up: boolean;
  };
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    birthday: string;
    sex?: string;
    phone_masked: string | null;
    medications: { name: string }[];
    allergies: { name: string }[];
    chronic_conditions: { name: string }[];
    visit_count: number;
    last_visit_date: string | null;
    last_visit_summary: string | null;
  };
  transcript: { id: string; role: string; content: string; created_at: string }[];
}

interface VitalRecord {
  id: string;
  value: number;
  vital_name: string;
  vital_unit: string;
  display_order?: number;
  notes: string | null;
  measured_at: string;
  recorded_by_name: string;
}

interface VaccineRecord {
  id: string;
  vaccine_name: string;
  dose_number: number | null;
  lot_number: string | null;
  manufacturer: string | null;
  site: string | null;
  refused: boolean;
  refusal_reason: string | null;
  notes: string | null;
  administered_at: string;
  administered_by_name: string;
}

type Section = "summary" | "transcript" | "vitals" | "vaccines";

export default function NursePatientView({
  visitId,
  patientName,
  onBack,
  onComplete,
}: NursePatientViewProps) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<VisitDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<Section>("summary");
  const [nurseNotes, setNurseNotes] = useState("");
  const [showRelease, setShowRelease] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [vaccineRecords, setVaccineRecords] = useState<VaccineRecord[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await fetchVisitDetail(visitId);
      if (result.success && result.data) {
        setDetail(result.data);
        // Load vitals and vaccine history
        const [vitalsRes, vaccineRes] = await Promise.all([
          fetchVitalsHistory(result.data.patient.id),
          fetchVaccineHistory(result.data.patient.id),
        ]);
        if (vitalsRes.success) setVitals(vitalsRes.vitals ?? []);
        if (vaccineRes.success) setVaccineRecords(vaccineRes.vaccines ?? []);
      } else {
        setError(result.error || "Failed to load visit details");
      }
      setLoading(false);
    }
    load();
  }, [visitId]);

  async function refreshVitals() {
    if (!detail) return;
    const res = await fetchVitalsHistory(detail.patient.id);
    if (res.success) setVitals(res.vitals ?? []);
  }

  async function refreshVaccines() {
    if (!detail) return;
    const res = await fetchVaccineHistory(detail.patient.id);
    if (res.success) setVaccineRecords(res.vaccines ?? []);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-teal-200 border-t-teal-600" />
          <p className="mt-3 text-sm text-slate">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-4">{error || "Visit not found"}</p>
          <button
            onClick={onBack}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Back to queue
          </button>
        </div>
      </div>
    );
  }

  const { visit, patient, transcript } = detail;

  const sections: { key: Section; label: string }[] = [
    { key: "summary", label: "Summary" },
    { key: "vitals", label: "Vitals" },
    { key: "vaccines", label: "Vaccines" },
    { key: "transcript", label: "Transcript" },
  ];

  return (
    <div className="min-h-screen bg-snow pb-28">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-sm text-slate hover:text-ink transition-colors"
          >
            &larr; Back to queue
          </button>
          <span className="text-xs text-teal-600 font-medium">Nurse View</span>
        </div>
      </div>

      {/* Timeout warning */}
      {visit.timeout_flagged && (
        <div className="mx-4 mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 lg:mx-6">
          <p className="text-sm text-amber-800">
            Patient took more than 30 mins. Transcript may be incomplete.
            Please ask follow up questions directly.
          </p>
        </div>
      )}

      {/* Follow-up badge */}
      {visit.is_follow_up && (
        <div className="mx-4 mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 lg:mx-6">
          <p className="text-sm font-medium text-blue-800">
            Follow up visit
          </p>
        </div>
      )}

      <div className="px-4 py-4 lg:px-6">
        {/* Patient profile */}
        <PatientProfileCard patient={patient} />

        {/* AI Skipped badge */}
        {visit.ai_skipped && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-medium text-amber-800">AI intake was skipped for this visit</p>
          </div>
        )}

        {/* AI Summary quick look */}
        {!visit.ai_skipped && visit.ai_summary && (
          <div className="mt-4 rounded-lg border border-teal-100 bg-teal-50 p-4">
            <h3 className="text-sm font-semibold text-teal-800 mb-1">AI Summary</h3>
            <p className="text-sm text-teal-900 whitespace-pre-wrap line-clamp-4">{visit.ai_summary}</p>
          </div>
        )}

        {/* Transcript toggle (hidden when AI skipped) */}
        {!visit.ai_skipped && <button
          onClick={() => setTranscriptOpen(!transcriptOpen)}
          className="mt-4 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate hover:bg-gray-50 transition-colors flex items-center justify-between"
        >
          <span>Full Transcript ({transcript.length} messages)</span>
          <svg
            className={`h-4 w-4 transition-transform ${transcriptOpen ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>}
        {!visit.ai_skipped && transcriptOpen && (
          <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4">
            <TranscriptView messages={transcript} />
          </div>
        )}

        {/* Section tabs */}
        <div className="mt-6 flex gap-1 border-b border-gray-200">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                section === s.key
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-slate hover:text-ink"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Section content */}
        <div className="mt-4">
          {section === "summary" && (
            <SummaryDisplay
              summary={visit.ai_summary}
              structuredCard={visit.ai_structured_card}
            />
          )}

          {section === "vitals" && (
            <div className="space-y-6">
              <VitalsForm
                patientId={patient.id}
                visitId={visit.id}
                onRecorded={refreshVitals}
              />
              <VitalsHistory vitals={vitals} />
            </div>
          )}

          {section === "vaccines" && (
            <div className="space-y-6">
              <VaccineRecordForm
                patientId={patient.id}
                visitId={visit.id}
                onRecorded={refreshVaccines}
              />
              <VaccineHistory records={vaccineRecords} />
              <VaccineScheduleView patientId={patient.id} />
            </div>
          )}

          {section === "transcript" && (
            <TranscriptView messages={transcript} />
          )}
        </div>

        {/* Nurse Notes */}
        <div className="mt-6">
          <label className="text-sm font-medium text-ink">Nurse Notes</label>
          <textarea
            value={nurseNotes}
            onChange={(e) => setNurseNotes(e.target.value)}
            placeholder="Add any notes about vitals, observations, or instructions for the doctor..."
            rows={4}
            maxLength={10000}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink placeholder:text-ash focus:border-teal-500 focus:outline-none resize-y"
          />
          <p className="mt-0.5 text-right text-[10px] text-ash">
            {nurseNotes.length.toLocaleString()} / 10,000
          </p>
        </div>
      </div>

      {/* Action bar */}
      <div className="fixed bottom-0 inset-x-0 border-t border-gray-200 bg-white px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <button
            onClick={() => setShowComplete(true)}
            className="flex-1 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            Complete Visit
          </button>
          <button
            onClick={() => setShowRelease(true)}
            className="flex-1 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-medium text-teal-700 hover:bg-teal-100 transition-colors"
          >
            Continue to Doctor
          </button>
        </div>
      </div>

      {/* Release dialog */}
      {showRelease && (
        <NurseReleaseDialog
          visitId={visit.id}
          initialNotes={nurseNotes}
          onClose={() => setShowRelease(false)}
          onComplete={onComplete}
        />
      )}

      {/* Complete dialog */}
      {showComplete && (
        <NurseCompleteDialog
          visitId={visit.id}
          onClose={() => setShowComplete(false)}
          onComplete={onComplete}
        />
      )}
    </div>
  );
}
