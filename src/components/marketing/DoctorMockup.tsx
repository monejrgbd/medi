"use client";

import { useState } from "react";

type Tab = "summary" | "transcript" | "notes" | "paperwork" | "vitals" | "vaccines" | "history";

const TABS: { key: Tab; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "transcript", label: "Transcript" },
  { key: "notes", label: "Notes" },
  { key: "paperwork", label: "Documents (3)" },
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
          Returning patient with worsening knee pain, new morning stiffness in hands lasting about 1 hour, and knuckle swelling. Ibuprofen provides partial relief. Fatigue reported. Family history of rheumatoid arthritis.
        </p>
      </div>
      <p className="mt-2 text-[9px] italic text-ash">
        AI generated summary approved by patient at 9:09 AM.
      </p>
    </>
  );
}

function TranscriptTab({ defaultScribe = false }: { defaultScribe?: boolean }) {
  const [sub, setSub] = useState<"chat" | "form" | "scribe">(
    defaultScribe ? "scribe" : "chat"
  );

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

  const formRows: { label: string; value: string; alert?: boolean }[] = [
    { label: "Medications", value: "Ibuprofen (as needed)" },
    { label: "Allergies", value: "Penicillin", alert: true },
    { label: "Pets", value: "Cat" },
    { label: "Chronic conditions", value: "None reported" },
    { label: "Pregnant", value: "No" },
    { label: "Recent travel", value: "No" },
  ];

  const scribe = [
    { sp: "A", text: "Good morning Sarah, I have read the intake. Let me take a look at those hands." },
    { sp: "B", text: "Thanks. The morning stiffness is the worst part, it is lasting over an hour now." },
    { sp: "A", text: "I can see swelling across the knuckles, and the right knee feels warm. Tender when I press here?" },
    { sp: "B", text: "Yes, that is sore. It has been getting harder to grip things at work." },
    { sp: "A", text: "Given the symmetry, the prolonged morning stiffness, and the family history, I want to run RF, anti CCP, ESR and CRP today, and start a short course of naproxen." },
    { sp: "B", text: "Okay. Do you think this is rheumatoid arthritis?" },
    { sp: "A", text: "The labs will tell us more. If they come back positive I will refer you to rheumatology this week." },
  ];

  const SUBS: { key: "chat" | "form" | "scribe"; label: string }[] = [
    { key: "chat", label: "AI Chat" },
    { key: "form", label: "Form Responses" },
    { key: "scribe", label: "AI Scribe" },
  ];

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap gap-1">
        {SUBS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSub(s.key)}
            className={`rounded-md px-2 py-0.5 text-[9px] font-medium transition-colors cursor-pointer ${
              sub === s.key ? "bg-hilt-blue text-white" : "bg-gray-100 text-slate hover:bg-gray-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {sub === "chat" && (
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
      )}

      {sub === "form" && (
        <div className="rounded-lg border border-gray-200 p-2.5">
          {formRows.map((r, i) => (
            <div
              key={i}
              className={`flex items-baseline justify-between py-1.5 ${i < formRows.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <span className={`text-[10px] ${r.alert ? "font-medium text-red-600" : "text-slate"}`}>{r.label}</span>
              <span className="text-[10px] text-ink font-medium">{r.value}</span>
            </div>
          ))}
        </div>
      )}

      {sub === "scribe" && (
        <div>
          <p className="mb-2 text-[9px] text-ash">Automated transcription of the in person visit, speaker labels approximate.</p>
          <div className="space-y-1.5">
            {scribe.map((m, i) => (
              <div key={i}>
                <p className="text-[8px] font-semibold uppercase tracking-wider text-ash mb-0.5">
                  {m.sp === "A" ? "Speaker A" : "Speaker B"}
                </p>
                <div className={`rounded-lg px-2.5 py-1.5 ${m.sp === "A" ? "bg-violet-50" : "bg-gray-50"}`}>
                  <p className="text-[10px] leading-relaxed text-ink">{m.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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

function PaperworkTab() {
  const docs = [
    {
      type: "Sick note",
      status: "sent" as const,
      time: "Today, 9:14 AM",
      preview: "This letter confirms Sarah Martinez was evaluated today and is advised to rest from work for 3 days due to acute joint symptoms pending further workup.",
    },
    {
      type: "Work accommodation letter",
      status: "sent" as const,
      time: "Today, 9:12 AM",
      preview: "Sarah Martinez has been evaluated for joint symptoms requiring temporary accommodations. Recommend reduced typing tasks for 2 weeks pending workup.",
    },
    {
      type: "SOAP note",
      status: "drafted" as const,
      time: "Today, 9:11 AM",
      preview: "S: Returning patient, worsening knee pain, new bilateral hand stiffness 1hr AM, knuckle swelling. O: Vitals stable. A: Suspected early RA. P: RF, anti-CCP, ESR, CRP.",
    },
  ];

  const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
    drafted: { bg: "bg-amber-100", text: "text-amber-700", label: "AI Draft" },
    sent: { bg: "bg-blue-100", text: "text-blue-700", label: "Sent" },
  };

  return (
    <div className="space-y-2">
      <p className="mb-1.5 text-[9px] text-ash">Click Create Document, pick a template, AI drafts from the visit context, then Sign and Deliver to the patient by SMS in seconds</p>
      {docs.map((d, i) => {
        const s = statusStyle[d.status];
        return (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-2.5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-[10px] font-medium text-ink truncate">{d.type}</p>
                <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-medium ${s.bg} ${s.text}`}>{s.label}</span>
              </div>
              <span className="text-[8px] text-ash whitespace-nowrap">{d.time}</span>
            </div>
            <p className="text-[9px] leading-relaxed text-slate line-clamp-2">{d.preview}</p>
            <div className="mt-1.5 flex items-center gap-2">
              {d.status === "drafted" && (
                <span className="text-[9px] font-semibold text-hilt-blue">Review, Sign and Deliver</span>
              )}
              {d.status === "sent" && (
                <span className="text-[9px] font-medium text-hilt-blue">View PDF</span>
              )}
            </div>
          </div>
        );
      })}
      <div className="mt-2 rounded-lg border border-dashed border-gray-200 py-2 text-center text-[9px] font-medium text-slate">
        + Create document
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

export default function DoctorMockup({ highlightScribe = false }: { highlightScribe?: boolean }) {
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

      {/* Session instructions */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5">
          <p className="text-[9px] font-semibold text-amber-800 mb-0.5">Session Instructions Given to AI</p>
          <p className="text-[10px] text-ink leading-relaxed">
            Make sure to ask about morning stiffness duration, whether pain is symmetric, and family history of arthritis.
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
          {tab === "transcript" && <TranscriptTab defaultScribe={highlightScribe} />}
          {tab === "notes" && <NotesTab />}
          {tab === "paperwork" && <PaperworkTab />}
          {tab === "vitals" && <VitalsTab />}
          {tab === "vaccines" && <VaccinesTab />}
          {tab === "history" && <HistoryTab />}
        </div>
      </div>

      {/* Action bar */}
      <div className="border-t border-gray-100 p-3 flex flex-wrap gap-1.5">
        <div className="flex-1 rounded-lg bg-green-600 py-1.5 text-center text-[10px] font-semibold text-white">
          Complete Visit
        </div>
        <div className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-center text-[10px] font-medium text-slate">
          Cancel Claim
        </div>
        <div className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-center text-[10px] font-medium text-slate">
          Refer
        </div>
        <div
          className={`flex items-center gap-1 rounded-lg border border-violet-300 bg-violet-50 px-2.5 py-1.5 text-center text-[10px] font-semibold text-violet-700 ${
            highlightScribe ? "ring-2 ring-violet-300 motion-safe:animate-pulse" : ""
          }`}
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
          </svg>
          Scribe
        </div>
        <div className="rounded-lg border border-hilt-blue/40 bg-blue-50/60 px-2.5 py-1.5 text-center text-[10px] font-semibold text-hilt-blue">
          Create Document
        </div>
      </div>
    </div>
  );
}
