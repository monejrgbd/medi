"use client";

import React, { useState, useEffect, useRef } from "react";

const documentTypes = [
  { key: "letter_sick_note", label: "Sick note", icon: "file-text" },
  { key: "letter_return_to_work", label: "Return to work", icon: "check-circle" },
  { key: "clinical_note_soap", label: "SOAP note", icon: "stethoscope" },
  { key: "letter_school_absence", label: "School absence", icon: "graduation-cap" },
  { key: "letter_work_accommodation", label: "Work accommodation", icon: "shield" },
  { key: "letter_custom", label: "Custom letter", icon: "edit" },
] as const;

const sampleDocuments = [
  { type: "Sick note", patient: "Maria G.", status: "sent", date: "Today, 2:14 PM", doctor: "Dr. Chen", preview: "This letter confirms Maria G. was seen at Downtown Medical on April 11..." },
  { type: "SOAP note", patient: "James R.", status: "signed", date: "Today, 1:48 PM", doctor: "Dr. Chen", preview: "S: 45M presenting with 3-day history of productive cough, low grade fever..." },
  { type: "Return to work", patient: "Lisa T.", status: "sent", date: "Today, 11:20 AM", doctor: "Dr. Patel", preview: "This letter certifies Lisa T. was evaluated and is cleared for full duties..." },
  { type: "School absence", patient: "Noah P.", status: "sent", date: "Yesterday", doctor: "Dr. Patel", preview: "This letter confirms Noah P. was absent for medical reasons from April 8..." },
  { type: "Sick note", patient: "Ahmad K.", status: "signed", date: "Yesterday", doctor: "Dr. Chen", preview: "This letter confirms Ahmad K. was seen and is advised to rest for 3 days..." },
];

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-gray-100", text: "text-gray-600", label: "Draft" },
  drafted: { bg: "bg-amber-100", text: "text-amber-700", label: "AI Draft" },
  signed: { bg: "bg-green-100", text: "text-green-700", label: "Signed" },
  sent: { bg: "bg-blue-100", text: "text-blue-700", label: "Sent" },
  void: { bg: "bg-red-100", text: "text-red-700", label: "Voided" },
};

