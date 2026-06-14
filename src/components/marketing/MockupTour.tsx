"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import ChatMockup from "@/components/marketing/ChatMockup";
import SummaryMockup from "@/components/marketing/SummaryMockup";

const DoctorMockup = dynamic(() => import("@/components/marketing/DoctorMockup"), {
  loading: () => <div className="h-[400px] w-full max-w-3xl rounded-2xl border border-gray-200 bg-gray-50" />,
});
const PaperworkMockup = dynamic(() => import("@/components/marketing/PaperworkMockup"), {
  loading: () => <div className="h-[360px] w-full max-w-3xl rounded-2xl border border-gray-200 bg-gray-50" />,
});
const DashboardMockup = dynamic(() => import("@/components/marketing/DashboardMockup"), {
  loading: () => <div className="h-[300px] w-full max-w-3xl rounded-2xl border border-gray-200 bg-gray-50" />,
});

/* ── Inline tour cards (smaller, hero-style) ──────────── */

function ReviewsCard() {
  return (
    <div className="w-full h-full rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#D97706" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
        </svg>
      </div>
      {/* The flow: rate privately first, then routed by rating */}
      <div className="mb-2 rounded-lg bg-white/80 p-3 ring-1 ring-amber-200/60">
        <div className="flex items-center gap-1.5">
          <svg className="h-3 w-3 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          <p className="text-[10px] font-semibold text-amber-900">Every patient rates you privately first</p>
        </div>
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-1.5 rounded-md bg-green-50 px-2 py-1 ring-1 ring-green-200/70">
            <span className="shrink-0 rounded bg-green-100 px-1 py-0.5 text-[9px] font-bold tabular-nums text-green-700">4 to 5&#9733;</span>
            <svg className="h-2.5 w-2.5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
            <span className="text-[10px] font-medium text-green-800">Asked to review on Google or any platform you set</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 ring-1 ring-amber-200/70">
            <span className="shrink-0 rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold tabular-nums text-amber-700">1 to 3&#9733;</span>
            <svg className="h-2.5 w-2.5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
            <span className="text-[10px] font-medium text-amber-800">Stays on your dashboard</span>
          </div>
        </div>
      </div>
      <div className="mt-2 rounded-lg bg-white/80 p-3 ring-1 ring-amber-200/60">
        <div className="flex items-center gap-1.5 mb-1.5">
          <svg className="h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
          </svg>
          <p className="text-[10px] font-semibold text-amber-800">Caught before it goes public</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="flex gap-0.5 shrink-0 mt-0.5">
            {[1, 2].map(n => (
              <svg key={n} className="h-2.5 w-2.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
            ))}
            {[3, 4, 5].map(n => (
              <svg key={n} className="h-2.5 w-2.5 text-gray-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
            ))}
          </div>
          <p className="text-[10px] leading-relaxed text-slate italic">&ldquo;Waited 40 minutes and no one told me about the delay.&rdquo;</p>
        </div>
      </div>
    </div>
  );
}

function ContinuityCard() {
  return (
    <div className="w-full h-full rounded-2xl border border-green-200 bg-gradient-to-b from-green-50/80 to-white p-5 shadow-xl ring-1 ring-green-900/5">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
        <span className="text-xs font-semibold text-green-700">Continuity of care, built in</span>
        <span className="ml-auto rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">AI powered</span>
      </div>
      <p className="text-[10px] font-semibold text-green-800 mb-1.5">AI remembers past visits</p>
      <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-900/5 space-y-2">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-200">
            <span className="text-[8px] font-bold text-ash">S</span>
          </div>
          <p className="text-[11px] text-ink leading-relaxed">My hands have been really stiff every morning.</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-500">
            <span className="text-[8px] font-bold text-white">AI</span>
          </div>
          <p className="text-[11px] text-ink leading-relaxed">You came in for knee pain on March 1. Could the hand stiffness be related?</p>
        </div>
      </div>
      <div className="my-3 border-t border-green-200" />
      <p className="text-[10px] font-semibold text-green-800 mb-1.5">Doctor tagged follow ups</p>
      <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-900/5">
        <p className="text-[11px] text-slate leading-relaxed">
          Doctors tag sessions with instructions. On the return visit, the AI continues with full memory of what was said and what the doctor wanted next.
        </p>
      </div>
    </div>
  );
}

