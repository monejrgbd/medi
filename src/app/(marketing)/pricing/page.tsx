"use client";

import { useState } from "react";
import Link from "next/link";
import FadeIn from "@/components/FadeIn";
import { PLAN_CONFIG } from "@/lib/constants";

type BillingCycle = "monthly" | "annual";

/* ── Data ──────────────────────────────────────────────── */

const PLANS = [
  { name: "Starter", key: "starter" as const, persona: "For solo practices", ai: "Standard AI", highlight: false },
  { name: "Professional", key: "professional" as const, persona: "For growing clinics", ai: "Advanced AI", highlight: true },
  { name: "Business", key: "business" as const, persona: "For multi location organizations", ai: "Precision + Premium AI", highlight: false },
];


const EVERY_PLAN_FEATURES = [
  "AI powered doctor summaries with suggested differentials",
  "Returning patient recognition across visits",
  "Urgency detection and priority queue",
  "Patient approved summary before queue",
  "130+ language support with voice input",
  "Self check in via QR code",
  "Live queue position and wait estimate",
  "Patient visit summaries with PDF download",
  "Full transcript + AI diagnostic for doctors",
  "Patient profile card (meds, allergies, history)",
  "Doctor notes, letters, and clinical documents (AI drafted)",
  "AI SOAP note generator (one click, full note from the visit, the AI scribe recording, and your dictated physical exam)",
  "AI Scribe (records the visit, AI cleaned Clinician and Patient transcript, drafts the note)",
  "AI paperwork (SOAP notes, referral and work letters, prior authorization, drafted from the visit)",
  "Daily letter templates (sick notes, return to work, school absence, work accommodation, and more)",
  "All documents clinic branded and doctor signed",
  "File attachments per visit",
  "Focus mode (auto claim next patient)",
  "Follow up tagging with AI instructions",
  "Receptionist dashboard with live queue",
  "Nurse workflow (vitals, vaccines, handoff)",
  "Manager analytics and wait time heatmaps",
  "Cross clinic referrals with full PDF package",
  "Review SMS funnel with platform rotation",
  "Patient search across locations",
  "Unlimited locations with unique QR codes",
  "Waiting room queue display for TVs",
  "Kiosk and tablet mode with auto clear",
  "Role based access controls",
  "Full audit trail",
  "Real time notifications and alerts",
  "PHIPA and PIPEDA compliant",
  "End to end encrypted",
  "AI targeted marketing SMS",
  "AI targeted marketing scans",
];

const PLAN_FEATURES = {
  starter: {
    features: [
      "Unlimited Standard AI intake",
      "30 messages per intake conversation limit",
      "Unlimited Standard AI scribe",
      "Unlimited Standard AI paperwork",
    ],
    premiumAi: [
      "1 Premium AI intake/mo",
    ],
    marketing: [
      "100 marketing SMS/mo",
      "10,000 marketing AI scans/mo",
    ],
  },
  professional: {
    features: [
      "Unlimited Advanced AI intake",
      "60 messages per intake conversation limit",
      "Unlimited Advanced AI scribe",
      "Unlimited Advanced AI paperwork",
    ],
    premiumAi: [
      "5 Premium AI intakes/mo",
    ],
    marketing: [
      "500 marketing SMS/mo",
      "50,000 marketing AI scans/mo",
    ],
  },
  business: {
    features: [
      "Unlimited Precision AI intake",
      "100 messages per intake conversation limit",
      "Embeddable widget for your website",
      "Unlimited Precision AI scribe",
      "Unlimited Precision AI paperwork",
    ],
    premiumAi: [
      "25 Premium AI intakes/mo",
    ],
    marketing: [
      "1,000 marketing SMS/mo",
      "100,000 marketing AI scans/mo",
    ],
  },
};

