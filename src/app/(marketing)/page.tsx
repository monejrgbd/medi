import { Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import FadeIn from "@/components/FadeIn";
import TeamCodeCapture from "@/components/demo/TeamCodeCapture";
import ContactLink from "@/components/marketing/ContactLink";
import MockupTour from "@/components/marketing/MockupTour";

const SignUpForm = dynamic(() => import("@/components/SignUpForm"), {
  loading: () => <div className="h-[400px]" />,
});
const HeroEmailCTA = dynamic(() => import("@/components/marketing/HeroEmailCTA"), {
  loading: () => <div className="h-[52px]" />,
});
const PainCards = dynamic(() => import("@/components/marketing/PainCards"), {
  loading: () => <div className="mt-10 h-[400px]" />,
});

/* ── Hero ─────────────────────────────────────────────── */

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-snow pt-24 pb-28 lg:pt-36 lg:pb-40">
      <div className="mx-auto max-w-[1200px] px-6">
        <h1 className="mb-12 text-balance text-3xl font-bold leading-[1.05] tracking-[-0.02em] text-ink sm:text-4xl lg:mb-20 lg:text-5xl xl:text-6xl">
          AI for your clinic.
          <br />
          Before, during, and after every visit.
        </h1>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
          <p className="text-lg leading-snug text-slate sm:text-xl lg:flex-1 lg:text-lg xl:text-xl">
            AI agents run every visit, handling intake in 130+ languages, briefing doctors, drafting paperwork, sending referrals, scheduling follow ups, collecting reviews, and bringing patients back, with your team approving every step.
          </p>

          <HeroEmailCTA />
        </div>
      </div>
    </section>
  );
}

/* ── Tour ─────────────────────────────────────────────── */

function TourSection() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex justify-center">
          <MockupTour />
        </div>
      </div>
    </section>
  );
}

/* ── Social Proof ─────────────────────────────────────── */

