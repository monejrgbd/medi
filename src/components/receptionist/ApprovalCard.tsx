"use client";

import { useState } from "react";
import { fetchSimilarPatients, editPatientRecord } from "@/app/(dashboard)/d/_actions/receptionist";
import FollowUpIndicator from "./FollowUpIndicator";

interface FollowUpInfo {
  id: string;
  doctor_name: string;
  due_at: string;
  ai_instructions_preview: string | null;
  visit_id: string;
  visit_date: string;
  visit_summary_preview: string | null;
}

interface ReferralMatch {
  referral_id: string;
  specialty: string;
  from_org_name: string;
  from_doctor_name: string;
}

interface PendingVisit {
  visit_id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  birthday: string;
  sex?: string;
  created_at: string;
  has_previous_visits: boolean;
  match_type: string;
  phone_verified?: boolean;
  phone_masked?: string | null;
  phone_verification_pending?: boolean;
  active_follow_ups: FollowUpInfo[];
  referral_match?: ReferralMatch | null;
  self_reported_referral?: boolean;
  self_reported_referrer?: string | null;
}

interface SimilarPatient {
  patient_id: string;
  first_name: string;
  last_name: string;
  birthday: string;
  similarity_score: number;
}

type AiConfig = "standard" | "skip" | "premium";

interface ApprovalCardProps {
  visit: PendingVisit;
  orgId: string;
  onApprove: (visitId: string, followUpInfo?: { followUpOfVisitId: string; followUpId: string }, aiConfig?: AiConfig) => void;
  onDeny: (visitId: string) => void;
  approving: boolean;
  denying: boolean;
  aiAutoSkipped?: boolean;
  hasPremiumAi?: boolean;
}

