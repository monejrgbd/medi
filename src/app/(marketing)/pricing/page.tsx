"use client";

import { useState } from "react";
import Link from "next/link";
import FadeIn from "@/components/FadeIn";
import CustomPlanModal from "@/components/CustomPlanModal";

/* ── Data ──────────────────────────────────────────────── */

type AIModel = "standard" | "advanced";

const CREDIT_COSTS = [
  {
    action: "Review request SMS",
    credits: 0.1,
    desc: "Post visit review collection",
    tag: "Enable or disable per location",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
      </svg>
    ),
  },
  {
    action: "Follow up reminder SMS",
    credits: 0.1,
    desc: "Automated return visit reminders",
    tag: "Enable or disable per location",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
  },
];

const PLANS = [
  { name: "Starter", price: 99, credits: 125, savings: "21%", highlight: false },
  { name: "Standard", price: 349, credits: 500, savings: "30%", highlight: true },
  { name: "Plus", price: 899, credits: 1500, savings: "40%", highlight: false },
  { name: "Enterprise", price: 3999, credits: 8000, savings: "50%", highlight: false },
];

const CREDITS_PER_PATIENT: Record<AIModel, number> = { standard: 1.5, advanced: 4 };

const INCLUDED_FEATURES = [
  {
    title: "130+ language support",
    desc: "Patients speak in their language, voice or text. Doctors read the summary in English.",
    icon: "M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418",
  },
  {
    title: "Doctor summaries",
    desc: "AI generated intake summary with suggested differentials, full transcript, and patient approved notes.",
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
  },
  {
    title: "Returning patient recognition",
    desc: "AI picks up where the last visit left off. Medications, allergies, and history already on file. No repeat questions.",
    icon: "M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z",
  },
  {
    title: "Urgency detection",
    desc: "AI detects severity during the conversation and flags high priority patients automatically. Urgent cases get seen first.",
    icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z",
  },
  {
    title: "Referral system",
    desc: "Refer patients with one click. The receiving clinic gets the AI summary, doctor notes, and full visit history.",
    icon: "M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
  },
  {
    title: "Analytics dashboard",
    desc: "Wait times, throughput, per doctor stats, and patient return rates. All in real time.",
    icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z",
  },
  {
    title: "Multi location support",
    desc: "Add locations, assign staff per site, and get a unique branded QR code for each waiting room.",
    icon: "M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z",
  },
  {
    title: "Kiosk and tablet mode",
    desc: "Patients without phones use a clinic tablet. Full screen kiosk mode with auto clear between patients.",
    icon: "M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-15a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 4.5v15a2.25 2.25 0 0 0 2.25 2.25Z",
  },
];

