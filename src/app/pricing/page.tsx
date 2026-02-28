"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import FadeIn from "@/components/FadeIn";

type AIModel = "standard" | "advanced";

const FEATURES = [
  "AI pre-screening (Standard + Advanced)",
  "Doctor summary + full transcript",
  "Analytics dashboard",
  "Overuse at $1/credit",
];

const PLANS = [
  {
    name: "Starter",
    price: 99,
    credits: 125,
    savings: "21%",
    desc: "For small clinics getting started.",
    highlight: false,
  },
  {
    name: "Standard",
    price: 349,
    credits: 500,
    savings: "30%",
    desc: "For growing clinics with steady volume.",
    highlight: true,
  },
  {
    name: "Plus",
    price: 899,
    credits: 1500,
    savings: "40%",
    desc: "For busy multi-doctor practices.",
    highlight: false,
  },
  {
    name: "Enterprise",
    price: 3999,
    credits: 8000,
    savings: "50%",
    desc: "For clinic networks and hospitals.",
    highlight: false,
  },
];

const CREDITS_PER_PATIENT = { standard: 1.5, advanced: 4 };

function patients(credits: number, model: AIModel) {
  return Math.floor(credits / CREDITS_PER_PATIENT[model]);
}

function Check() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-hilt-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function AIModelSelector({ model, setModel }: { model: AIModel; setModel: (m: AIModel) => void }) {
  return (
    <FadeIn>
      <div className="mx-auto mb-12 max-w-3xl">
        <h2 className="mb-6 text-center text-2xl font-bold text-ink">Choose your AI model</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => setModel("standard")}
            className={`relative rounded-2xl border-2 p-6 text-left transition-all ${
              model === "standard"
                ? "border-hilt-blue bg-hilt-blue/5 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            {model === "standard" && (
              <div className="absolute right-4 top-4">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-hilt-blue">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
              </div>
            )}
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hilt-blue/10">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-ink">Standard AI</p>
                <p className="text-sm text-hilt-blue font-medium">1.5 credits per patient</p>
              </div>
            </div>
            <p className="text-sm text-slate leading-relaxed">
              Fast, conversational pre-screening. Great for routine visits, walk-ins, and general intake.
            </p>
          </button>

          <button
            onClick={() => setModel("advanced")}
            className={`relative rounded-2xl border-2 p-6 text-left transition-all ${
              model === "advanced"
                ? "border-hilt-blue bg-hilt-blue/5 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            {model === "advanced" && (
              <div className="absolute right-4 top-4">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-hilt-blue">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
              </div>
            )}
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hilt-blue/10">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-ink">Advanced AI</p>
                <p className="text-sm text-hilt-blue font-medium">4 credits per patient</p>
              </div>
            </div>
            <p className="text-sm text-slate leading-relaxed">
              Deep reasoning for complex cases. More thorough follow-ups, detailed symptom analysis, and nuanced summaries.
            </p>
          </button>
        </div>
        <p className="mt-4 text-center text-sm text-ash">
          You can mix both models freely. Use Standard for routine visits and Advanced for complex cases.
        </p>
      </div>
    </FadeIn>
  );
}