function TemplatePickerView() {
  return (
    <div className="p-3 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-semibold text-ink">Generate Document</h3>
        <span className="text-[10px] sm:text-xs text-ash">Step 1 of 4</span>
      </div>
      <p className="text-[10px] sm:text-xs text-slate mb-3">Pick a template to get started</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {documentTypes.map((dt, i) => (
          <div
            key={dt.key}
            className={`rounded-lg border p-2.5 sm:p-3 cursor-pointer transition-colors ${
              i === 0
                ? "border-hilt-blue bg-blue-50/50 ring-1 ring-hilt-blue/30"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="mb-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-gray-100">
              <svg className="h-3.5 w-3.5 text-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <p className="text-[10px] sm:text-xs font-medium text-ink">{dt.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentListView() {
  return (
    <div className="p-3 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-semibold text-ink">Document History</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] sm:text-[10px] font-medium text-blue-700">12 this week</span>
        </div>
      </div>

      <div className="space-y-0 divide-y divide-gray-100">
        {sampleDocuments.map((doc, i) => {
          const s = statusStyles[doc.status] || statusStyles.draft;
          return (
            <div key={i} className="py-2.5 first:pt-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[10px] sm:text-xs font-medium text-ink truncate">{doc.type}</p>
                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] sm:text-[9px] font-medium ${s.bg} ${s.text}`}>
                      {s.label}
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-slate">{doc.patient} &middot; {doc.doctor}</p>
                  <p className="text-[8px] sm:text-[9px] text-ash mt-0.5 truncate">{doc.preview}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className="text-[8px] sm:text-[9px] text-ash whitespace-nowrap">{doc.date}</span>
                  {doc.status === "sent" && (
                    <span className="text-[8px] sm:text-[9px] font-medium text-hilt-blue cursor-pointer hover:underline">View PDF</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex gap-3 text-[9px] sm:text-[10px] text-slate">
          <span><strong className="text-ink">47</strong> total this month</span>
          <span><strong className="text-ink">43</strong> signed</span>
          <span><strong className="text-ink">2</strong> pending</span>
        </div>
      </div>
    </div>
  );
}

function SoapPreviewView() {
  return (
    <div className="p-3 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-semibold text-ink">SOAP Note Editor</h3>
        <div className="flex items-center gap-2">
          <span className="rounded bg-green-100 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium text-green-700">AI Draft Ready</span>
          <span className="text-[10px] sm:text-xs text-ash">James R.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Left: visit context */}
        <div className="hidden sm:block rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-[9px]">
          <p className="font-semibold text-slate uppercase text-[8px] mb-2">Visit Context</p>
          <div className="space-y-1.5 text-ash">
            <p><span className="font-medium text-ink">Chief complaint:</span> Productive cough, fever</p>
            <p><span className="font-medium text-ink">Vitals:</span> T 100.8, HR 88, BP 128/82</p>
            <p><span className="font-medium text-ink">Meds:</span> Lisinopril 10mg, Metformin 500mg</p>
            <p><span className="font-medium text-ink">Allergies:</span> Penicillin</p>
          </div>
        </div>

        {/* Center: SOAP editor */}
        <div className="sm:col-span-2 rounded-lg border border-gray-200 bg-white p-2.5">
          <div className="space-y-2.5">
            {[
              { letter: "S", color: "border-blue-400", title: "Subjective", text: "45M presenting with 3 day history of productive cough with yellowish sputum, low grade fever (self measured 100.4F at home), mild sore throat. Denies chest pain, dyspnea, hemoptysis. Reports fatigue and body aches. No sick contacts known." },
              { letter: "O", color: "border-green-400", title: "Objective", text: "T 100.8F, HR 88, BP 128/82, SpO2 98% RA. Lungs: scattered rhonchi bilateral bases, no wheezes. Pharynx: mild erythema, no exudate. Neck: supple, no LAD." },
              { letter: "A", color: "border-amber-400", title: "Assessment", text: "Acute bronchitis, likely viral. Low suspicion for pneumonia given normal SpO2 and absence of focal consolidation." },
              { letter: "P", color: "border-purple-400", title: "Plan", text: "Supportive care. Guaifenesin PRN. Ibuprofen 400mg q6h PRN fever/pain. Push fluids. Return if worsening or not improved in 5 days." },
            ].map(section => (
              <div key={section.letter} className={`border-l-2 ${section.color} pl-2.5`}>
                <p className="text-[9px] sm:text-[10px] font-semibold text-ink mb-0.5">{section.title}</p>
                <p className="text-[8px] sm:text-[9px] text-slate leading-relaxed">{section.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="rounded bg-hilt-blue px-2.5 py-1 text-[9px] sm:text-[10px] font-semibold text-white">Sign and Copy to EMR</div>
            <div className="rounded border border-gray-200 px-2 py-1 text-[9px] sm:text-[10px] font-medium text-slate">Regenerate</div>
          </div>
        </div>
      </div>
    </div>
  );
}

type View = "templates" | "history" | "soap";
const views: { key: View; label: string }[] = [
  { key: "templates", label: "Generate" },
  { key: "history", label: "History" },
  { key: "soap", label: "SOAP Editor" },
];

const viewContent: Record<View, () => React.ReactElement> = {
  templates: TemplatePickerView,
  history: DocumentListView,
  soap: SoapPreviewView,
};

export default function PaperworkMockup() {
  const [active, setActive] = useState<View>("templates");
  const [clicked, setClicked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    if (clicked || !containerRef.current) return;
    const el = containerRef.current;

    function start() {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        setActive(prev => views[(views.findIndex(v => v.key === prev) + 1) % views.length].key);
      }, 4000);
    }
    function stop() {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }

    const io = new IntersectionObserver(([entry]) => { entry.isIntersecting ? start() : stop(); }, { threshold: 0.3 });
    io.observe(el);
    return () => { io.disconnect(); stop(); };
  }, [clicked]);

  return (
    <div ref={containerRef} data-no-fade-observe className="rounded-2xl border border-gray-200 bg-gray-50 shadow-xl ring-1 ring-gray-900/5 overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center border-b border-gray-200 bg-white overflow-x-auto">
        {views.map(v => (
          <button
            key={v.key}
            onClick={() => { setActive(v.key); setClicked(true); if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } }}
            className={`shrink-0 px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              active === v.key
                ? "border-hilt-blue text-hilt-blue"
                : "border-transparent text-slate hover:text-ink hover:border-gray-300"
            }`}
          >
            {v.label}
          </button>
        ))}
        <div className="ml-auto pr-3 sm:pr-4 flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-[10px] sm:text-xs text-slate">Documents</span>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[320px] sm:min-h-[360px]">
        {React.createElement(viewContent[active])}
      </div>
    </div>
  );
}
