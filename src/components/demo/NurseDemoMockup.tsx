"use client";

import { useState } from "react";

type NurseTab = "vitals" | "vaccines" | "notes";

const TABS: { key: NurseTab; label: string }[] = [
  { key: "vitals", label: "Vitals" },
  { key: "vaccines", label: "Vaccines" },
  { key: "notes", label: "Notes" },
];

function VitalsTab() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-medium text-ink">Today, 9:01 AM</p>
        <p className="text-[9px] text-ash">Nurse Amy R.</p>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-slate">Weight</span>
          <span className="text-[10px] text-ink font-medium">68.2 kg</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-slate">Height</span>
          <span className="text-[10px] text-ink font-medium">165.0 cm</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-slate">Blood Pressure</span>
          <span className="text-[10px] text-ink font-medium">118/76 mmHg</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-slate">Heart Rate</span>
          <span className="text-[10px] text-ink font-medium">72 bpm</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-slate">Temperature</span>
          <span className="text-[10px] text-ink font-medium">98.4 F</span>
        </div>
      </div>
    </div>
  );
}

function VaccinesTab() {
  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-medium text-ink">Influenza (Seasonal)</p>
            <div className="mt-0.5 flex items-center gap-2 text-[9px] text-slate">
              <span>Lot: FL2026A</span>
              <span>Sanofi</span>
              <span>Left Deltoid</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-slate">Today</p>
            <p className="text-[8px] text-ash">Nurse Amy R.</p>
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-red-100 bg-red-50/50 p-2">
        <p className="text-[9px] font-medium text-red-700">Overdue</p>
        <p className="text-[10px] text-ink">Hepatitis B <span className="text-[9px] text-slate">Dose #2, due Dec 8, 2025</span></p>
      </div>
    </div>
  );
}

function NotesTab() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <textarea
        readOnly
        value="Patient appears fatigued. Swelling visible in both knuckles. Range of motion limited in right knee."
        className="w-full text-[10px] text-ink leading-relaxed bg-transparent resize-none border-0 p-0 focus:ring-0"
        rows={3}
      />
    </div>
  );
}

export default function NurseDemoMockup() {
  const [tab, setTab] = useState<NurseTab>("vitals");
  const [hasInteracted, setHasInteracted] = useState(false);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-gray-900/5 overflow-hidden">
        {/* Patient header */}
        <div className="border-b border-gray-100 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-ink">Sarah Martinez</p>
              <p className="text-[11px] text-ash">32 years old</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-[9px] font-medium text-teal-600">
              Nurse Reviewed
            </span>
          </div>
        </div>

        {/* Tabs + content */}
        <div className="p-4">
          {!hasInteracted && (
            <p className="mb-2 text-center text-[9px] text-hilt-blue animate-pulse">
              Click the tabs to explore
            </p>
          )}

          <div className="mb-3 flex gap-2 border-b border-gray-100 text-[10px] overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setHasInteracted(true); }}
                className={`pb-1.5 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  tab === t.key
                    ? "border-b-2 border-teal-500 text-teal-600"
                    : "text-ash hover:text-slate"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div>
            {tab === "vitals" && <VitalsTab />}
            {tab === "vaccines" && <VaccinesTab />}
            {tab === "notes" && <NotesTab />}
          </div>
        </div>

        {/* Action bar */}
        <div className="border-t border-gray-100 p-3 flex gap-2">
          <div className="flex-1 rounded-lg bg-teal-600 py-1.5 text-center text-[10px] font-semibold text-white">
            Complete Triage
          </div>
          <div className="rounded-lg border border-teal-600 px-3 py-1.5 text-center text-[10px] font-medium text-teal-600">
            Continue to Doctor
          </div>
        </div>
      </div>
    </div>
  );
}