function StyledFeature({ text }: { text: string }) {
  const parts = text.split(/(Standard AI|Advanced AI|Precision AI|Premium AI)/g);
  return (
    <span className="text-xs text-slate leading-snug">
      {parts.map((part, i) => {
        if (part === "Standard AI") {
          return <span key={i} className="font-semibold text-slate">{part}</span>;
        }
        if (part === "Advanced AI") {
          return <span key={i} className="font-bold text-hilt-blue">{part}</span>;
        }
        if (part === "Precision AI") {
          return <span key={i} className="font-extrabold bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent">{part}</span>;
        }
        if (part === "Premium AI") {
          return <span key={i} className="font-extrabold bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">{part}</span>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

const FAQS = [
  {
    q: "What is included in every plan?",
    a: "Every feature: AI screening, doctor summaries, diagnostics, referrals, analytics, follow ups, 130+ languages, voice input, SMS notifications, waiting room queue display, and unlimited locations. The only difference between plans is AI quality and included marketing budget.",
  },
  {
    q: "What is the difference between the AI tiers?",
    a: "Standard AI handles routine visits quickly. Advanced AI provides deeper clinical reasoning and more thorough follow ups. Precision AI is the Business tier, delivering superior clinical depth for high volume clinics. Premium AI offers the deepest reasoning available for complex, multi symptom cases. Every tier also generates a doctor facing diagnostic suggestion at the end of each visit at no extra cost, bundled into the per visit credit cost. The AI Scribe is included on every plan but is not free: Starter includes the Standard scribe model unlimited, Professional includes the Advanced scribe model unlimited, and Business and Enterprise include the Precision scribe model unlimited, at no extra cost. On pay as you go and trials the scribe is metered per minute: Standard 0.1, Advanced 0.2, Precision 0.5 credits per minute. AI paperwork (SOAP notes, letters, prior authorization) follows the same model: included unlimited on every plan, and on pay as you go and trials it is metered per finished document: Standard 0.2, Advanced 0.3, Precision 0.5 credits per document.",
  },
  {
    q: "Who pays per seat?",
    a: "Doctors and nurses are paid seats. The clinic owner counts as the first seat. Receptionists, managers, and other admin staff are free on every plan.",
  },
  {
    q: "What is the marketing budget used for?",
    a: "Two things: AI Targeted Marketing (SMS campaigns and AI patient scans) on all plans, and Premium AI intakes (all plans). Everything else, including AI screening, summaries, diagnostics, review SMS, is unlimited and included free. Need more? Purchase additional budget anytime at $1 each or set up auto recharge.",
  },
{
    q: "Can I switch plans anytime?",
    a: "Yes. Upgrade or downgrade at any time from your billing dashboard. Changes take effect immediately.",
  },
  {
    q: "Is there a long term contract?",
    a: "No contracts. Choose monthly or annual billing. Annual plans save 20%. Cancel anytime from your dashboard.",
  },
];

/* ── Sections ──────────────────────────────────────────── */

function HeroCTA() {
  return (
    <FadeIn>
      <div className="mx-auto mb-12 flex flex-col items-center gap-3">
        <Link
          href="/d/owner/subscribe"
          className="inline-flex items-center gap-2 rounded-xl bg-hilt-blue px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-hilt-blue/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          Start Free Trial, up to $200
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
        <Link href="/demo" className="text-sm font-medium text-hilt-blue hover:underline">
          Or try the live demo first
        </Link>
      </div>
    </FadeIn>
  );
}



function PlanCards() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [providers, setProviders] = useState(1);
  const [providerInput, setProviderInput] = useState("1");

  return (
    <div className="mx-auto mt-16 max-w-[1180px]">
      <FadeIn>
        <h2 className="mb-2 text-center text-2xl font-bold text-ink">Choose your plan</h2>
        <p className="mb-6 text-center text-slate">
          Per doctor and nurse pricing. Owner counts too. All other staff free.
        </p>

        {/* Controls row */}
        <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          {/* Billing toggle */}
          <div className="inline-flex rounded-xl border border-gray-200 bg-snow p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                billing === "monthly"
                  ? "bg-white text-ink shadow-sm"
                  : "text-ash hover:text-slate"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                billing === "annual"
                  ? "bg-white text-ink shadow-sm"
                  : "text-ash hover:text-slate"
              }`}
            >
              Annual
              <span className="ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                Save 20%
              </span>
            </button>
          </div>

          {/* Provider count */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate">Doctors + nurses:</span>
            <input
              type="number"
              min={1}
              max={100}
              value={providerInput}
              onChange={(e) => {
                setProviderInput(e.target.value);
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= 100) setProviders(val);
              }}
              onBlur={() => {
                const val = parseInt(providerInput, 10);
                if (isNaN(val) || val < 1) {
                  setProviders(1);
                  setProviderInput("1");
                } else if (val > 100) {
                  setProviders(100);
                  setProviderInput("100");
                }
              }}
              className="w-16 rounded-lg border border-gray-200 bg-snow px-3 py-1.5 text-center text-sm font-medium text-ink shadow-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
            />
          </div>
        </div>
      </FadeIn>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan, i) => {
          const config = PLAN_CONFIG[plan.key];
          const monthlyPrice = billing === "annual" ? config.annual : config.price;
          const totalPrice = monthlyPrice * providers;
          const annualSavings = (config.price - config.annual) * 12 * providers;

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

                <p className="text-xs font-medium text-ash">{plan.persona}</p>
                <h3 className="mb-1 text-lg font-semibold text-ink">{plan.name}</h3>

                {/* Price */}
                <div className="mb-0.5">
                  <span className="text-4xl font-bold text-ink">${totalPrice}</span>
                  <span className="text-slate">{providers === 1 ? "/doctor and nurse/mo" : "/mo"}</span>
                </div>
                {providers > 1 && (
                  <p className="mb-0.5 text-xs text-ash">
                    {providers} doctors &times; ${monthlyPrice} each
                  </p>
                )}
                {billing === "annual" && (
                  <div className="mb-0.5 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-ash line-through">
                      ${config.price * providers}/mo
                    </span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                      Save ${annualSavings}/yr
                    </span>
                  </div>
                )}

                {/* Features */}
                <div className="mb-6 mt-2 space-y-1.5">
                  {PLAN_FEATURES[plan.key].features.map((feat) => (
                    <div key={feat} className="flex items-start gap-1.5">
                      <svg className="h-3.5 w-3.5 shrink-0 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      <StyledFeature text={feat} />
                    </div>
                  ))}

                  <div className="flex items-start gap-1.5 pt-1">
                    <svg className="h-3.5 w-3.5 shrink-0 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <button
                      onClick={() => document.getElementById("every-plan-includes")?.scrollIntoView({ behavior: "smooth" })}
                      className="text-xs font-medium text-hilt-blue hover:underline cursor-pointer"
                    >
                      Every feature included ↓
                    </button>
                  </div>

                  {/* Premium AI */}
                  <div className="border-t border-gray-200 pt-1.5 mt-1.5">
                    <button
                      onClick={() => document.getElementById("premium-ai-section")?.scrollIntoView({ behavior: "smooth" })}
                      className="text-[10px] font-extrabold uppercase tracking-wide mb-1 hover:underline cursor-pointer bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent"
                    >
                      Free Premium AI intake included ↓
                    </button>
                    {PLAN_FEATURES[plan.key].premiumAi.map((feat) => (
                        <div key={feat} className="flex items-start gap-1.5">
                          <svg className="h-3.5 w-3.5 shrink-0 text-fuchsia-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                          <StyledFeature text={feat} />
                        </div>
                      ))}
                  </div>

                  {/* Marketing */}
                  <div className="border-t border-gray-200 pt-1.5 mt-1.5">
                    <button
                      onClick={() => document.getElementById("marketing-section")?.scrollIntoView({ behavior: "smooth" })}
                      className="text-[10px] font-semibold text-hilt-blue uppercase tracking-wide mb-1 hover:underline cursor-pointer"
                    >
                      Free marketing included ↓
                    </button>
                    {PLAN_FEATURES[plan.key].marketing.map((feat) => (
                      <div key={feat} className="flex items-start gap-1.5">
                        <svg className="h-3.5 w-3.5 shrink-0 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        <span className="text-xs text-slate leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-auto">
                  <Link
                    href="/d/owner/subscribe"
                    className={`block rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                      plan.highlight
                        ? "bg-hilt-blue text-white hover:bg-hilt-blue-dark"
                        : "border-2 border-hilt-blue text-hilt-blue hover:bg-hilt-blue/5"
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </FadeIn>
          );
        })}

        {/* Enterprise card */}
        <FadeIn delay={PLANS.length * 0.08}>
          <div className="relative flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <p className="text-xs font-medium text-ash">For large organizations</p>
            <h3 className="mb-1 text-lg font-semibold text-ink">Enterprise</h3>
            <div className="mb-1">
              <span className="text-4xl font-bold text-ink">Custom</span>
            </div>
            <div className="mb-3 mt-2">
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                Volume pricing
              </span>
            </div>
            <ul className="mb-6 space-y-2 text-sm text-slate">
              {["Dedicated account manager", "Custom SLAs", "Volume discounts", "Priority support"].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-hilt-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              <a
                href="https://cal.com/102937474/hilt-health-meeting"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border-2 border-hilt-blue py-3 text-center text-sm font-semibold text-hilt-blue transition-colors hover:bg-hilt-blue/5"
              >
                Talk to Sales
              </a>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Pay As You Go */}
      <FadeIn>
        <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="sm:flex sm:items-start sm:justify-between sm:gap-8">
            <div className="mb-4 sm:mb-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-semibold text-ink">Pay As You Go</h3>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-ash">No subscription</span>
              </div>
              <p className="text-sm text-slate">
                <span className="font-semibold text-ink">$1 per credit.</span>{" "}
                No monthly plan, no per doctor and nurse fee, no commitment. Every feature included.
                Best for low volume clinics or trying the platform before choosing a plan.
              </p>
            </div>
            <div className="shrink-0">
              <Link
                href="/d/owner/subscribe"
                className="inline-block rounded-xl border-2 border-hilt-blue px-6 py-2.5 text-sm font-semibold text-hilt-blue transition-colors hover:bg-hilt-blue/5"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* PAYG credit costs — matches the 4 tier slots in ai_model_config plus flat service costs */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {[
              { service: "Standard AI", cost: "1 credit" },
              { service: "Advanced AI", cost: "1.5 credits" },
              { service: "Precision AI", cost: "2.5 credits" },
              { service: "Premium AI", cost: "4 credits" },
              { service: "Scribe (Standard)", cost: "0.1 credits/min" },
              { service: "Scribe (Advanced)", cost: "0.2 credits/min" },
              { service: "Scribe (Precision)", cost: "0.5 credits/min" },
              { service: "AI paperwork (Standard)", cost: "0.2 credits/document" },
              { service: "AI paperwork (Advanced)", cost: "0.3 credits/document" },
              { service: "AI paperwork (Precision)", cost: "0.5 credits/document" },
              { service: "Review SMS", cost: "0.1 credits" },
              { service: "Marketing SMS", cost: "0.1 credits" },
              { service: "Marketing AI Scan", cost: "1 credit/1K" },
            ].map((item) => (
              <div key={item.service} className="rounded-lg bg-snow px-3 py-2 text-center">
                <p className="text-sm font-semibold text-ink">{item.cost}</p>
                <p className="text-[11px] text-ash leading-tight">{item.service}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <button
              onClick={() => document.getElementById("every-plan-includes")?.scrollIntoView({ behavior: "smooth" })}
              className="text-xs font-medium text-hilt-blue hover:underline cursor-pointer"
            >
              Every feature included ↓
            </button>
          </div>
        </div>
      </FadeIn>

      {/* Enterprise contact */}
      <FadeIn>
        <div className="mt-4 text-center">
          <a
            href="https://cal.com/102937474/hilt-health-meeting"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-hilt-blue hover:underline"
          >
            Need custom volumes or dedicated support? Talk to sales.
          </a>
        </div>
      </FadeIn>
    </div>
  );
}



function PremiumAiExplainer() {
  return (
    <FadeIn>
      <div id="premium-ai-section" className="mx-auto mt-16 max-w-2xl scroll-mt-20">
        <h2 className="mb-2 text-center text-2xl font-bold">
          <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">Premium AI</span>
        </h2>
        <p className="mb-6 text-center text-slate">
          The deepest clinical reasoning available. Included free on every plan.
        </p>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <p className="text-sm font-semibold text-ink mb-1">When to use it</p>
            <p className="text-sm text-slate">
              For complex, multi symptom cases where deeper reasoning matters. Enable it per location and your doctors can choose Premium AI when a patient needs the most thorough intake. Standard cases continue using Advanced or Precision AI at no extra cost.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-snow p-4">
              <p className="text-sm font-semibold text-ink mb-1">Deeper clinical reasoning</p>
              <p className="text-xs text-slate">
                More thorough follow up questions, better pattern recognition across symptoms, and stronger connections to patient history.
              </p>
            </div>
            <div className="rounded-lg bg-snow p-4">
              <p className="text-sm font-semibold text-ink mb-1">Doctor controlled</p>
              <p className="text-xs text-slate">
                Enabled per location by the owner. Doctors decide which patients benefit from Premium AI. Not every visit needs it.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-slate">
              Need more? Starter $3.50/intake, Professional $3/intake, Business $2.50/intake.
            </p>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

function MarketingExplainer() {
  return (
    <FadeIn>
      <div id="marketing-section" className="mx-auto mt-16 max-w-2xl scroll-mt-20">
        <h2 className="mb-2 text-center text-2xl font-bold text-ink">AI Targeted Marketing</h2>
        <p className="mb-6 text-center text-slate">
          Send the right message to the right patients. Included on every plan.
        </p>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <p className="text-sm font-semibold text-ink mb-1">How it works</p>
            <p className="text-sm text-slate">
              Define your audience with structured filters (age, sex, visit history, location) or describe who you want to reach in plain English. AI evaluates your patient records and finds the best matches.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-snow p-4">
              <p className="text-sm font-semibold text-ink mb-1">AI Patient Scans</p>
              <p className="text-xs text-slate">
                AI reads visit summaries, diagnoses, medications, and chronic conditions to match patients to your criteria. Structured filters alone are instant and free.
              </p>
            </div>
            <div className="rounded-lg bg-snow p-4">
              <p className="text-sm font-semibold text-ink mb-1">Marketing SMS</p>
              <p className="text-xs text-slate">
                Review matched patients, exclude individuals, compose your message with patient name and clinic variables, and send. Opt out is automatic on every message.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-slate">
              Need more? Additional SMS at $0.10 each and AI scans at $1 per 1,000 patients. Purchase anytime or set up auto recharge.
            </p>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

function EveryPlanIncludes() {
  return (
    <div id="every-plan-includes" className="mx-auto max-w-3xl scroll-mt-20">
      <FadeIn>
        <h2 className="mb-2 text-center text-2xl font-bold text-ink">Every plan includes</h2>
        <p className="mb-6 text-center text-slate">
          No feature gating. No add on fees. The full platform from day one.
        </p>
      </FadeIn>
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
          {EVERY_PLAN_FEATURES.map((feat) => (
            <div key={feat} className="flex items-start gap-2 py-1">
              <svg className="h-4 w-4 shrink-0 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span className="text-sm text-slate">{feat}</span>
            </div>
          ))}
        </div>
      </FadeIn>
    </div>
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
        <h2 className="mb-3 text-2xl font-bold text-ink">Ready to save hours on intake every day?</h2>
        <p className="mb-6 text-slate">
          Join clinics across Canada using AI to streamline patient pre screening.
        </p>
        <Link
          href="/d/owner/subscribe"
          className="inline-flex items-center gap-2 rounded-xl bg-hilt-blue px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-hilt-blue/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          Start Your Free Trial
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
        <p className="mt-2 text-sm text-ash">Up to $200 in free credits. No credit card required.</p>
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
  return (
    <>
      <main>
        <section className="bg-gradient-to-b from-blue-50/60 to-white pt-16 pb-20">
          <div className="mx-auto max-w-[1200px] px-6">
            <HeroCTA />
            <PlanCards />
          </div>
        </section>
        <section className="bg-white py-20">
          <div className="mx-auto max-w-[1200px] px-6">
            <EveryPlanIncludes />
            <PremiumAiExplainer />
            <MarketingExplainer />
            <FAQSection />
            <BottomCTA />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