function ReferCard() {
  return (
    <div className="w-full h-full rounded-2xl border border-purple-200 bg-gradient-to-b from-purple-50/80 to-white p-4 shadow-xl ring-1 ring-purple-900/5">
      <div className="mb-2 flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-purple-500" />
        <span className="text-xs font-semibold text-purple-700">Send referral</span>
      </div>
      <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-900/5 space-y-2">
        <div>
          <p className="text-[10px] font-medium text-slate mb-0.5">Specialty</p>
          <div className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] text-ink">Rheumatology</div>
        </div>
        <div>
          <p className="text-[10px] font-medium text-slate mb-0.5">Include visits</p>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-[10px]">
              <div className="h-3 w-3 rounded-sm border border-hilt-blue bg-hilt-blue flex items-center justify-center">
                <svg className="h-2 w-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              </div>
              <span className="text-ink">Today, Knee pain, hand stiffness</span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <div className="h-3 w-3 rounded-sm border border-hilt-blue bg-hilt-blue flex items-center justify-center">
                <svg className="h-2 w-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              </div>
              <span className="text-ink">Mar 1, Initial knee assessment</span>
            </div>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-medium text-slate mb-0.5">Referral note</p>
          <div className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] text-ink leading-relaxed">
            Bilateral joint symptoms, suspect RA. Requesting rheumatology evaluation.
          </div>
        </div>
        <div>
          <p className="text-[10px] font-medium text-slate mb-0.5">Destination</p>
          <div className="flex gap-1 mb-1">
            <div className="rounded-full bg-hilt-blue px-2 py-0.5 text-[9px] font-semibold text-white">Hilt Clinic</div>
            <div className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-medium text-ash">Email</div>
          </div>
          <div className="rounded border border-hilt-blue bg-blue-50/50 px-2 py-1">
            <p className="text-[10px] font-medium text-ink">City Rheum Clinic</p>
            <p className="text-[9px] text-ash">Dr. Patel &middot; 123 Health St</p>
          </div>
        </div>
        <div className="rounded bg-purple-600 py-1.5 text-center text-[11px] font-semibold text-white">Send Referral</div>
      </div>
      <p className="mt-2 text-[10px] text-ash">Transcript, summary, diagnosis, notes, and attachments included</p>
    </div>
  );
}

function MarketingCard() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50/80 to-white p-4 shadow-xl ring-1 ring-blue-900/5">
      <div className="mb-2 flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-blue-500" />
        <span className="text-xs font-semibold text-blue-700">Targeted patient outreach</span>
        <span className="ml-auto rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">via SMS</span>
      </div>
      <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-900/5 space-y-2">
        <div className="flex gap-1">
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] text-ink">Age 50+</span>
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] text-ink">Female</span>
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] text-ink">All locations</span>
        </div>
        <div className="rounded border border-blue-200 bg-blue-50/50 px-2 py-1">
          <p className="text-[9px] font-medium text-blue-600 mb-0.5">AI criteria</p>
          <p className="text-[10px] text-ink italic">&ldquo;Mentioned joint pain or arthritis&rdquo;</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-400" />
            <span className="text-[10px] font-medium text-ink">31 matched</span>
          </div>
          <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-medium text-green-700">Ready</span>
        </div>
        <div className="rounded bg-gray-50 px-2 py-1.5 text-[10px] text-slate">
          Hi &#123;first_name&#125;, &#123;clinic_name&#125; now offers orthopedic services. Call us to book.
        </div>
        <div className="rounded bg-blue-600 py-1.5 text-center text-[11px] font-semibold text-white">Send to 31 Patients</div>
        <p className="text-center text-[9px] text-ash">Only patients who opted in to marketing at signup</p>
      </div>
      <p className="mt-2 text-[10px] text-ash">Filter first, then AI scans visit summaries for the rest</p>
    </div>
  );
}

