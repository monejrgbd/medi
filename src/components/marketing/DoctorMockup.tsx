"use client";

import { useState } from "react";

type Tab = "summary" | "transcript" | "notes" | "vitals" | "vaccines" | "history";

const TABS: { key: Tab; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "transcript", label: "Transcript" },
  { key: "notes", label: "Notes" },
  { key: "vitals", label: "Vitals (5)" },
  { key: "vaccines", label: "Vaccines (1)" },
  { key: "history", label: "History" },
];

function SummaryTab() {
  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[10px] font-semibold text-ink">AI Summary</p>
          <p className="text-[9px] text-ash">6 min conversation</p>
        </div>
        <p className="text-[11px] leading-relaxed text-ink">
          Returning patient, previously seen for right knee pain. Now reports bilateral knee involvement and morning stiffness in hands lasting approximately 1 hour daily, with knuckle swelling. Ibuprofen provides partial relief. Reports recent fatigue. Family history of rheumatoid arthritis (mother).
        </p>
      </div>
      <p className="mt-2 text-[9px] italic text-ash">
        AI generated summary approved by patient at 9:09 AM.
      </p>
    </>
  );
}

function TranscriptTab() {
  const messages = [
    { role: "ai", text: "Hi Sarah, welcome back! Last time you came in for knee pain. Is today\u2019s visit related?", time: "9:03" },
    { role: "patient", text: "ya its worse now... my hands r stiff every morning too idk whats going on", time: "9:04" },
    { role: "ai", text: "I am sorry to hear that. How long does the morning stiffness in your hands usually last?", time: "9:04" },
    { role: "patient", text: "like an hour maybe? sometimes more. its hard to even open jars now", time: "9:05" },
    { role: "ai", text: "That is helpful to know. Have you noticed any swelling or redness in your joints?", time: "9:05" },
    { role: "patient", text: "my knuckles look swollen ya, my husband pointed it out. the knee is also more puffy than before", time: "9:06" },
    { role: "ai", text: "Are you still taking ibuprofen? Is it helping with these new symptoms?", time: "9:06" },
    { role: "patient", text: "ya i take it for the knee still but it doesnt do much for my hands honestly", time: "9:07" },
    { role: "ai", text: "Have you had any fever, fatigue, or unexplained weight changes recently?", time: "9:07" },
    { role: "patient", text: "now that u mention it ive been really tired lately. i thought it was just work stress", time: "9:07" },
    { role: "ai", text: "That is important context. Any family history of arthritis or autoimmune conditions?", time: "9:08" },
    { role: "patient", text: "my mom has rheumatoid arthritis actually... do u think thats what this is??", time: "9:08" },
    { role: "ai", text: "That is something your doctor will assess. I want to make sure they have all the details. Is there anything else you would like to mention?", time: "9:08" },
    { role: "patient", text: "no i think thats everything. i just want to know whats going on with my body", time: "9:09" },
  ];

  return (
    <div>
      <p className="mb-2 text-[9px] text-ash">9:03 AM to 9:09 AM · 6 minutes · 14 messages</p>
      <div className="space-y-1.5">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "patient" ? "ml-4" : ""}>
            <div className={`rounded-lg px-2.5 py-1.5 ${m.role === "ai" ? "bg-gray-50" : "bg-hilt-blue/5"}`}>
              <p className="text-[10px] leading-relaxed text-ink">{m.text}</p>
            </div>
            <p className={`mt-0.5 text-[8px] text-ash ${m.role === "patient" ? "text-right" : ""}`}>{m.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotesTab() {
  return (
    <div className="space-y-2.5">
      <div className="rounded-lg border border-gray-200 bg-white p-2.5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-medium text-ink">Dr. Patel</p>
          <p className="text-[9px] text-ash">Today</p>
        </div>
        <p className="text-[10px] leading-relaxed text-slate">
          Bilateral joint symptoms with prolonged morning stiffness suggests inflammatory process. Family hx of RA noted. Order RF, anti-CCP, ESR, CRP. Rheumatology referral if positive.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-gray-200 py-2.5 text-center">
        <p className="text-[10px] text-ash">+ Add note</p>
      </div>
    </div>
  );
}

function VitalsTab() {
  return (
    <div className="space-y-2.5">
      <div className="rounded-lg border border-gray-200 bg-white p-2.5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-medium text-ink">Today, 9:01 AM</p>
          <p className="text-[9px] text-ash">Nurse Amy R.</p>
        </div>
        <div className="space-y-1">
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
      <div className="rounded-lg bg-gray-50 p-2.5">
        <p className="text-[10px] font-medium text-ink mb-1">Jan 15, 2026</p>
        <div className="space-y-1">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] text-slate">Weight</span>
            <span className="text-[10px] text-ink font-medium">67.8 kg</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] text-slate">Blood Pressure</span>
            <span className="text-[10px] text-ink font-medium">122/80 mmHg</span>
          </div>
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
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-medium text-ink">Tdap <span className="text-[9px] text-slate ml-1">Dose #1</span></p>
            <div className="mt-0.5 text-[9px] text-slate">Right Deltoid</div>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-slate">Sep 8, 2025</p>
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

function HistoryTab() {
  const visits = [
    { date: "Jan 15, 2026", summary: "Right knee pain, prescribed ibuprofen, advised rest" },
    { date: "Sep 8, 2025", summary: "Annual physical, all vitals normal" },
    { date: "Mar 10, 2025", summary: "Upper respiratory infection, resolved" },
  ];

  return (
    <div className="space-y-2">
      {visits.map((v, i) => (
        <div key={i} className="rounded-lg bg-gray-50 p-2.5">
          <p className="text-[10px] font-medium text-ink">{v.date}</p>
          <p className="text-[10px] text-slate leading-relaxed">{v.summary}</p>
        </div>
      ))}
    </div>
  );
}

export default function DoctorMockup() {
  const [tab, setTab] = useState<Tab>("summary");
  const [hasInteracted, setHasInteracted] = useState(false);

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-gray-900/5 overflow-hidden">
      {/* Profile card header */}
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-ink">Sarah Martinez</p>
            <p className="text-[11px] text-ash">32 years old</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-[9px] font-medium text-teal-600">Nurse Reviewed</span>
            <span className="text-[10px] text-ash">3 visits</span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5 text-[9px]">
          <div>
            <p className="font-medium text-slate">Meds (1)</p>
            <p className="text-ink">Ibuprofen PRN</p>
          </div>
          <div>
            <p className="font-medium text-red-600">Allergies (1)</p>
            <p className="text-ink">Penicillin</p>
          </div>
          <div>
            <p className="font-medium text-slate">Chronic (0)</p>
            <p className="text-ash">None</p>
          </div>
          <div>
            <p className="font-medium text-slate">Pets (1)</p>
            <p className="text-ink">Cat</p>
          </div>
        </div>
      </div>

      {/* AI Diagnostic Suggestion */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="rounded-lg border border-violet-200/80 bg-gradient-to-r from-violet-50/80 to-white overflow-hidden px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg className="h-3 w-3 text-violet-500" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a.5.5 0 0 1 .473.338L9.82 4.18l3.842 1.347a.5.5 0 0 1 0 .946L9.82 7.82 8.473 11.662a.5.5 0 0 1-.946 0L6.18 7.82 2.338 6.473a.5.5 0 0 1 0-.946L6.18 4.18 7.527.338A.5.5 0 0 1 8 0Z" />
            </svg>
            <span className="text-[9px] font-semibold text-violet-600 uppercase tracking-wider">AI Suggestion</span>
          </div>
          <p className="text-[13px] font-bold text-ink leading-tight">Early Rheumatoid Arthritis</p>
          <p className="mt-1 text-[10px] text-slate leading-relaxed">Bilateral symmetric joint involvement, prolonged morning stiffness, family history of RA, and systemic fatigue are consistent with early inflammatory polyarthritis.</p>
          <p className="mt-1.5 text-[8px] text-slate/50">AI makes mistakes. Use your own clinical judgement.</p>
        </div>
      </div>

      {/* Nurse notes */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="rounded-lg bg-teal-50 border border-teal-200 p-2.5">
          <p className="text-[9px] font-semibold text-teal-800 mb-0.5">Nurse Notes</p>
          <p className="text-[10px] text-ink leading-relaxed">
            Patient appears fatigued. Swelling visible in both knuckles. Range of motion limited in right knee. Vitals within normal range. No fever.
          </p>
        </div>
      </div>

      {/* Tabs + content */}
      <div className="p-4">
        {/* Interactive hint, pulses until user clicks a tab */}
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
                  ? "border-b-2 border-hilt-blue text-hilt-blue"
                  : "text-ash hover:text-slate"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div>
          {tab === "summary" && <SummaryTab />}
          {tab === "transcript" && <TranscriptTab />}
          {tab === "notes" && <NotesTab />}
          {tab === "vitals" && <VitalsTab />}
          {tab === "vaccines" && <VaccinesTab />}
          {tab === "history" && <HistoryTab />}
        </div>
      </div>

      {/* Action bar */}
      <div className="border-t border-gray-100 p-3 flex gap-2">
        <div className="rounded-lg border border-gray-200 px-3 py-1.5 text-center text-[10px] font-medium text-slate">
          Cancel
        </div>
        <div className="flex-1 rounded-lg bg-green-600 py-1.5 text-center text-[10px] font-semibold text-white">
          Complete Visit
        </div>
      </div>
    </div>
  );
}