const TRUST_BADGES = [
  { label: "PHIPA & PIPEDA compliant", icon: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" },
  { label: "End to end encrypted", icon: "M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" },
  { label: "Role based access controls", icon: "M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" },
  { label: "Full audit trail", icon: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" },
];

const FAQS = [
  {
    q: "What happens if I run out of credits?",
    a: "You can set a recharge limit in your dashboard. When your credits run out, screening continues at $1 per credit up to your limit. If you do not set a limit, screening pauses until your next cycle or you purchase more credits.",
  },
  {
    q: "What is included in the free trial?",
    a: "Up to $200 in credits with no time limit. Use Standard or Advanced AI, access all features, and see how Hilt Health fits your clinic. No credit card required to start.",
  },
  {
    q: "Can I switch plans anytime?",
    a: "Yes. Upgrade or downgrade at any time. When you upgrade, you get the new credit balance immediately. When you downgrade, the change takes effect at your next billing cycle.",
  },
  {
    q: "Is there a setup fee or long term contract?",
    a: "No setup fees and no long term contracts. All plans are month to month. Cancel anytime from your dashboard.",
  },
  {
    q: "How does SMS pricing work?",
    a: "Review requests and follow up reminders use 0.1 credits per SMS, drawn from your credit pool. Enable them per location in your dashboard. No separate subscription needed.",
  },
  {
    q: "Do unused credits roll over?",
    a: "Credits reset each billing cycle and do not roll over. This keeps pricing simple and predictable.",
  },
  {
    q: "What is the difference between Standard and Advanced AI?",
    a: "Standard AI (1.5 credits) handles routine visits, walk ins, and general intake quickly. Advanced AI (4 credits) provides deeper reasoning for complex cases with more thorough follow up questions and detailed symptom analysis. You can use both within any plan.",
  },
];

/* ── Helpers ───────────────────────────────────────────── */

function patients(credits: number, model: AIModel) {
  return Math.floor(credits / CREDITS_PER_PATIENT[model]);
}

/* ── Sections ──────────────────────────────────────────── */

function HeroSection() {
  return (
    <FadeIn>
      <div className="mx-auto mb-4 text-center">
        <span className="inline-block rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-700">
          Up to $200 in free credits. No card required.
        </span>
      </div>
      <h1 className="mb-4 text-center text-4xl font-bold tracking-tight text-ink sm:text-5xl">
        AI pre-screening from $0.75 per patient
      </h1>
      <p className="mx-auto mb-8 max-w-xl text-center text-lg text-slate">
        Everything runs on credits. Buy more, pay less per credit.
        Every plan includes the full platform.
      </p>
      <div className="text-center">
        <Link
          href="/start-trial"
          className="inline-flex items-center gap-2 rounded-xl bg-hilt-blue px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-hilt-blue/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          Start Free Trial
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
        <p className="mt-2 text-sm text-ash">Up to $200 in free credits. No card. No time limit.</p>
      </div>
    </FadeIn>
  );
}

function CreditCostsSection() {
  return (
    <FadeIn>
      <div className="mx-auto mt-16 max-w-2xl">
        <h2 className="mb-6 text-center text-2xl font-bold text-ink">What uses credits</h2>
        <div className="space-y-3">
          {/* AI pre-screening — single card with both tiers */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-hilt-blue/10">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-ink">AI pre-screening</p>
                <span className="inline-block rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
                  Select per location
                </span>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg bg-snow p-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Standard</p>
                  <p className="text-xs text-ash">Routine visits, walk ins, general intake</p>
                </div>
                <div className="shrink-0 text-right ml-3">
                  <span className="text-xl font-bold text-ink">1.5</span>
                  <p className="text-xs text-ash">credits</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-snow p-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Advanced</p>
                  <p className="text-xs text-ash">Complex cases, suggested diagnostic to doctor</p>
                </div>
                <div className="shrink-0 text-right ml-3">
                  <span className="text-xl font-bold text-ink">4</span>
                  <p className="text-xs text-ash">credits</p>
                </div>
              </div>
            </div>
          </div>

          {/* SMS items */}
          {CREDIT_COSTS.map((item) => (
            <div
              key={item.action}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-hilt-blue/10">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink">{item.action}</p>
                <p className="text-sm text-ash">{item.desc}</p>
                <span className="mt-1 inline-block rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
                  {item.tag}
                </span>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-xl font-bold text-ink">{item.credits}</span>
                <p className="text-xs text-ash">{item.credits === 1 ? "credit" : "credits"}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-ash">
          Credits only cover AI conversations and SMS. The rest of the platform, including summaries, analytics, referrals, review management, 130+ languages, and multi location support, is yours from day one.
        </p>
      </div>
    </FadeIn>
  );
}

function PlanCards({ onContactSales }: { onContactSales: () => void }) {
  return (
    <div className="mx-auto mt-16 max-w-[1100px]">
      <FadeIn>
        <h2 className="mb-2 text-center text-2xl font-bold text-ink">Choose your plan</h2>
        <p className="mb-8 text-center text-slate">
          Credits are $1 each on pay as you go. Monthly plans save up to 50%.
        </p>
      </FadeIn>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan, i) => {
          const perCredit = (plan.price / plan.credits).toFixed(2);
          const patientCount = patients(plan.credits, "standard");
          const perPatient = (plan.price / patientCount).toFixed(2);
          const isEnterprise = plan.name === "Enterprise";

          return (
            <FadeIn key={plan.name} delay={i * 0.08}>
              <div
                className={`relative flex h-full flex-col rounded-2xl border p-6 transition-shadow hover:shadow-md ${
                  plan.highlight
                    ? "border-hilt-blue bg-white shadow-lg shadow-hilt-blue/10 ring-2 ring-hilt-blue"
                    : "border-gray-200 bg-white shadow-sm"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-hilt-blue px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}

                <h3 className="mb-1 text-lg font-semibold text-ink">{plan.name}</h3>

                {/* Price — the hero number */}
                <div className="mb-1">
                  <span className="text-4xl font-bold text-ink">${plan.price.toLocaleString()}</span>
                  <span className="text-slate">/mo</span>
                </div>

                {/* Credits + savings */}
                <p className="mb-1 text-sm text-slate">
                  {plan.credits.toLocaleString()} credits · ${perCredit}/credit
                </p>
                <div className="mb-5">
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                    Save {plan.savings}
                  </span>
                </div>

                {/* Patient estimate */}
                <div className="mb-6 rounded-lg bg-snow p-3">
                  <p className="text-sm text-slate">
                    ~<span className="font-semibold text-hilt-blue">{patientCount.toLocaleString()} patients</span> on Standard AI · ${perPatient}/patient
                  </p>
                </div>

                {/* CTA */}
                <div className="mt-auto space-y-2">
                  <Link
                    href="/start-trial"
                    className={`block rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                      plan.highlight
                        ? "bg-hilt-blue text-white hover:bg-hilt-blue-dark"
                        : "border-2 border-hilt-blue text-hilt-blue hover:bg-hilt-blue/5"
                    }`}
                  >
                    Start Free Trial
                  </Link>
                  {isEnterprise && (
                    <button
                      onClick={onContactSales}
                      className="block w-full rounded-xl border border-gray-300 py-2.5 text-center text-sm font-medium text-slate transition-colors hover:border-ink hover:text-ink"
                    >
                      Talk to Sales
                    </button>
                  )}
                </div>
              </div>
            </FadeIn>
          );
        })}
      </div>

      {/* Custom + PAYG */}
      <FadeIn>
        <div className="mt-8 text-center">
          <p className="text-slate">
            <button
              onClick={onContactSales}
              className="font-medium text-hilt-blue hover:underline"
            >
              Need custom volumes? Contact us.
            </button>
            <span className="mx-2 text-ash">or</span>
            Pay as you go at <span className="font-semibold text-ink">$1 per credit</span>, no commitment.
          </p>
        </div>
      </FadeIn>
    </div>
  );
}

function IncludedSection() {
  return (
    <div className="mx-auto mt-20 max-w-[1000px]">
      <FadeIn>
        <h2 className="mb-2 text-center text-2xl font-bold text-ink">Included in every plan</h2>
        <p className="mb-8 text-center text-slate">No add ons, no hidden fees. You get the full platform from day one.</p>
      </FadeIn>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {INCLUDED_FEATURES.map((feat, i) => (
          <FadeIn key={feat.title} delay={i * 0.06}>
            <div className="flex h-full flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-hilt-blue/10">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d={feat.icon} />
                </svg>
              </div>
              <h3 className="mb-1 text-sm font-semibold text-ink">{feat.title}</h3>
              <p className="text-sm leading-relaxed text-slate">{feat.desc}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}

function CreditCalculator() {
  const [model, setModel] = useState<AIModel>("standard");

  return (
    <div className="mx-auto mt-20 max-w-3xl">
      <FadeIn>
        <h2 className="mb-2 text-center text-2xl font-bold text-ink">How credits translate to patients</h2>
        <p className="mb-6 text-center text-slate">
          Most clinics use Standard AI for routine visits and Advanced AI for complex cases.
        </p>

        {/* Toggle */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-xl border border-gray-200 bg-snow p-1">
            <button
              onClick={() => setModel("standard")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                model === "standard"
                  ? "bg-white text-ink shadow-sm"
                  : "text-ash hover:text-slate"
              }`}
            >
              Standard AI (1.5 credits)
            </button>
            <button
              onClick={() => setModel("advanced")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                model === "advanced"
                  ? "bg-white text-ink shadow-sm"
                  : "text-ash hover:text-slate"
              }`}
            >
              Advanced AI (4 credits)
            </button>
          </div>
        </div>

        {/* Results grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const count = patients(plan.credits, model);
            const perPatient = (plan.price / count).toFixed(2);
            return (
              <div
                key={plan.name}
                className={`rounded-xl border p-4 text-center ${
                  plan.highlight ? "border-hilt-blue bg-hilt-blue/5" : "border-gray-200 bg-white"
                }`}
              >
                <p className={`text-sm font-semibold ${plan.highlight ? "text-hilt-blue" : "text-ink"}`}>{plan.name}</p>
                <p className="mt-1 text-2xl font-bold text-ink">~{count.toLocaleString()}</p>
                <p className="text-sm text-ash">patients/mo</p>
                <p className="mt-1 text-sm text-slate">${perPatient}/patient</p>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-center text-sm text-ash">
          You can mix both models freely within any plan.
        </p>
      </FadeIn>
    </div>
  );
}

function TrustBadges() {
  return (
    <FadeIn>
      <div className="mx-auto mt-20 max-w-[1000px]">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {TRUST_BADGES.map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-2 rounded-full bg-snow px-4 py-2.5 text-sm font-medium text-slate shadow-sm"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d={badge.icon} />
              </svg>
              {badge.label}
            </div>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}

function FAQSection() {
  return (
    <div className="mx-auto mt-20 max-w-2xl">
      <FadeIn>
        <h2 className="mb-8 text-center text-2xl font-bold text-ink">Frequently asked questions</h2>
      </FadeIn>
      <div className="space-y-6">
        {FAQS.map((faq, i) => (
          <FadeIn key={i} delay={i * 0.05}>
            <div>
              <h3 className="mb-2 font-semibold text-ink">{faq.q}</h3>
              <p className="text-slate leading-relaxed">{faq.a}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}

function BottomCTA() {
  return (
    <FadeIn>
      <div className="mx-auto mt-20 max-w-2xl text-center">
        <h2 className="mb-3 text-2xl font-bold text-ink">Ready to save 2 hours a day?</h2>
        <p className="mb-6 text-slate">
          Join clinics across Canada using AI to streamline patient intake.
        </p>
        <Link
          href="/start-trial"
          className="inline-flex items-center gap-2 rounded-xl bg-hilt-blue px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-hilt-blue/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          Start Your Free Trial
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
        <p className="mt-2 text-sm text-ash">Up to $200 in free credits. No card. No time limit.</p>
      </div>
    </FadeIn>
  );
}

function Footer() {
  return (
    <footer className="bg-white py-12 border-t border-gray-100">
      <div className="mx-auto max-w-[1200px] px-6 text-center">
        <p className="mb-2 text-2xl font-bold text-hilt-blue tracking-tight">Hilt Health</p>
        <p className="mb-4 text-slate">
          Built in Toronto. Expanding across Canada.
        </p>
        <div className="mb-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ash">
          <Link href="/blog" className="hover:text-slate transition-colors">
            Blog
          </Link>
          <Link href="/privacy" className="hover:text-slate transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-slate transition-colors">
            Terms of Service
          </Link>
          <Link href="/pricing" className="text-slate font-medium transition-colors">
            Pricing
          </Link>
          <a
            href="mailto:business@hilthealth.com"
            className="hover:text-slate transition-colors"
          >
            Contact
          </a>
        </div>
        <p className="text-xs text-ash">Built in Canada</p>
        <p className="mt-2 text-xs text-ash">Powered by <a href="https://veldsystems.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate transition-colors underline">veldsystems.com</a></p>
      </div>
    </footer>
  );
}

/* ── Page ──────────────────────────────────────────────── */

export default function PricingPage() {
  const [customModalOpen, setCustomModalOpen] = useState(false);

  return (
    <>
      <main>
        <section className="bg-gradient-to-b from-blue-50/60 to-white pt-16 pb-20">
          <div className="mx-auto max-w-[1200px] px-6">
            <HeroSection />
            <CreditCostsSection />
            <PlanCards onContactSales={() => setCustomModalOpen(true)} />
          </div>
        </section>
        <section className="bg-white py-20">
          <div className="mx-auto max-w-[1200px] px-6">
            <IncludedSection />
            <CreditCalculator />
            <TrustBadges />
            <FAQSection />
            <BottomCTA />
          </div>
        </section>
      </main>
      <Footer />
      <CustomPlanModal open={customModalOpen} onClose={() => setCustomModalOpen(false)} />
    </>
  );
}