function QueueCard() {
  // Mirrors the doctor dashboard "Pending" queue (PatientQueueCard), simplified.
  const queue = [
    { n: 7, name: "Sarah Martinez", sex: "Female", wait: 2, nurseReviewed: true, returning: true, high: false, focus: true },
    { n: 8, name: "James Lee", sex: "Male", wait: 5, nurseReviewed: false, returning: true, high: false, focus: false },
    { n: 9, name: "Aaliyah Khan", sex: "Female", wait: 8, nurseReviewed: false, returning: false, high: true, focus: false },
  ];
  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-gray-900/5">
      {/* Header bar — same surface as the doctor dashboard */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-ink">Queue</h4>
          <span className="rounded-full bg-hilt-blue/10 px-2 py-0.5 text-[11px] font-medium tabular-nums text-hilt-blue">Pending (3)</span>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-ash">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 motion-safe:animate-pulse" />
          Live
        </span>
      </div>

      {/* List on a soft backdrop so the white cards have depth */}
      <div className="space-y-2.5 bg-gray-50/60 p-4">
        {queue.map((v) => (
          <div
            key={v.n}
            className={`rounded-xl p-3.5 shadow-sm ${
              v.high
                ? "border-l-4 border-l-red-500 border-t border-r border-b border-gray-200"
                : "border border-gray-200"
            } ${v.focus ? "bg-blue-50/50" : "bg-white"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center justify-center rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-gray-600">
                    #{v.n}
                  </span>
                  <h3 className="text-sm font-semibold text-ink">{v.name}</h3>
                  {v.high && (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">High</span>
                  )}
                  {v.nurseReviewed && (
                    <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-600">Nurse Reviewed</span>
                  )}
                  {v.returning && (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">Returning</span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate">
                  <span>{v.sex}</span>
                  <span>Waiting {v.wait} min</span>
                </div>
              </div>
              <div
                className={`shrink-0 rounded-lg bg-hilt-blue px-4 py-1.5 text-xs font-medium text-white ${
                  v.focus ? "ring-2 ring-blue-300 ring-offset-1 motion-safe:animate-pulse" : ""
                }`}
              >
                Claim
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AfterVisitGrid() {
  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-4 lg:grid-cols-3">
      <ReviewsCard />
      <ContinuityCard />
      <ReferCard />
    </div>
  );
}

/* ── Tour steps (Quick demo walkthrough) ──────────────── */

type TourStep = {
  eyebrow: string;
  title: string;
  description: string;
  render: () => React.ReactNode;
  callout?: { label: string; body: string };
};

const tourSteps: TourStep[] = [
  {
    eyebrow: "Before & during the visit",
    title: "Patient checks in",
    description: "Scans a QR code or opens a shared link, fills a quick form, then talks to the AI in their language about why they came in.",
    render: () => <ChatMockup />,
  },
  {
    eyebrow: "Before the doctor sees it",
    title: "Patient approves the summary",
    description: "The AI generates a summary the doctor will read. The patient reviews it, flags anything wrong, and approves before it leaves their phone.",
    render: () => <SummaryMockup />,
  },
  {
    eyebrow: "Before the doctor sees it",
    title: "The visit enters the queue",
    description: "Once the patient approves, the visit lands in the queue. A doctor claims it when ready, and the patient sees their place in line update live.",
    render: () => <QueueCard />,
  },
  {
    eyebrow: "Before the visit",
    title: "Doctor walks in already briefed",
    description: "Full summary, suggested differentials, history. A 30 second read replaces 5 minutes of intake questions.",
    callout: {
      label: "Scribe",
      body: "And if you would rather not type the note, click Scribe when the patient walks in. It records your conversation, and that plus the summary and transcript drafts the paperwork for you to review and sign. It works even for a walk in with no AI screening.",
    },
    render: () => <DoctorMockup highlightScribe />,
  },
  {
    eyebrow: "After the visit",
    title: "It keeps working after they leave",
    description: "Reviews sent the right way, an AI that remembers next time, and full referrals in seconds. All automatic.",
    render: () => <AfterVisitGrid />,
  },
  {
    eyebrow: "Grow the practice",
    title: "Bring the right patients back",
    description: "Filter by demographics, let AI scan visit summaries and transcripts, then write your message. It sends by SMS, only to patients who opted in to marketing at signup.",
    render: () => <MarketingCard />,
  },
  {
    eyebrow: "Documentation",
    title: "Paperwork drafted in seconds",
    description: "Sick notes, work letters, full SOAP notes drafted from the visit. You review, sign, and close the laptop.",
    render: () => <PaperworkMockup />,
  },
  {
    eyebrow: "Analytics",
    title: "Everything tracked",
    description: "Wait times, throughput, referrals, and per doctor breakdowns. All visible in one dashboard.",
    render: () => <DashboardMockup />,
  },
];

/* ── Chooser options ──────────────────────────────────── */

type Option = {
  kind: "live" | "quick" | "book";
  href?: string;
  external?: boolean;
  title: string;
  description: string;
  duration: string;
  ringClass: string;
  iconBgClass: string;
  iconColorClass: string;
  icon: React.ReactNode;
};

const options: Option[] = [
  {
    kind: "live",
    href: "/demo",
    title: "Live demo",
    description: "Be the patient yourself. Type a symptom, see what the AI asks back.",
    duration: "~3 min",
    ringClass: "hover:border-hilt-blue/50 hover:bg-blue-50/40",
    iconBgClass: "bg-hilt-blue/10",
    iconColorClass: "text-hilt-blue",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    ),
  },
  {
    kind: "quick",
    title: "Quick demo",
    description: "Click through every screen, one mockup at a time.",
    duration: "~60 sec",
    ringClass: "hover:border-green-500/40 hover:bg-green-50/50",
    iconBgClass: "bg-green-500/10",
    iconColorClass: "text-green-600",
    icon: (
      <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
      </svg>
    ),
  },
  {
    kind: "book",
    href: "https://cal.com/102937474/hilt-health-meeting",
    external: true,
    title: "Book a meeting",
    description: "Let us be with you on a call. We will walk you through it ourselves.",
    duration: "~15 min",
    ringClass: "hover:border-violet-500/40 hover:bg-violet-50/50",
    iconBgClass: "bg-violet-500/10",
    iconColorClass: "text-violet-600",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
  },
];

/* ── Main component ───────────────────────────────────── */

export default function MockupTour({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"chooser" | "walkthrough">("chooser");
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const autoOpenedRef = useRef(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  // External trigger: any "Try the demo" control can open the chooser via
  // window.dispatchEvent(new Event("hilt:open-demo")). Purely additive;
  // nothing dispatches this on the homepage, so it is inert there.
  useEffect(() => {
    function openChooser() {
      setView("chooser");
      setStep(0);
      setOpen(true);
    }
    window.addEventListener("hilt:open-demo", openChooser);
    return () => window.removeEventListener("hilt:open-demo", openChooser);
  }, []);

  useEffect(() => {
    if (autoOpenedRef.current) return;
    if (searchParams.get("demo") !== "quick") return;
    autoOpenedRef.current = true;
    setView("walkthrough");
    setStep(0);
    setOpen(true);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("demo");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
  }, [searchParams]);

  const total = tourSteps.length;
  const isLast = step === total - 1;
  const current = tourSteps[step];

  const close = useCallback(() => {
    setOpen(false);
    setView("chooser");
    setStep(0);
    requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
  }, []);

  const next = useCallback(() => {
    setStep(s => (s >= total - 1 ? s : s + 1));
  }, [total]);

  const prev = useCallback(() => {
    setStep(s => (s <= 0 ? s : s - 1));
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      } else if (view === "walkthrough") {
        if (e.key === "ArrowRight") next();
        else if (e.key === "ArrowLeft") prev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, view, close, next, prev]);

  // Focus close button when modal opens or view changes
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => closeButtonRef.current?.focus());
    }
  }, [open, view]);

  // Reset content scroll when step changes
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [step, view]);

  return (
    <>
      {/* ── Trigger: video-thumbnail rectangle ───────────── */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setView("chooser");
          setStep(0);
          setOpen(true);
        }}
        aria-label="Try a demo"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`group relative flex min-h-[380px] w-full max-w-[920px] overflow-hidden rounded-[24px] bg-gradient-to-br from-hilt-blue via-blue-700 to-indigo-900 shadow-xl shadow-hilt-blue/25 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_28px_60px_-15px_rgba(37,99,235,0.5)] focus:outline-none focus:ring-4 focus:ring-hilt-blue/30 sm:min-h-[460px] ${className}`}
      >
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.22),transparent_55%)]" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-300/15 blur-3xl" />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 select-none px-5 py-5 opacity-75 blur-[2.5px] sm:px-7 sm:py-6"
        >
          <div className="space-y-2 sm:space-y-2.5">
            <div className="max-w-[58%] rounded-xl bg-white px-3 py-2 shadow-md ring-1 ring-black/5 sm:px-3.5">
              <p className="text-xs font-medium leading-snug text-ink sm:text-sm">Hi Sarah, welcome back to Riverside Family Medicine!</p>
            </div>
            <div className="ml-auto max-w-[46%] rounded-xl bg-blue-50 px-3 py-2 shadow-md ring-1 ring-hilt-blue/10 sm:px-3.5">
              <p className="text-xs font-medium leading-snug text-ink sm:text-sm">My hands have been really stiff every morning</p>
            </div>
            <div className="max-w-[64%] rounded-xl bg-white px-3 py-2 shadow-md ring-1 ring-black/5 sm:px-3.5">
              <p className="text-xs font-medium leading-snug text-ink sm:text-sm">You came in for knee pain on March 1. Could the hand stiffness be related?</p>
            </div>
            <div className="ml-auto max-w-[36%] rounded-xl bg-blue-50 px-3 py-2 shadow-md ring-1 ring-hilt-blue/10 sm:px-3.5">
              <p className="text-xs font-medium leading-snug text-ink sm:text-sm">Yes, my knee has been worse</p>
            </div>
          </div>
        </div>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_center,rgba(15,23,42,0.55),transparent_70%)]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-indigo-950/60 to-transparent"
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-5 text-center sm:gap-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/90 sm:text-[11px]">60 second tour</p>

          <div className="relative">
            <span aria-hidden="true" className="absolute inset-0 -z-10 rounded-full bg-white/40 blur-xl transition-opacity duration-500 group-hover:opacity-70" />
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_14px_36px_-10px_rgba(0,0,0,0.4)] transition-transform duration-500 group-hover:scale-110 sm:h-20 sm:w-20">
              <svg className="h-7 w-7 translate-x-0.5 text-hilt-blue sm:h-9 sm:w-9" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
            </div>
          </div>

          <div>
            <h3
              className="text-xl font-bold leading-tight text-white sm:text-2xl md:text-3xl"
              style={{ textShadow: "0 2px 16px rgba(15,23,42,0.5)" }}
            >
              Let us show you
            </h3>
            <p
              className="mt-1.5 text-xs text-white/85 sm:text-sm md:text-base"
              style={{ textShadow: "0 1px 8px rgba(15,23,42,0.4)" }}
            >
              What your patients see, and what all your staff see
            </p>
          </div>
        </div>
      </button>

      {/* ── Modal ──────────────────────────────────────── */}
      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby={view === "chooser" ? "mockup-tour-chooser-title" : "mockup-tour-step-title"}
        >
          <div aria-hidden="true" className="absolute inset-0 bg-ink/70 backdrop-blur-sm tour-fade-bg" />

          <div
            className={`relative flex h-full items-center justify-center ${
              view === "chooser" ? "p-3 sm:p-6" : "p-0"
            }`}
            onClick={close}
          >
            <div
              className={`tour-card-in flex w-full flex-col overflow-hidden bg-white shadow-2xl ${
                view === "chooser"
                  ? "max-h-[92vh] max-w-lg rounded-2xl sm:rounded-3xl"
                  : "h-full max-w-none rounded-none"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {view === "chooser" ? (
                <>
                  {/* Chooser header */}
                  <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                    <h3 id="mockup-tour-chooser-title" className="text-base font-semibold text-ink sm:text-lg">
                      How would you like to try it?
                    </h3>
                    <button
                      ref={closeButtonRef}
                      type="button"
                      onClick={close}
                      aria-label="Close"
                      className="shrink-0 rounded-full p-1.5 text-ash transition-colors hover:bg-gray-100 hover:text-ink focus:outline-none focus:ring-2 focus:ring-hilt-blue/40"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Chooser options */}
                  <div className="flex flex-col gap-3 p-5">
                    {options.map((opt) => {
                      const cardClasses = `group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-hilt-blue/30 ${opt.ringClass}`;
                      const inner = (
                        <>
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${opt.iconBgClass} ${opt.iconColorClass}`}>
                            {opt.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-3">
                              <p className="text-base font-semibold text-ink">{opt.title}</p>
                              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-ash">
                                {opt.duration}
                              </span>
                            </div>
                            <p className="mt-1 text-sm leading-snug text-slate">{opt.description}</p>
                          </div>
                          <svg
                            className="mt-1 h-5 w-5 shrink-0 text-ash transition-transform duration-200 group-hover:translate-x-1 group-hover:text-ink"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                          </svg>
                        </>
                      );

                      if (opt.kind === "quick") {
                        return (
                          <button
                            key={opt.kind}
                            type="button"
                            onClick={() => {
                              setStep(0);
                              setView("walkthrough");
                            }}
                            className={cardClasses}
                          >
                            {inner}
                          </button>
                        );
                      }

                      return (
                        <a
                          key={opt.kind}
                          href={opt.href}
                          target={opt.external ? "_blank" : undefined}
                          rel={opt.external ? "noopener noreferrer" : undefined}
                          onClick={() => {
                            if (
                              !opt.external &&
                              typeof window !== "undefined" &&
                              !window.location.pathname.startsWith("/demo")
                            ) {
                              try {
                                sessionStorage.setItem(
                                  "demoReturnTo",
                                  window.location.pathname + window.location.search
                                );
                              } catch {}
                            }
                            close();
                          }}
                          className={cardClasses}
                        >
                          {inner}
                        </a>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  {/* Walkthrough header */}
                  <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setView("chooser")}
                        aria-label="Back to options"
                        className="shrink-0 rounded-full p-1.5 text-ash transition-colors hover:bg-gray-100 hover:text-ink focus:outline-none focus:ring-2 focus:ring-hilt-blue/40"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                      </button>
                      <p className="shrink-0 text-xs font-medium tabular-nums text-ash">
                        {step + 1} <span className="text-gray-300">/</span> {total}
                      </p>
                      <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
                        {tourSteps.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setStep(i)}
                            aria-label={`Go to step ${i + 1}`}
                            aria-current={i === step ? "step" : undefined}
                            className={`h-1.5 shrink-0 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-hilt-blue/40 ${
                              i === step
                                ? "w-8 bg-hilt-blue"
                                : i < step
                                  ? "w-5 bg-hilt-blue/50"
                                  : "w-5 bg-gray-200 hover:bg-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <button
                      ref={closeButtonRef}
                      type="button"
                      onClick={close}
                      aria-label="Close tour"
                      className="shrink-0 rounded-full p-1.5 text-ash transition-colors hover:bg-gray-100 hover:text-ink focus:outline-none focus:ring-2 focus:ring-hilt-blue/40"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Walkthrough content */}
                  <div ref={contentRef} className="flex-1 overflow-auto px-4 py-6 sm:px-8 sm:py-8">
                    <div key={step} className="tour-step-fade">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-hilt-blue">{current.eyebrow}</p>
                      <h3 id="mockup-tour-step-title" className="mb-3 text-xl font-bold text-ink sm:text-2xl md:text-3xl">{current.title}</h3>
                      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-slate sm:mb-8 sm:text-base">{current.description}</p>
                      {current.callout && (
                        <div className="mb-6 max-w-2xl rounded-xl border border-violet-200/80 bg-gradient-to-r from-violet-50/80 to-white p-4 ring-1 ring-violet-900/5 sm:mb-8">
                          <div className="mb-1.5 flex items-center gap-1.5">
                            <svg className="h-3.5 w-3.5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                            </svg>
                            <span className="text-xs font-bold uppercase tracking-wider text-violet-600">{current.callout.label}</span>
                          </div>
                          <p className="text-sm leading-relaxed text-slate">{current.callout.body}</p>
                        </div>
                      )}
                      <div className="flex justify-center">{current.render()}</div>
                    </div>
                  </div>

                  {/* Walkthrough footer */}
                  <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:px-6 sm:py-4">
                    <button
                      type="button"
                      onClick={prev}
                      disabled={step === 0}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-slate transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-hilt-blue/40 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      ← Previous
                    </button>
                    <button
                      type="button"
                      onClick={isLast ? close : next}
                      className="rounded-lg bg-hilt-blue px-5 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-hilt-blue/40"
                    >
                      {isLast ? "Done" : "Next →"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <style jsx>{`
            .tour-fade-bg {
              animation: tourBackdropFade 0.18s ease-out;
            }
            .tour-card-in {
              animation: tourCardIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .tour-step-fade {
              animation: tourStepFade 0.25s ease-out;
            }
            @keyframes tourBackdropFade {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes tourCardIn {
              from { opacity: 0; transform: scale(0.96) translateY(8px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes tourStepFade {
              from { opacity: 0; transform: translateY(6px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @media (prefers-reduced-motion: reduce) {
              .tour-fade-bg, .tour-card-in, .tour-step-fade {
                animation: none;
              }
            }
          `}</style>
        </div>,
        document.body
      )}
    </>
  );
}