function SocialProofSection() {
  const clinics = [
    "Riverside Family Medicine",
    "Pinewood Pediatrics",
    "Cedar Valley Health",
    "Aspen Family Practice",
    "Bayside Medical Group",
    "Crestwood Clinic",
    "Greenleaf Walk-In Care",
    "Heartland Primary Care",
    "Lakeshore Health Partners",
    "Maplewood Wellness",
    "Meridian Pediatrics",
    "Mountain View Internal Medicine",
    "Oakwood Family Care",
    "Parkside Urgent Care",
    "Pine Hill Medicine",
    "Sage Wellness Center",
    "Silvercreek Family Health",
    "Whitefield Pediatrics",
  ];

  return (
    <section className="bg-snow py-16 lg:py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <p className="mb-10 text-center text-xs font-semibold uppercase tracking-[0.2em] text-ash sm:text-sm">
            Trusted by clinics worldwide
          </p>
        </FadeIn>

        {/* Marquee */}
        <div
          className="relative mb-14 overflow-hidden"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          }}
          aria-hidden="true"
        >
          <div className="logo-carousel flex w-max gap-x-14">
            {[...clinics, ...clinics].map((name, i) => (
              <span key={i} className="shrink-0 whitespace-nowrap text-base font-medium tracking-tight text-slate sm:text-lg">
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Stats — inline, no card */}
        <FadeIn>
          <div className="flex flex-col items-center gap-7 text-center">
            <div className="flex flex-wrap items-end justify-center gap-x-14 gap-y-6 sm:gap-x-24">
              <div>
                <p className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">2M+</p>
                <p className="mt-1.5 text-sm font-medium text-ash">Patients Screened</p>
              </div>
              <div>
                <p className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">12 min</p>
                <p className="mt-1.5 text-sm font-medium text-ash">Saved Per Visit</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 text-sm sm:flex-row sm:gap-6">
              <div className="flex items-center gap-2">
                <svg className="shrink-0" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                </svg>
                <span className="text-slate">Avg intake drops from <span className="font-semibold text-ink">14 min to under 3</span></span>
              </div>
              <div className="hidden h-4 w-px bg-gray-300 sm:block" />
              <div className="flex items-center gap-2">
                <svg className="shrink-0" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span className="text-slate">Free data migration, <Link href="/migrate" className="font-semibold text-hilt-blue hover:underline">learn more</Link></span>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── AI Adoption Journey ──────────────────────────────── */

function AIJourneySection() {
  const tiers = [
    {
      level: "AI led",
      name: "Hands off intake.",
      blurb: "Patients scan, talk to the AI in their language, and approve their own summary before it reaches the doctor. The receptionist step can be skipped entirely. AI flags urgent or sensitive cases, so your staff only steps in when it matters.",
      tradeoff: "Fastest and most consistent. Cannot read body language or what a patient does not say.",
      borderClass: "border-blue-200",
      iconBg: "bg-blue-100",
      iconColor: "text-hilt-blue",
      footerBg: "bg-blue-50",
      featured: false,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
        </svg>
      ),
    },
    {
      level: "Hybrid",
      name: "AI asks. Your team decides.",
      blurb: "AI runs the conversation in any language. Your receptionist approves the visit, your nurse takes vitals and triages. The questions are AI. The decisions are yours.",
      tradeoff: "AI scale with human judgment. Most clinics land here.",
      borderClass: "border-violet-300",
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
      footerBg: "bg-violet-50",
      featured: true,
      featuredLabel: "Most common",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
      ),
    },
    {
      level: "Staff led",
      name: "Same intake. Smarter back office.",
      blurb: "Patients self check in via QR for basic info. Then your receptionist or nurse takes every medical history conversation, like before. AI keeps working in the back office: paperwork, follow ups, reviews, analytics, and reactivation.",
      tradeoff: "Warm and personal. Every minute of intake stays staff time.",
      borderClass: "border-green-200",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      footerBg: "bg-green-50",
      featured: false,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="bg-snow py-16 lg:py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-hilt-blue sm:text-sm">
            How much AI do you want?
          </p>
          <h2 className="mb-3 text-2xl font-bold text-ink sm:text-3xl md:text-4xl">
            Use as much AI as you want.<span className="text-hilt-blue"> Or as little.</span>
          </h2>
          <p className="mb-10 max-w-2xl text-base text-slate">
            Some clinics want patients to drive intake themselves. Others want every conversation to go through their staff. Hilt fits all three.
          </p>
        </FadeIn>

        <div className="grid items-stretch gap-4 md:grid-cols-3">
          {tiers.map((tier, i) => (
            <FadeIn key={tier.level} delay={i * 0.08} className="h-full">
              <div className={`relative flex h-full flex-col rounded-2xl border-2 ${tier.borderClass} bg-white p-5 transition-shadow ${tier.featured ? "shadow-lg ring-1 ring-violet-200/50" : "shadow-sm hover:shadow-md"}`}>
                {tier.featured && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-violet-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    {tier.featuredLabel}
                  </span>
                )}
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${tier.iconBg} ${tier.iconColor}`}>
                  {tier.icon}
                </div>
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-ash">
                  {tier.level}
                </p>
                <h3 className="mb-2 text-base font-semibold text-ink">
                  {tier.name}
                </h3>
                <p className="flex-1 text-sm leading-snug text-slate">
                  {tier.blurb}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Compact footer: per-location + Raven partnership */}
        <FadeIn delay={0.3}>
          <div className="mt-6 grid gap-4 rounded-2xl border border-gray-200 bg-snow/60 px-5 py-4 md:grid-cols-2 md:divide-x md:divide-gray-200 md:gap-0">
            <div className="md:pr-6">
              <p className="text-sm font-semibold text-ink">Customize per location</p>
              <p className="mt-1 text-xs leading-snug text-slate">
                Every feature toggles on or off per clinic. Custom workflows on request.
              </p>
            </div>
            <div className="md:pl-6">
              <p className="text-sm font-semibold text-ink">
                Add an AI receptionist <span className="font-normal text-ash">(optional)</span>
              </p>
              <p className="mt-1 text-xs leading-snug text-slate">
                Our partner{" "}
                <a href="https://ravenscheduler.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-hilt-blue hover:underline">
                  Raven Scheduler
                </a>{" "}
                answers every call, books appointments, and recovers no shows.
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── Raven Scheduler Partner ───────────────────────────── */

function RavenSchedulerSection() {
  return (
    <section className="bg-snow py-12 lg:py-16">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <a
            href="https://ravenscheduler.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl border border-violet-200 bg-violet-50/50 p-7 transition-colors hover:bg-violet-50/80 lg:flex lg:items-center lg:gap-10"
          >
            <div className="lg:flex-1 mb-6 lg:mb-0">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#7C3AED" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-ink">Partnered with Raven Scheduler</h3>
                <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-medium text-violet-700">Optional add on</span>
              </div>
              <p className="text-sm leading-relaxed text-slate mb-4">
                Hilt works great on its own, but if you want an AI receptionist too, Raven Scheduler plugs right in. It answers every call, books appointments, sends reminders, and follows up on no shows. When the patient walks in, Hilt already knows who they are and why they are here.
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                {[
                  { icon: "phone", label: "24/7 call answering", desc: "AI answers every call and books instantly" },
                  { icon: "chat", label: "SMS reminders", desc: "Confirmations and reminders, automatic" },
                  { icon: "arrow", label: "No show recovery", desc: "AI calls back missed patients" },
                  { icon: "list", label: "Waitlist management", desc: "Fills cancellations automatically" },
                ].map(f => (
                  <div key={f.label} className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-violet-100/80">
                      {f.icon === "phone" && (
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#7C3AED" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
                      )}
                      {f.icon === "chat" && (
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#7C3AED" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>
                      )}
                      {f.icon === "arrow" && (
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#7C3AED" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>
                      )}
                      {f.icon === "list" && (
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#7C3AED" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" /></svg>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-ink">{f.label}</p>
                      <p className="text-[9px] text-ash">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Mini phone call mockup */}
            <div className="lg:w-[280px] shrink-0 rounded-xl bg-white/80 p-4 ring-1 ring-violet-200/60">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <p className="text-[10px] font-semibold text-violet-800">Incoming call</p>
              </div>
              <div className="space-y-2.5">
                {[
                  { from: "ai", text: "Good morning, Riverside Family Medicine. How can I help?" },
                  { from: "caller", text: "I need to see Dr. Patel on Thursday" },
                  { from: "ai", text: "I have 10:15 AM and 2:30 PM open. Which works for you?" },
                  { from: "caller", text: "2:30 works" },
                  { from: "ai", text: "Booked with Dr. Patel, Thursday at 2:30. You will get a confirmation text shortly." },
                ].map((m, i) => (
                  <div key={i} className={`flex ${m.from === "caller" ? "justify-end" : "justify-start"}`}>
                    <div className={`rounded-lg px-2.5 py-1.5 max-w-[85%] ${m.from === "caller" ? "bg-violet-100 text-violet-900" : "bg-gray-100 text-ink"}`}>
                      <p className="text-[10px] leading-snug">{m.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </a>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── Before / After ───────────────────────────────────── */

function BeforeAfterSection() {
  return (
    <section className="bg-ink py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-hilt-blue">
            The problem
          </p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl leading-tight">
            Your clinic is losing more than you think.
          </h2>
        </FadeIn>

        <FadeIn delay={0.1}>
          <PainCards />
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="mt-10 text-center text-xl font-semibold text-blue-300">
            Hilt Health fixes every one of these.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── The Solution ─────────────────────────────────────── */

const PHASE_TONES: Record<string, string> = {
  BEFORE: "bg-amber-50 text-amber-700 ring-amber-200",
  DURING: "bg-blue-50 text-hilt-blue ring-blue-200",
  AFTER: "bg-green-50 text-green-700 ring-green-200",
  ONGOING: "bg-violet-50 text-violet-700 ring-violet-200",
};

const SOLUTION_AGENTS = [
  {
    name: "AI Intake",
    phase: "BEFORE",
    desc: "Voice or text in 130+ languages. Detects urgency and sensitive topics. Custom prompts per specialty.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    ),
  },
  {
    name: "AI Summary",
    phase: "DURING",
    desc: "Doctor reads the visit summary in their language. Patient records auto update with every visit.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
      </svg>
    ),
  },
  {
    name: "AI Suggestion",
    phase: "DURING",
    desc: "Suggests differentials from history, vitals, medications, and the visit. Doctor only, never shown to the patient.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
  },
  {
    name: "AI Paperwork",
    phase: "DURING",
    desc: "SOAP notes, sick notes, work letters drafted from the visit. Doctor edits, then signs.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
  {
    name: "Referrals",
    phase: "DURING",
    desc: "PDF with full visit history. Routes inside your clinic network or to any email. Auto matches incoming.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    name: "Follow up",
    phase: "AFTER",
    desc: "Doctor's instructions persist to the next visit.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
      </svg>
    ),
  },
  {
    name: "Reviews",
    phase: "AFTER",
    desc: "You set the star threshold. Above it, patients post to Google. Below, you see it first.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
      </svg>
    ),
  },
  {
    name: "AI Reactivation",
    phase: "ONGOING",
    desc: "Describe who to reach in plain English. AI scans medical histories. Per patient match reasoning, auditable.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3 2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75 2.25-1.313M12 21.75V19.5m0 2.25-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
      </svg>
    ),
  },
];

function AgentNode({
  name,
  desc,
  icon,
  phase,
  isLast,
}: {
  name: string;
  desc: string;
  icon: React.ReactNode;
  phase: string;
  isLast: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center text-center">
      {/* Desktop horizontal arrow to next agent */}
      {!isLast && (
        <div className="absolute left-[calc(50%+28px)] top-[26px] hidden h-1 w-[calc(100%-56px)] rounded-full bg-hilt-blue/20 lg:block">
          <svg
            className="absolute -right-1 -top-[4px] text-hilt-blue/60"
            width="12"
            height="12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      )}

      {/* Mobile vertical arrow to next agent */}
      {!isLast && (
        <div className="absolute left-1/2 top-[calc(100%+0.5rem)] h-6 w-px -translate-x-1/2 bg-hilt-blue/30 md:hidden">
          <svg
            className="absolute -bottom-1.5 -left-[5px] text-hilt-blue/60"
            width="12"
            height="12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      )}

      <span className={`absolute -top-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${PHASE_TONES[phase] ?? "bg-white text-ash ring-gray-200"}`}>
        {phase}
      </span>

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-hilt-blue to-blue-600 text-white shadow-lg shadow-hilt-blue/30 ring-4 ring-white">
        {icon}
      </div>

      <p className="mt-3 text-sm font-bold text-ink">{name}</p>
      <p className="mt-1.5 px-1 text-xs leading-snug text-slate">{desc}</p>
    </div>
  );
}

function PatientStart() {
  return (
    <div className="relative flex flex-col items-center text-center">
      <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow">
        Patient
      </span>

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-400/30 ring-4 ring-white">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      </div>

      <p className="mt-3 text-sm font-bold text-ink">Patient enters</p>
      <p className="mt-1.5 px-1 text-xs leading-snug text-slate">QR scan, tablet, or shared link</p>

      {/* Mobile vertical arrow into first agent */}
      <div className="absolute left-1/2 top-[calc(100%+0.5rem)] h-6 w-px -translate-x-1/2 bg-amber-400/40 md:hidden">
        <svg
          className="absolute -bottom-1.5 -left-[5px] text-amber-500/70"
          width="12"
          height="12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </div>

      {/* Desktop horizontal arrow into first agent */}
      <div className="absolute left-[calc(50%+28px)] top-[26px] hidden h-1 w-[calc(100%-56px)] rounded-full bg-amber-400/30 lg:block">
        <svg
          className="absolute -right-1 -top-[4px] text-amber-500/70"
          width="12"
          height="12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </div>
  );
}

function TheSolutionSection() {
  return (
    <section className="bg-gradient-to-b from-snow to-white py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <div className="mb-3 flex items-center gap-2.5">
            <p className="text-sm font-semibold uppercase tracking-wider text-hilt-blue">The solution</p>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-hilt-blue ring-1 ring-blue-200">
              Powered by AI
            </span>
          </div>
          <h2 className="text-3xl font-bold leading-tight text-ink sm:text-4xl lg:text-5xl">
            Eight AI agents. The entire visit, end to end.
          </h2>
          <p className="mt-4 max-w-[760px] text-lg leading-relaxed text-slate">
            <span className="font-semibold text-ink">Eight specialists, one visit.</span> Voice or text in 130+ languages, with real time urgency detection and custom prompts per specialty. Your team approves, signs, and supervises every step. Encrypted at rest and in transit. Row level security per clinic. Audit trails on every action.
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="mt-14">
            {/* Top trust band */}
            <div className="relative">
              <div className="rounded-t-2xl border border-b-0 border-gray-200 bg-white px-6 py-3">
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate">
                  <svg className="h-4 w-4 text-hilt-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                  </svg>
                  <span>
                    <span className="font-semibold text-ink">Your team</span> stays in charge. Approves, signs, and supervises every step.
                  </span>
                </div>
              </div>
              <div className="hidden grid-cols-9 lg:grid">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="flex justify-center">
                    <div className="h-3 w-px bg-gradient-to-b from-blue-200 to-transparent" />
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline: Patient + 7 agents */}
            <div className="border-x border-gray-200 bg-white px-3 py-10 shadow-sm lg:px-6 lg:py-12">
              <div className="relative grid grid-cols-1 gap-x-1 gap-y-10 md:grid-cols-2 lg:grid-cols-9">
                {/* Animated blue dot jumps through each agent step by step (desktop only) */}
                <div className="pipeline-progress hidden lg:block" aria-hidden="true" />
                <PatientStart />
                {SOLUTION_AGENTS.map((agent, i) => (
                  <AgentNode
                    key={agent.name}
                    name={agent.name}
                    desc={agent.desc}
                    icon={agent.icon}
                    phase={agent.phase}
                    isLast={i === SOLUTION_AGENTS.length - 1}
                  />
                ))}
              </div>

            </div>

            {/* Bottom analytics layer */}
            <div className="relative">
              <div className="hidden grid-cols-9 lg:grid">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="flex justify-center">
                    <div className="h-3 w-px bg-gradient-to-b from-transparent to-blue-300/60" />
                  </div>
                ))}
              </div>
              <div className="rounded-b-2xl bg-ink px-6 py-4 lg:px-8 lg:py-5">
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 ring-1 ring-blue-300/30">
                    <svg className="h-5 w-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="mb-0.5 flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-white">Analytics AI</p>
                      <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-300">
                        Always on
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-gray-300 sm:text-sm">
                      Every minute counted. Wait times at each step, throughput per doctor, return rates, follow-up compliance, and referrals. Per location, per doctor, per day.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── Built For Your Clinic ────────────────────────────── */

function BuiltForYourClinicSection() {
  return (
    <section className="cv-auto bg-snow pt-32 pb-0 lg:pt-40 lg:pb-0">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-7 lg:flex lg:items-center lg:gap-10">
            <div className="lg:flex-1 mb-6 lg:mb-0">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#0284C7" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-ink">Built around how your clinic works</h3>
              <p className="text-sm leading-relaxed text-slate mb-4">
                Every clinic is different. The toggles below are customizable features you can enable or disable per location, and we build custom workflows for clients who need them.
              </p>
              <ContactLink preselect="meet" className="inline-flex items-center gap-1.5 text-sm font-medium text-hilt-blue hover:underline">
                Meet with us
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                </svg>
              </ContactLink>
            </div>
            {/* Mini settings panel mockup */}
            <div className="lg:w-[280px] shrink-0 rounded-xl bg-white/80 p-4 ring-1 ring-sky-200/60">
              <p className="text-[10px] font-semibold text-sky-800 mb-3">Clinic features</p>
              <div className="space-y-2.5">
                {[
                  { label: "Nurse triage", desc: "Nurses screen before doctor", on: true },
                  { label: "Queue display", desc: "Waiting room TV with live numbers", on: false },
                  { label: "Review collection", desc: "Post visit feedback routing", on: false },
                  { label: "AI intake", desc: "AI screens patients before doctor", on: true },
                  { label: "Referral tracking", desc: "Ask patients who referred them", on: true },
                  { label: "Discovery source", desc: "Learn how new patients find you", on: false },
                ].map(f => (
                  <div key={f.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-ink">{f.label}</p>
                      <p className="text-[9px] text-ash">{f.desc}</p>
                    </div>
                    <div className={`h-5 w-9 rounded-full p-0.5 transition-colors ${f.on ? "bg-sky-500" : "bg-gray-200"}`}>
                      <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${f.on ? "translate-x-4" : "translate-x-0"}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </FadeIn>
      </div>
    </section>
  );
}

/* ── How to Set Up ────────────────────────────────────── */

function HowToSetUpSection() {
  const setupSteps = [
    {
      num: "01",
      title: "Create your account",
      desc: "Up to $200 in free credits. No card.",
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      ),
      accent: "bg-blue-50 text-blue-600 ring-blue-200/60",
    },
    {
      num: "02",
      title: "Add your locations",
      desc: "One QR per location. Your logo on it.",
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
      ),
      accent: "bg-violet-50 text-violet-600 ring-violet-200/60",
    },
    {
      num: "03",
      title: "Add your staff",
      desc: "About 30 seconds per staff member.",
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      ),
      accent: "bg-amber-50 text-amber-600 ring-amber-200/60",
    },
    {
      num: "04",
      title: "Print the QR and go",
      desc: "Print the PDF. Patients scan. Live.",
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m0 0a48.108 48.108 0 0 1 10.5 0m-10.5 0V6.75a2 2 0 0 1 2-2h6.5a2 2 0 0 1 2 2v.878" />
        </svg>
      ),
      accent: "bg-green-50 text-green-600 ring-green-200/60",
    },
  ];

  return (
    <section className="cv-auto bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-hilt-blue">
            How to set up
          </p>
          <h2 className="mb-4 text-3xl font-bold text-ink sm:text-4xl">
            Ready before your next patient.
          </h2>
          <p className="mb-12 max-w-lg text-lg text-slate">
            No onboarding calls, no IT department, no training sessions.
          </p>
        </FadeIn>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {setupSteps.map((s, i) => (
            <FadeIn key={s.num} delay={i * 0.08}>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm h-full">
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${s.accent}`}>
                  {s.icon}
                </div>
                <div className="mb-2 flex items-baseline gap-2">
                  <span className="text-xs font-bold tracking-wider text-ash">{s.num}</span>
                  <h3 className="text-sm font-semibold text-ink">{s.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate">{s.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.32}>
          <div className="mt-10 rounded-2xl border-2 border-hilt-blue/20 bg-gradient-to-br from-blue-50/50 to-white p-6 lg:p-8">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-hilt-blue/10 ring-1 ring-hilt-blue/20">
                  <svg className="h-5 w-5 text-hilt-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold text-ink sm:text-lg">Or do not lift a finger.</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate">
                    Book a consultation and we handle the entire setup for you.
                  </p>
                </div>
              </div>
              <a
                href="https://cal.com/102937474/hilt-health-meeting"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-hilt-blue px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-hilt-blue/25 transition-all hover:bg-hilt-blue-dark hover:shadow-xl hover:-translate-y-0.5"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                Book a Consultation
              </a>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── The Difference ───────────────────────────────────── */

function TheDifferenceSection() {
  const pillars = [
    {
      label: "Quality",
      title: "We get it right.",
      body: "Every doctor approval, patient correction, and outcome flows back into the model. Every visit makes the next one sharper.",
      iconBg: "bg-blue-100",
      iconColor: "text-hilt-blue",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      ),
    },
    {
      label: "Flexibility",
      title: "We get it right your way.",
      body: "Pick your AI and staff balance. Toggle every feature per location. Custom workflows, integrations, and specialty logic on request.",
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
        </svg>
      ),
    },
    {
      label: "Support",
      title: "We do it for you.",
      body: "Onboarding in days, not months. Real humans answer your questions. Training included for your front desk, nurses, and doctors.",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.343 18.073A6.971 6.971 0 0 1 12 15.75c2.305 0 4.367 1.114 5.657 2.823" />
        </svg>
      ),
    },
  ];

  return (
    <section className="bg-snow py-20 lg:py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-hilt-blue">
            The difference
          </p>
          <h2 className="mb-4 text-3xl font-bold text-ink sm:text-4xl">
            Punch above your weight.
            <br className="hidden sm:block" />
            <span className="text-hilt-blue"> Enterprise grade quality and support.</span>
          </h2>
          <p className="mb-14 max-w-2xl text-lg text-slate">
            The infrastructure, intelligence, and service usually reserved for hospital systems, now available to clinics of any size. Our quality flywheel makes sure every visit makes the next one better.
          </p>
        </FadeIn>

        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {pillars.map((p, i) => (
            <FadeIn key={p.label} delay={i * 0.1}>
              <div>
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${p.iconBg} ${p.iconColor}`}>
                  {p.icon}
                </div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-ash">
                  {p.label}
                </p>
                <h3 className="mb-2 text-xl font-semibold text-ink sm:text-2xl">
                  {p.title}
                </h3>
                <p className="text-base leading-relaxed text-slate">
                  {p.body}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Beyond the Visit ─────────────────────────────────── */

function BeyondTheVisitSection() {
  const starDistribution = [
    { stars: 5, pct: 78 },
    { stars: 4, pct: 14 },
    { stars: 3, pct: 5 },
    { stars: 2, pct: 2 },
    { stars: 1, pct: 1 },
  ];

  const referralSteps = [
    { label: "Sent", done: true },
    { label: "Viewed", done: true },
    { label: "Arrived", done: true },
    { label: "Completed", done: true },
  ];

  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-wider text-hilt-blue">
            After the visit
          </p>
          <h2 className="mb-4 text-center text-3xl font-bold text-ink sm:text-4xl">
            Most clinic software stops at checkout.
            <br className="hidden sm:block" />
            <span className="text-hilt-blue"> Hilt keeps working.</span>
          </h2>
          <p className="mx-auto mb-16 max-w-2xl text-center text-lg text-slate">
            The visit is 15 minutes. The relationship is years. Hilt automates what happens after the patient leaves so nothing falls through the cracks.
          </p>
        </FadeIn>

        <div className="grid gap-8 sm:grid-cols-2 items-stretch">
          {/* Reviews */}
          <FadeIn delay={0} className="h-full">
            <div className="h-full rounded-2xl border border-amber-200 bg-amber-50/50 p-5 flex flex-col">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#D97706" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-ink">Your online ratings go up</h3>
              <p className="text-xs leading-relaxed text-slate mb-4">
                Happy patients get guided to leave a public review on Google, Yelp, or wherever you need them. Lower ratings come to you privately so you can fix problems before they go online.
              </p>
              {/* Mini star distribution — single row */}
              <div className="mt-auto rounded-lg bg-white/80 p-3 ring-1 ring-amber-200/60">
                <p className="text-[9px] font-semibold text-amber-800 mb-2">This month</p>
                <div className="flex items-center gap-3">
                  {starDistribution.map(row => (
                    <div key={row.stars} className="flex items-center gap-1 text-[9px]">
                      <span className="font-medium text-ash">{row.stars}</span>
                      <svg className="h-2.5 w-2.5 shrink-0 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                      </svg>
                      <span className="tabular-nums text-ash">{row.pct}%</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[9px] text-amber-700 font-medium">48 reviews collected &middot; 37 sent to Google</p>
              </div>
              {/* Intercepted private feedback */}
              <div className="mt-2 rounded-lg bg-white/80 p-3 ring-1 ring-amber-200/60">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <svg className="h-2.5 w-2.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
                  </svg>
                  <p className="text-[9px] font-semibold text-amber-800">Caught privately</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex gap-0.5 shrink-0 mt-0.5">
                    {[1, 2].map(n => (
                      <svg key={n} className="h-2 w-2 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                      </svg>
                    ))}
                    {[3, 4, 5].map(n => (
                      <svg key={n} className="h-2 w-2 text-gray-200" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-[8px] leading-relaxed text-slate italic">&ldquo;Waited 40 minutes and no one told me about the delay.&rdquo;</p>
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-[8px] text-green-700 font-medium">
                  <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  Sent to your dashboard, not Google
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Follow-ups */}
          <FadeIn delay={0.12} className="h-full">
            <div className="h-full rounded-2xl border border-green-200 bg-green-50/50 p-5 flex flex-col">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-ink">Follow ups that remember everything</h3>
              <p className="text-xs leading-relaxed text-slate mb-4">
                Doctors tag follow ups with instructions for the AI. When the patient returns, the receptionist links it and the AI picks up with full memory of the original visit and the doctor's follow up notes.
              </p>
              {/* Mini follow-up flow */}
              <div className="mt-auto rounded-xl bg-white/80 p-4 ring-1 ring-green-200/60">
                <p className="text-[10px] font-semibold text-green-800 mb-3">How it works</p>
                <div className="flex items-center gap-0">
                  {/* Step 1: Visit */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <p className="mt-1.5 text-[9px] font-medium text-green-800">Visit</p>
                    <p className="text-[8px] text-ash">Completed</p>
                  </div>
                  <div className="h-0.5 flex-1 bg-green-300 -mt-4" />
                  {/* Step 2: Doctor tags */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <p className="mt-1.5 text-[9px] font-medium text-green-800">Doctor tags</p>
                    <p className="text-[8px] text-ash">Instructions</p>
                  </div>
                  <div className="h-0.5 flex-1 bg-green-300 -mt-4" />
                  {/* Step 3: AI continues */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <p className="mt-1.5 text-[9px] font-medium text-green-800">AI continues</p>
                    <p className="text-[8px] text-ash">On return</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Referrals */}
          <FadeIn delay={0.24} className="h-full">
            <div className="h-full rounded-2xl border border-purple-200 bg-purple-50/50 p-5 flex flex-col">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#7C3AED" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-ink">Zero lost referrals</h3>
              <p className="text-xs leading-relaxed text-slate mb-4">
                Refer a patient in seconds. The receiving clinic gets the full package: transcript, AI summary, diagnosis, notes, and attachments. You see when they arrive. No fax, no wondering.
              </p>
              {/* Mini referral tracker */}
              <div className="mt-auto rounded-xl bg-white/80 p-4 ring-1 ring-purple-200/60">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-semibold text-purple-800">Referral #1042</p>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-semibold text-green-700">Complete</span>
                </div>
                <div className="flex items-center gap-0">
                  {referralSteps.map((step, i) => (
                    <div key={step.label} className="contents">
                      {i > 0 && <div className="h-0.5 flex-1 bg-purple-300" />}
                      <div className="flex flex-col items-center">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500">
                          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                        <p className="mt-1 text-[9px] font-medium text-purple-800">{step.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[9px] text-ash">
                  <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Transcript, summary, diagnosis, notes, and attachments included
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Targeted Marketing SMS */}
          <FadeIn delay={0.36} className="h-full">
            <div className="h-full rounded-2xl border border-blue-200 bg-blue-50/50 p-5 flex flex-col">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" />
                </svg>
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-ink">Bring the right patients back</h3>
              <p className="text-xs leading-relaxed text-slate mb-4">
                Filter by age, sex, or visit history. Then let AI scan every conversation summary to find exactly who you need. Review the matches, write your message, send.
              </p>
              {/* Mini campaign mockup — mirrors actual UI */}
              <div className="mt-auto rounded-xl bg-white/80 p-4 ring-1 ring-blue-200/60">
                {/* Filters row */}
                <div className="flex gap-1.5 mb-2">
                  <div className="flex-1 rounded border border-gray-200 bg-gray-50 px-1.5 py-1">
                    <p className="text-[7px] text-ash">Age</p>
                    <p className="text-[9px] text-ink font-medium">50+</p>
                  </div>
                  <div className="flex-1 rounded border border-gray-200 bg-gray-50 px-1.5 py-1">
                    <p className="text-[7px] text-ash">Sex</p>
                    <p className="text-[9px] text-ink font-medium">Female</p>
                  </div>
                  <div className="flex-1 rounded border border-gray-200 bg-gray-50 px-1.5 py-1">
                    <p className="text-[7px] text-ash">Location</p>
                    <p className="text-[9px] text-ink font-medium">All locations</p>
                  </div>
                </div>
                {/* AI criteria */}
                <div className="rounded border border-blue-200 bg-blue-50/60 px-2 py-1.5 mb-2">
                  <p className="text-[7px] font-medium text-blue-600 mb-0.5">AI criteria</p>
                  <p className="text-[9px] text-ink italic">&ldquo;Mentioned joint pain or arthritis&rdquo;</p>
                </div>
                {/* Results */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-green-400" />
                    <p className="text-[9px] font-medium text-ink">31 patients matched</p>
                  </div>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[8px] font-medium text-green-700">Ready</span>
                </div>
                {/* Message preview */}
                <div className="rounded bg-gray-50 px-2 py-1.5 text-[9px] text-slate mb-1.5">
                  Hi &#123;first_name&#125;, &#123;clinic_name&#125; now offers orthopedic services. Call us to book.
                </div>
                {/* Send button */}
                <div className="rounded bg-hilt-blue py-1 text-center text-[8px] font-semibold text-white">
                  Send to 31 Patients
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ── Trust + Control ──────────────────────────────────── */

function TrustAndControlSection() {
  const badges = [
    { label: "PHIPA & PIPEDA compliant", icon: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" },
    { label: "End to end encrypted", icon: "M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" },
{ label: "Role based access controls", icon: "M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" },
    { label: "Full audit trail", icon: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" },
  ];

  const controls = [
    {
      title: "Doctors see everything",
      desc: "Full transcript, summary, and AI analysis, all visible to the doctor.",
      icon: "M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
    },
    {
      title: "AI never diagnoses",
      desc: "Diagnostics and clinical notes are doctor eyes only. Patients see only the intake conversation.",
      icon: "M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z",
    },
    {
      title: "Patient approves first",
      desc: "Summary reviewed and confirmed before it reaches the doctor.",
      icon: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    },
  ];

  return (
    <section className="cv-auto bg-white pt-32 pb-24 lg:pt-40 lg:pb-32 border-y border-gray-100">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-hilt-blue">
            Trust and control
          </p>
          <h2 className="mb-3 text-3xl font-bold text-ink sm:text-4xl">
            The AI prepares. The doctor decides.
          </h2>
          <p className="mb-12 max-w-xl text-lg text-slate">
            AI gathers, drafts, and translates. Doctors review, decide, and sign. Patients never hear a diagnosis or treatment from AI.
          </p>
        </FadeIn>

        {/* Trust badges */}
        <FadeIn>
          <div className="mb-12 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {badges.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-full bg-snow px-4 py-2.5 text-sm font-medium text-slate shadow-sm"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d={b.icon} />
                </svg>
                {b.label}
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Control points */}
        <div className="grid gap-6 sm:grid-cols-3 items-stretch">
          {controls.map((c, i) => (
            <FadeIn key={i} delay={i * 0.1} className="h-full">
              <div className="h-full rounded-xl border border-gray-100 bg-white p-6 text-center flex flex-col">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-hilt-blue/10">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
                  </svg>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-ink">{c.title}</h3>
                <p className="text-sm leading-relaxed text-slate">{c.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing Hint ─────────────────────────────────────── */

function PricingHintSection() {
  return (
    <section className="cv-auto bg-snow py-24 lg:py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <p className="text-3xl font-bold text-ink sm:text-4xl">
            As low as $99/month for unlimited patients
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-hilt-blue hover:underline"
          >
            See full pricing
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── Apply ────────────────────────────────────────────── */

function ApplySection() {
  return (
    <section id="contact" className="cv-auto bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-[1100px] px-6">
        <FadeIn>
          <SignUpForm />
        </FadeIn>
      </div>
    </section>
  );
}

/* ── Footer ───────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="cv-auto bg-white py-12 border-t border-gray-100">
      <div className="mx-auto max-w-[1200px] px-6 text-center">
        <p className="mb-4 text-2xl font-bold text-hilt-blue tracking-tight">Hilt Health</p>
        <div className="mb-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ash">
          <Link href="/blog" className="hover:text-slate transition-colors">Blog</Link>
          <Link href="/privacy" className="hover:text-slate transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-slate transition-colors">Terms of Service</Link>
          <Link href="/pricing" className="hover:text-slate transition-colors">Pricing</Link>
          <a href="mailto:business@hilthealth.com" className="hover:text-slate transition-colors">
            business@hilthealth.com
          </a>
        </div>
        <p className="mt-2 text-xs text-ash">
          Powered by{" "}
          <a href="https://veldsystems.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate transition-colors underline">
            veldsystems.com
          </a>
        </p>
      </div>
    </footer>
  );
}

/* ── Page ─────────────────────────────────────────────── */

export default async function Home() {
  return (
    <>
      <Suspense><TeamCodeCapture /></Suspense>
      <main>
        <HeroSection />
        <TourSection />
        <SocialProofSection />
        <BeforeAfterSection />
        <TheSolutionSection />
        <AIJourneySection />
        <HowToSetUpSection />
        <TheDifferenceSection />
        <TrustAndControlSection />
        <PricingHintSection />
        <ApplySection />
      </main>
      <Footer />
    </>
  );
}