export default function ApprovalCard({
  visit,
  orgId,
  onApprove,
  onDeny,
  approving,
  denying,
  aiAutoSkipped,
  hasPremiumAi,
}: ApprovalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [similarPatients, setSimilarPatients] = useState<SimilarPatient[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  const [aiConfig, setAiConfig] = useState<AiConfig>("standard");
  const [showAiOptions, setShowAiOptions] = useState(false);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editFirst, setEditFirst] = useState(visit.first_name);
  const [editLast, setEditLast] = useState(visit.last_name);
  const [editBirthday, setEditBirthday] = useState(visit.birthday);
  const [editSex, setEditSex] = useState(visit.sex || "");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Display values (updated after successful edit)
  const [displayFirst, setDisplayFirst] = useState(visit.first_name);
  const [displayLast, setDisplayLast] = useState(visit.last_name);
  const [displayBirthday, setDisplayBirthday] = useState(visit.birthday);
  const [displaySex, setDisplaySex] = useState(visit.sex || "");

  async function handleExpand() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (similarPatients.length > 0) return;

    setLoadingSimilar(true);
    const result = await fetchSimilarPatients(
      orgId,
      visit.first_name,
      visit.last_name,
      visit.birthday
    );
    if (result.success && result.patients) {
      setSimilarPatients(
        result.patients.filter(
          (p: SimilarPatient) => p.patient_id !== visit.patient_id
        )
      );
    }
    setLoadingSimilar(false);
  }

  function handleEditStart() {
    setEditFirst(displayFirst);
    setEditLast(displayLast);
    setEditBirthday(displayBirthday);
    setEditSex(displaySex);
    setEditError("");
    setEditing(true);
  }

  function handleEditCancel() {
    setEditing(false);
    setEditError("");
  }

  async function handleEditSave() {
    setEditError("");
    const trimFirst = editFirst.trim();
    const trimLast = editLast.trim();

    if (!trimFirst || !trimLast) {
      setEditError("Name cannot be empty.");
      return;
    }
    if (!editBirthday) {
      setEditError("Birthday is required.");
      return;
    }

    // Only send changed fields
    const changedFirst = trimFirst !== displayFirst ? trimFirst : undefined;
    const changedLast = trimLast !== displayLast ? trimLast : undefined;
    const changedBirthday = editBirthday !== displayBirthday ? editBirthday : undefined;
    const changedSex = editSex !== displaySex ? (editSex || undefined) : undefined;

    if (!changedFirst && !changedLast && !changedBirthday && !changedSex) {
      setEditing(false);
      return;
    }

    setEditLoading(true);
    const result = await editPatientRecord(
      visit.patient_id,
      changedFirst,
      changedLast,
      changedBirthday,
      changedSex
    );
    setEditLoading(false);

    if (!result.success) {
      setEditError(result.error ?? "Failed to update patient.");
      return;
    }

    // Update display values
    setDisplayFirst(trimFirst);
    setDisplayLast(trimLast);
    setDisplayBirthday(editBirthday);
    setDisplaySex(editSex);
    setEditing(false);
  }

  const isReturning = visit.match_type === "returning";
  const busy = approving || denying || editing;
  const isPending = visit.phone_verification_pending;
  const noPhone = !visit.phone_masked && !isPending;

  // Determine badge
  let badgeLabel = isReturning ? "RETURNING" : "NEW";
  let badgeClass = isReturning
    ? "bg-blue-100 text-blue-800"
    : "bg-green-100 text-green-800";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editFirst}
                  onChange={(e) => setEditFirst(e.target.value)}
                  placeholder="First name"
                  className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-hilt-blue focus:outline-none"
                />
                <input
                  type="text"
                  value={editLast}
                  onChange={(e) => setEditLast(e.target.value)}
                  placeholder="Last name"
                  className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-hilt-blue focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={editBirthday}
                  onChange={(e) => setEditBirthday(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-hilt-blue focus:outline-none"
                />
                <select
                  value={editSex}
                  onChange={(e) => setEditSex(e.target.value)}
                  className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-hilt-blue focus:outline-none"
                >
                  <option value="">Sex</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {editError && (
                <p className="text-xs text-red-600">{editError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleEditSave}
                  disabled={editLoading}
                  className="rounded-lg bg-hilt-blue px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {editLoading ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleEditCancel}
                  disabled={editLoading}
                  className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-slate hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-ink">
                  {displayFirst} {displayLast}
                </h3>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}
                >
                  {badgeLabel}
                </span>
                <button
                  onClick={handleEditStart}
                  disabled={approving || denying}
                  className="text-ash hover:text-ink transition-colors disabled:opacity-50"
                  title="Edit patient info"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-slate">DOB: {displayBirthday}{displaySex ? ` · ${displaySex}` : ""}</p>
              {visit.phone_masked && (
                <p className="text-xs text-ash mt-0.5">Phone: {visit.phone_masked}</p>
              )}
            </>
          )}
        </div>
        {!editing && (
          <p className="text-xs text-ash">
            {new Date(visit.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      {/* Informational phone badges */}
      {isPending && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-hilt-blue" />
          <span className="text-xs text-blue-700">Verifying phone...</span>
        </div>
      )}
      {noPhone && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
          <span className="text-xs text-gray-500">No phone on file</span>
        </div>
      )}

      {!isReturning && (
        <button
          onClick={handleExpand}
          className="mb-3 text-xs text-hilt-blue hover:underline"
        >
          {expanded ? "Hide" : "Show"} similar patients
        </button>
      )}

      {expanded && (
        <div className="mb-3 rounded-lg bg-gray-50 p-3">
          {loadingSimilar ? (
            <p className="text-xs text-ash">Loading...</p>
          ) : similarPatients.length === 0 ? (
            <p className="text-xs text-ash">No similar patients found.</p>
          ) : (
            <div className="space-y-1">
              <p className="text-xs font-medium text-ink mb-1">
                Similar patients in system:
              </p>
              {similarPatients.map((p) => (
                <div
                  key={p.patient_id}
                  className="flex justify-between text-xs text-slate"
                >
                  <span>
                    {p.first_name} {p.last_name} — {p.birthday}
                  </span>
                  <span className="text-ash">
                    {Math.round(p.similarity_score * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Follow-up indicator */}
      <FollowUpIndicator followUps={visit.active_follow_ups || []} />

      {/* Referral match indicator */}
      {visit.referral_match && (
        <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-2.5">
          <p className="text-xs font-medium text-blue-800">
            Referral from {visit.referral_match.from_org_name} ({visit.referral_match.specialty})
          </p>
          <p className="text-xs text-blue-600">
            Dr. {visit.referral_match.from_doctor_name}
          </p>
        </div>
      )}

      {visit.self_reported_referral && !visit.referral_match && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
          <p className="text-xs font-medium text-amber-800">
            Patient reports being referred
          </p>
          {visit.self_reported_referrer && (
            <p className="text-xs text-amber-600">
              By: {visit.self_reported_referrer}
            </p>
          )}
        </div>
      )}

      {!editing && (
      <div className="flex flex-col gap-2">
        {/* Primary action buttons */}
        {(visit.active_follow_ups || []).length > 0 ? (
          // Has follow-ups: show follow-up buttons + new visit button
          <>
            {visit.active_follow_ups.map((fu) => (
              <button
                key={fu.id}
                onClick={() => onApprove(visit.visit_id, { followUpOfVisitId: fu.visit_id, followUpId: fu.id })}
                disabled={busy}
                className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {approving ? "Approving..." : `Follow-up (Dr. ${fu.doctor_name})`}
              </button>
            ))}
            <div className="flex gap-2">
              <button
                onClick={() => onApprove(visit.visit_id)}
                disabled={busy}
                className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                {approving ? "Approving..." : "New Visit"}
              </button>
              <button
                onClick={() => onDeny(visit.visit_id)}
                disabled={busy}
                className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                {denying ? "Denying..." : "Deny"}
              </button>
            </div>
          </>
        ) : (
          // Default: configure AI + approve/deny
          <>
          {!aiAutoSkipped && (
            <div className="mb-2">
              <button
                onClick={() => setShowAiOptions((prev) => !prev)}
                disabled={busy}
                className="text-xs text-slate hover:text-ink transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Configure AI
                {aiConfig !== "standard" && (
                  <span className={`ml-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                    aiConfig === "skip" ? "bg-gray-100 text-gray-600" : "bg-purple-100 text-purple-700"
                  }`}>
                    {aiConfig === "skip" ? "Skipping" : "Premium"}
                  </span>
                )}
              </button>

              {showAiOptions && (
                <div className="mt-1.5 flex gap-1.5">
                  <button
                    onClick={() => setAiConfig("standard")}
                    disabled={busy}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      aiConfig === "standard"
                        ? "bg-green-100 text-green-700 ring-1 ring-green-300"
                        : "bg-gray-50 text-slate hover:bg-gray-100"
                    }`}
                  >
                    Standard AI
                  </button>
                  <button
                    onClick={() => setAiConfig("skip")}
                    disabled={busy}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      aiConfig === "skip"
                        ? "bg-gray-200 text-gray-700 ring-1 ring-gray-400"
                        : "bg-gray-50 text-slate hover:bg-gray-100"
                    }`}
                  >
                    Skip AI
                  </button>
                  {hasPremiumAi && (
                    <button
                      onClick={() => setAiConfig("premium")}
                      disabled={busy}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                        aiConfig === "premium"
                          ? "bg-purple-100 text-purple-700 ring-1 ring-purple-300"
                          : "bg-gray-50 text-slate hover:bg-gray-100"
                      }`}
                    >
                      Premium AI
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => onApprove(visit.visit_id, undefined, aiConfig)}
              disabled={busy}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                aiConfig === "premium"
                  ? "bg-purple-600 hover:bg-purple-700"
                  : aiConfig === "skip"
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {approving
                ? "Approving..."
                : aiConfig === "premium"
                  ? "Approve (Premium AI)"
                  : aiConfig === "skip"
                    ? "Approve (No AI)"
                    : "Approve"}
            </button>
            <button
              onClick={() => onDeny(visit.visit_id)}
              disabled={busy}
              className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              {denying ? "Denying..." : "Deny"}
            </button>
          </div>
          </>
        )}

      </div>
      )}
    </div>
  );
}
