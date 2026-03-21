"use client";

import { useState, useEffect } from "react";
import VitalsHistory from "@/components/nurse/VitalsHistory";
import VaccineHistory from "@/components/nurse/VaccineHistory";

interface PatientFullProfileProps {
  data: Record<string, unknown>;
  onClose: () => void;
}

type Tab = "overview" | "visits" | "notes" | "referrals" | "vitals" | "vaccines";

export default function PatientFullProfile({
  data,
  onClose,
}: PatientFullProfileProps) {
  const [tab, setTab] = useState<Tab>("overview");

  // Dismiss on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  const patient = data.patient as Record<string, unknown>;
  const visits = (data.visits || []) as Record<string, unknown>[];
  const notes = (data.notes || []) as Record<string, unknown>[];
  const medications = (data.medications || []) as Record<string, unknown>[];
  const allergies = (data.allergies || []) as Record<string, unknown>[];
  const chronicConditions = (data.chronic_conditions || []) as Record<string, unknown>[];
  const pets = (data.pets || []) as Record<string, unknown>[];
  const referrals = (data.referrals || []) as Record<string, unknown>[];
  const followUps = (data.follow_ups || []) as Record<string, unknown>[];
  const vitals = (data.vitals || []) as Array<{
    id: string;
    value: number;
    vital_name: string;
    vital_unit: string;
    display_order?: number;
    notes: string | null;
    measured_at: string;
    recorded_by_name: string;
  }>;
  const vaccines = (data.vaccines || []) as Array<{
    id: string;
    vaccine_name: string;
    dose_number: number | null;
    lot_number: string | null;
    manufacturer: string | null;
    site: string | null;
    refused: boolean;
    refusal_reason: string | null;
    administered_at: string;
    administered_by_name: string;
  }>;

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: "overview", label: "Overview", show: true },
    { key: "visits", label: `Visits (${visits.length})`, show: true },
    { key: "vitals", label: `Vitals (${vitals.length})`, show: vitals.length > 0 },
    { key: "vaccines", label: `Vaccines (${vaccines.length})`, show: vaccines.length > 0 },
    { key: "notes", label: `Notes (${notes.length})`, show: true },
    { key: "referrals", label: `Referrals (${referrals.length})`, show: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-ink">
              {patient.first_name as string} {patient.last_name as string}
            </h2>
            <p className="text-xs text-slate">
              DOB: {String(patient.birthday)}{patient.sex ? ` | ${String(patient.sex)}` : ""}
              {patient.phone ? ` | ${String(patient.phone)}` : null}
              {patient.language && patient.language !== "en" ? ` | Language: ${String(patient.language)}` : null}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate hover:text-ink transition-colors"
            aria-label="Close patient profile"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-2 border-b border-gray-100 overflow-x-auto">
          {tabs
            .filter((t) => t.show)
            .map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  tab === t.key
                    ? "border-hilt-blue text-hilt-blue"
                    : "border-transparent text-slate hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <InfoSection title="Medications" items={medications} />
                <InfoSection title="Allergies" items={allergies} />
                <InfoSection title="Chronic Conditions" items={chronicConditions} />
                <InfoSection title="Pets at Home" items={pets} />
              </div>

              {followUps.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-ink mb-2">Follow-Ups</h3>
                  <div className="space-y-2">
                    {followUps.map((fu) => (
                      <div key={fu.id as string} className="rounded-lg bg-gray-50 p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-ink">{String(fu.ai_instructions || "")}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            fu.status === "active" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                          }`}>
                            {String(fu.status)}
                          </span>
                        </div>
                        <p className="text-xs text-slate mt-1">
                          Due: {new Date(fu.due_at as string).toLocaleDateString()}
                          {fu.doctor_name ? ` | By: ${String(fu.doctor_name)}` : null}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "visits" && (
            <div className="space-y-3">
              {visits.length === 0 ? (
                <p className="text-sm text-slate text-center py-8">No visits found.</p>
              ) : (
                visits.map((v) => (
                  <div key={v.id as string} className="rounded-lg border border-gray-100 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-ink">
                        {String(v.location_name)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        v.status === "completed" ? "bg-green-100 text-green-700" :
                        v.status === "left" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-slate"
                      }`}>
                        {String(v.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate">
                      {new Date(v.created_at as string).toLocaleDateString()}
                      {v.claimed_by_name ? ` | Dr. ${String(v.claimed_by_name)}` : null}
                    </p>
                    {v.ai_summary ? (
                      <p className="text-xs text-slate mt-1 line-clamp-2">
                        {String(v.ai_summary).slice(0, 150)}...
                      </p>
                    ) : null}
                    {v.doctor_diagnosis ? (
                      <p className="text-xs text-ink mt-1">
                        Dx: {String(v.doctor_diagnosis).slice(0, 100)}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "notes" && (
            <div className="space-y-3">
              {notes.length === 0 ? (
                <p className="text-sm text-slate text-center py-8">No notes found.</p>
              ) : (
                notes.map((n) => (
                  <div key={n.id as string} className="rounded-lg bg-gray-50 p-3">
                    <p className="text-sm text-ink">{String(n.content)}</p>
                    <p className="text-xs text-slate mt-1">
                      {String(n.author_name)} | {new Date(n.created_at as string).toLocaleDateString()}
                      {n.is_private ? (
                        <span className="ml-1 text-amber-600">(Private)</span>
                      ) : null}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "referrals" && (
            <div className="space-y-3">
              {referrals.length === 0 ? (
                <p className="text-sm text-slate text-center py-8">No referrals found.</p>
              ) : (
                referrals.map((r) => (
                  <div key={r.id as string} className="rounded-lg border border-gray-100 p-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-ink">{String(r.specialty)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        r.status === "sent" ? "bg-blue-100 text-blue-700" :
                        r.status === "completed" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-slate"
                      }`}>
                        {String(r.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate mt-1">
                      {r.from_org_name ? `From: ${String(r.from_org_name)}` : null}
                      {r.to_org_name ? ` → ${String(r.to_org_name)}` : null}
                      {` | ${new Date(r.created_at as string).toLocaleDateString()}`}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "vitals" && (
            <VitalsHistory vitals={vitals} />
          )}

          {tab === "vaccines" && (
            <VaccineHistory records={vaccines} />
          )}
        </div>
      </div>
    </div>
  );
}

function InfoSection({
  title,
  items,
}: {
  title: string;
  items: Record<string, unknown>[];
}) {
  const active = items.filter((i) => i.active !== false);
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <h4 className="text-xs font-medium text-ink mb-1">{title}</h4>
      {active.length === 0 ? (
        <p className="text-xs text-slate">None recorded</p>
      ) : (
        <ul className="space-y-0.5">
          {active.map((item, i) => (
            <li key={i} className="text-xs text-slate">
              {item.name as string}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