function PricingCards({ model }: { model: AIModel }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {PLANS.map((plan, i) => {
        const patientCount = patients(plan.credits, model);
        const perPatient = (plan.price / patientCount).toFixed(2);

        return (
          <FadeIn key={plan.name} delay={i * 0.1}>
            <div
              className={`relative flex h-full flex-col rounded-2xl border p-8 ${
                plan.highlight
                  ? "border-hilt-blue bg-white shadow-lg shadow-hilt-blue/10 ring-2 ring-hilt-blue"
                  : "border-gray-200 bg-white shadow-sm"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-hilt-blue px-4 py-1 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}

              <h3 className="mb-1 text-lg font-semibold text-ink">{plan.name}</h3>
              <p className="mb-4 text-sm text-slate">{plan.desc}</p>

              <div className="mb-1">
                <span className="text-4xl font-bold text-ink">${plan.price.toLocaleString()}</span>
                <span className="text-slate">/mo</span>
              </div>
              <p className="mb-5 text-sm font-medium text-green-600">{plan.savings} off pay-as-you-go</p>

              {/* Patient capacity */}
              <div className="mb-6 rounded-xl bg-snow p-4 space-y-3">
                <div>
                  <p className="text-3xl font-bold text-ink">{plan.credits.toLocaleString()}</p>
                  <p className="text-sm text-slate">credits per month</p>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-sm text-slate">
                    That&apos;s up to <span className="font-semibold text-hilt-blue">~{patientCount.toLocaleString()} patients</span> using {model === "standard" ? "Standard" : "Advanced"} AI
                  </p>
                  <p className="mt-1 text-sm text-slate">
                    <span className="font-semibold text-ink">${perPatient}</span>/patient
                  </p>
                </div>
              </div>

              <ul className="mb-8 flex-1 space-y-3 text-sm text-slate">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="/#contact"
                className={`block rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? "bg-hilt-blue text-white hover:bg-hilt-blue-dark"
                    : "border-2 border-hilt-blue text-hilt-blue hover:bg-hilt-blue/5"
                }`}
              >
                {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
              </a>
            </div>
          </FadeIn>
        );
      })}
    </div>
  );
}

function FreeTrial() {
  return (
    <FadeIn>
      <div className="mx-auto mt-12 max-w-2xl rounded-2xl border-2 border-dashed border-hilt-blue/30 bg-hilt-blue/5 p-8 text-center">
        <h3 className="mb-2 text-xl font-bold text-ink">Try Hilthealth free</h3>
        <p className="mb-4 text-slate">
          Start with <span className="font-semibold text-hilt-blue">200 free credits</span>, enough
          for ~130 patients on Standard AI or ~50 on Advanced. No credit card required.
          No time limit. Just see if it works for your clinic.
        </p>
        <a
          href="/#contact"
          className="inline-block rounded-xl bg-hilt-blue px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-hilt-blue-dark"
        >
          Request Free Trial
        </a>
      </div>
    </FadeIn>
  );
}

function PayAsYouGo() {
  return (
    <FadeIn>
      <div className="mx-auto mt-8 max-w-2xl text-center">
        <p className="text-slate">
          Don&apos;t need a monthly plan?{" "}
          <span className="font-semibold text-ink">Pay as you go</span> at $1 per
          credit, no commitment. Use any AI model, cancel anytime.
        </p>
      </div>
    </FadeIn>
  );
}

function ComparisonTable({ model }: { model: AIModel }) {
  return (
    <FadeIn>
      <div className="mx-auto mt-16 max-w-4xl overflow-x-auto">
        <h3 className="mb-6 text-center text-2xl font-bold text-ink">Plan comparison</h3>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-4 pr-4 font-medium text-slate" />
              {PLANS.map((p) => (
                <th key={p.name} className={`pb-4 px-4 font-semibold ${p.highlight ? "text-hilt-blue" : "text-ink"}`}>
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-3 pr-4 text-slate">Monthly price</td>
              {PLANS.map((p) => (
                <td key={p.name} className="px-4 py-3 font-medium text-ink">${p.price.toLocaleString()}</td>
              ))}
            </tr>
            <tr>
              <td className="py-3 pr-4 text-slate">Credits included</td>
              {PLANS.map((p) => (
                <td key={p.name} className="px-4 py-3 font-medium text-ink">{p.credits.toLocaleString()}</td>
              ))}
            </tr>
            <tr>
              <td className="py-3 pr-4 text-slate">
                Patients/month <span className="text-xs text-ash">({model === "standard" ? "Standard" : "Advanced"} AI)</span>
              </td>
              {PLANS.map((p) => (
                <td key={p.name} className="px-4 py-3 font-medium text-hilt-blue">~{patients(p.credits, model).toLocaleString()}</td>
              ))}
            </tr>
            <tr>
              <td className="py-3 pr-4 text-slate">Cost per patient</td>
              {PLANS.map((p) => (
                <td key={p.name} className="px-4 py-3 font-medium text-ink">
                  ${(p.price / patients(p.credits, model)).toFixed(2)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3 pr-4 text-slate">Overuse rate</td>
              {PLANS.map((p) => (
                <td key={p.name} className="px-4 py-3 text-ink">$1/credit</td>
              ))}
            </tr>
            {[
              "Standard + Advanced AI",
              "Doctor summary + transcript",
              "Analytics dashboard",
            ].map((feature) => (
              <tr key={feature}>
                <td className="py-3 pr-4 text-slate">{feature}</td>
                {PLANS.map((p) => (
                  <td key={p.name} className="px-4 py-3">
                    <svg className="h-5 w-5 text-hilt-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FadeIn>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "What happens if I run out of credits?",
      a: "You can set an overuse budget in your dashboard. Overuse credits are billed at $1 each. If you don\u2019t set a budget, screening pauses until your next billing cycle or you upgrade.",
    },
    {
      q: "Can I switch plans anytime?",
      a: "Yes. Upgrade or downgrade at any time. When you upgrade, you get the new credit balance immediately. When you downgrade, the change takes effect at your next billing cycle.",
    },
    {
      q: "What\u2019s included in the free trial?",
      a: "200 credits, no time limit. Use Standard or Advanced AI, access all features, and see how Hilthealth fits your clinic. No credit card required to start.",
    },
{
      q: "Do unused credits roll over?",
      a: "Credits reset each billing cycle and don\u2019t roll over. This keeps pricing simple and predictable.",
    },
  ];

  return (
    <div className="mx-auto mt-20 max-w-2xl">
      <FadeIn>
        <h3 className="mb-8 text-center text-2xl font-bold text-ink">
          Frequently asked questions
        </h3>
      </FadeIn>
      <div className="space-y-6">
        {faqs.map((faq, i) => (
          <FadeIn key={i} delay={i * 0.05}>
            <div>
              <h4 className="mb-2 font-semibold text-ink">{faq.q}</h4>
              <p className="text-slate leading-relaxed">{faq.a}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-white py-12 border-t border-gray-100">
      <div className="mx-auto max-w-[1200px] px-6 text-center">
        <p className="mb-2 text-2xl font-bold text-hilt-blue tracking-tight">hilthealth</p>
        <p className="mb-4 text-slate">
          Built in Toronto. Expanding across Canada.
        </p>
        <div className="mb-4 flex items-center justify-center gap-6 text-sm text-ash">
          <a href="/blog" className="hover:text-slate transition-colors">
            Blog
          </a>
          <a href="/privacy" className="hover:text-slate transition-colors">
            Privacy Policy
          </a>
          <a href="/pricing" className="text-slate font-medium transition-colors">
            Pricing
          </a>
          <a
            href="mailto:hello@hilthealth.com"
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

export default function PricingPage() {
  const [model, setModel] = useState<AIModel>("standard");

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-gradient-to-b from-blue-50/60 to-white pt-16 pb-20">
          <div className="mx-auto max-w-[1200px] px-6">
            <FadeIn>
              <div className="mx-auto mb-4 text-center">
                <span className="inline-block rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-700">
                  Start with 200 free credits. No card required.
                </span>
              </div>
              <h1 className="mb-4 text-center text-4xl font-bold text-ink sm:text-5xl">
                Simple, transparent pricing
              </h1>
              <p className="mx-auto mb-12 max-w-xl text-center text-lg text-slate">
                Pay for what you use. Every plan includes the full Hilthealth platform.
                Choose your AI model and see exactly what you get.
              </p>
            </FadeIn>

            <AIModelSelector model={model} setModel={setModel} />
            <PricingCards model={model} />
            <FreeTrial />
            <PayAsYouGo />
            <ComparisonTable model={model} />
            <FAQ />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
