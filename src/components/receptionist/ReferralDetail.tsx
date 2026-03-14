"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  fetchReferralDetail,
  linkReferralToVisit,
  completeReferral,
  reactivateReferral,
} from "@/app/(dashboard)/d/_actions/referral";
import ReferralStatusTracker from "@/components/doctor/ReferralStatusTracker";

interface ReferralMeta {
  id: string;
  from_org_name: string;
  from_doctor_name: string;
  specialty: string;
  status: string;
  referral_note: string;
  patient_name: string;
  patient_birthday: string;
  created_at: string;
}

interface VisitMessage {
  role: string;
  content: string;
}

interface VisitNote {
  content: string;
  author_name: string;
  created_at: string;
}

interface IncludedVisit {
  id: string;
  completed_at: string;
  ai_summary: string | null;
  doctor_diagnosis: string | null;
  ai_diagnostic: Record<string, unknown> | null;
  transcript: VisitMessage[];
  notes: VisitNote[];
}

interface ReferralDetailProps {
  referralId: string;
  locationId: string;
}

export default function ReferralDetail({
  referralId,
  locationId,
}: ReferralDetailProps) {
  const [referral, setReferral] = useState<ReferralMeta | null>(null);
  const [visits, setVisits] = useState<IncludedVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkVisitId, setLinkVisitId] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchReferralDetail(referralId);
    if (result.success) {
      setReferral(result.referral ?? null);
      setVisits(result.visits ?? []);
    }
    setLoading(false);
  }, [referralId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleLinkToVisit() {
    const trimmed = linkVisitId.trim();
    if (!trimmed) {
      toast.error("Please enter a visit ID");
      return;
    }

    setActionLoading("link");
    const result = await linkReferralToVisit(referralId, trimmed);
    setActionLoading(null);

    if (result.success) {
      toast.success("Referral linked to visit");
      setShowLinkInput(false);
      setLinkVisitId("");
      load();
    } else {
      toast.error(result.error || "Failed to link referral");
    }
  }

  async function handleComplete() {
    setActionLoading("complete");
    const result = await completeReferral(referralId);
    setActionLoading(null);

    if (result.success) {
      toast.success("Referral marked as completed");
      load();
    } else {
      toast.error(result.error || "Failed to complete referral");
    }
  }

  async function handleReactivate() {
    setActionLoading("reactivate");
    const result = await reactivateReferral(referralId);
    setActionLoading(null);

    if (result.success) {
      toast.success("Referral reactivated");
      load();
    } else {
      toast.error(result.error || "Failed to reactivate referral");
    }
  }

  if (loading) {
    return <p className="text-sm text-ash py-4">Loading...</p>;
  }

  if (!referral) {
    return <p className="text-sm text-red-600 py-4">Failed to load referral details.</p>;
  }

  const canLink = referral.status === "sent" || referral.status === "viewed";
  const canComplete = referral.status === "patient_arrived";
  const canReactivate = referral.status === "expired";

  return (
    <div className="space-y-4">
      {/* Referral metadata */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="text-xs font-medium text-ash">From Clinic</span>
            <p className="text-ink">{referral.from_org_name}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-ash">Referring Doctor</span>
            <p className="text-ink">Dr. {referral.from_doctor_name}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-ash">Specialty</span>
            <p className="text-ink">{referral.specialty}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-ash">Created</span>
            <p className="text-ink">
              {new Date(referral.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Patient info */}
      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <h4 className="text-xs font-semibold text-ash uppercase tracking-wide mb-2">
          Patient
        </h4>
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-xs text-ash">Name</span>
            <p className="font-medium text-ink">{referral.patient_name}</p>
          </div>
          <div>
            <span className="text-xs text-ash">Birthday</span>
            <p className="font-medium text-ink">{referral.patient_birthday}</p>
          </div>
        </div>
      </div>

      {/* Referral note */}
      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <h4 className="text-xs font-semibold text-ash uppercase tracking-wide mb-2">
          Referral Note
        </h4>
        <p className="text-sm text-ink whitespace-pre-wrap">
          {referral.referral_note}
        </p>
      </div>

      {/* Status tracker */}
      <ReferralStatusTracker status={referral.status} />

      {/* Included visits */}
      {visits.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-ash uppercase tracking-wide">
            Included Visits ({visits.length})
          </h4>
          {visits.map((visit) => (
            <div
              key={visit.id}
              className="rounded-lg border border-gray-200 bg-white p-3 space-y-3"
            >
              <p className="text-xs font-medium text-slate">
                Visit on{" "}
                {new Date(visit.completed_at).toLocaleDateString()}
              </p>

              {visit.ai_summary && (
                <div>
                  <p className="text-xs font-medium text-ash mb-1">Summary</p>
                  <p className="text-sm text-ink whitespace-pre-wrap">
                    {visit.ai_summary}
                  </p>
                </div>
              )}

              {visit.doctor_diagnosis && (
                <div>
                  <p className="text-xs font-medium text-ash mb-1">Diagnosis</p>
                  <p className="text-sm text-ink">{visit.doctor_diagnosis}</p>
                </div>
              )}


              {visit.transcript && visit.transcript.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-ash mb-1">
                    Transcript Preview
                  </p>
                  <div className="space-y-1.5">
                    {visit.transcript.slice(0, 5).map((msg, idx) => (
                      <div
                        key={idx}
                        className={`rounded-lg px-2.5 py-1.5 text-xs ${
                          msg.role === "assistant"
                            ? "bg-gray-50 text-slate"
                            : "bg-blue-50 text-blue-900"
                        }`}
                      >
                        <span className="font-medium">
                          {msg.role === "assistant" ? "AI" : "Patient"}:
                        </span>{" "}
                        {msg.content}
                      </div>
                    ))}
                    {visit.transcript.length > 5 && (
                      <p className="text-[10px] text-ash">
                        +{visit.transcript.length - 5} more messages
                      </p>
                    )}
                  </div>
                </div>
              )}

              {visit.notes && visit.notes.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-ash mb-1">Notes</p>
                  <div className="space-y-1.5">
                    {visit.notes.map((note, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs text-slate"
                      >
                        <span className="font-medium">{note.author_name}:</span>{" "}
                        {note.content}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {(canLink || canComplete || canReactivate) && (
        <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
          {canLink && (
            <>
              {showLinkInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter visit ID..."
                    value={linkVisitId}
                    onChange={(e) => setLinkVisitId(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-ink placeholder:text-ash focus:border-hilt-blue focus:ring-1 focus:ring-hilt-blue"
                  />
                  <button
                    onClick={handleLinkToVisit}
                    disabled={actionLoading === "link"}
                    className="rounded-lg bg-hilt-blue px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading === "link" ? "Linking..." : "Link"}
                  </button>
                  <button
                    onClick={() => {
                      setShowLinkInput(false);
                      setLinkVisitId("");
                    }}
                    className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLinkInput(true)}
                  className="w-full rounded-lg bg-hilt-blue px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Link to Visit
                </button>
              )}
            </>
          )}

          {canComplete && (
            <button
              onClick={handleComplete}
              disabled={actionLoading === "complete"}
              className="w-full rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {actionLoading === "complete" ? "Completing..." : "Complete"}
            </button>
          )}

          {canReactivate && (
            <button
              onClick={handleReactivate}
              disabled={actionLoading === "reactivate"}
              className="w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
            >
              {actionLoading === "reactivate"
                ? "Reactivating..."
                : "Reactivate"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
