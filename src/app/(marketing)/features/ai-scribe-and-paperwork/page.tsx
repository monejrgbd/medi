import { Suspense } from "react";
import Link from "next/link";
import FadeIn from "@/components/FadeIn";
import MockupTour from "@/components/marketing/MockupTour";
import OpenDemoButton from "@/components/marketing/OpenDemoButton";
import SectionLink from "@/components/marketing/SectionLink";

export const metadata = {
  title: "AI Medical Scribe & Paperwork for Clinics | Hilt Health",
  description:
    "An AI medical scribe that drafts your SOAP notes, sick notes, and letters from the visit. You edit and sign. Works with your EMR. $200 free trial.",
};

const CAL_URL = "https://cal.com/102937474/hilt-health-meeting";
const SIGNUP_URL = "/signup";

/* ── Icons (one cohesive stroke set) ──────────────────── */

type IconProps = { className?: string };
const sw = 1.6;

const IconForm = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
  </svg>
);
const IconChat = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
  </svg>
);
const IconApprove = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.249-8.25-3.285Z" />
  </svg>
);
const IconDoctor = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
  </svg>
);
const IconUsers = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>
);
const IconCheck = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);
const IconArrow = ({ className }: IconProps) => (
  <svg className={className} width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);
const IconClock = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
const IconSparkle = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
  </svg>
);
const IconMail = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 0 0-2.134 0l-1.022.55m0 0-4.661 2.51m16.5 1.615a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V8.844a2.25 2.25 0 0 1 1.183-1.981l7.5-4.039a2.25 2.25 0 0 1 2.134 0l7.5 4.039a2.25 2.25 0 0 1 1.183 1.98V19.5Z" />
  </svg>
);
const IconGlobe = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

/* ── Editorial primitives ─────────────────────────────── */

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${light ? "text-white/55" : "text-hilt-blue/80"}`}>
      {children}
    </p>
  );
}

function FlowRule({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`mx-auto block h-[3px] w-14 rounded-full ${className}`}
      style={{ background: "linear-gradient(90deg, #2563EB, #059669)" }}
    />
  );
}

/* ── Atmosphere ───────────────────────────────────────── */

function Aurora({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        className="intake-aurora absolute -top-1/3 left-1/4 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.20), transparent 62%)" }}
      />
      <div
        className="intake-aurora absolute -bottom-1/3 right-0 h-[34rem] w-[34rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(5,150,105,0.12), transparent 60%)", animationDelay: "-8s" }}
      />
    </div>
  );
}

function GridGrain({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}>
      <defs>
        <pattern id="ig-grid" width="34" height="34" patternUnits="userSpaceOnUse">
          <path d="M34 0H0V34" fill="none" stroke="#111827" strokeOpacity="0.04" strokeWidth="1" />
        </pattern>
        <filter id="ig-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#ig-grid)" />
      <rect width="100%" height="100%" filter="url(#ig-grain)" opacity="0.025" />
    </svg>
  );
}

/* ── Shared CTA ───────────────────────────────────────── */

function PrimaryCTA({ className = "" }: { className?: string }) {
  return (
    <a
      href={CAL_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center gap-2 rounded-xl bg-hilt-blue px-8 py-4 text-base font-semibold text-white shadow-lg shadow-hilt-blue/25 transition-all hover:bg-hilt-blue-dark hover:shadow-xl hover:-translate-y-0.5 ${className}`}
    >
      Book a consultation
      <IconArrow className="transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}

/* ── Signature scribe flow ────────────────────────────── */

type Tone = "blue" | "green" | "solid" | "ai";

const FLOW: { n: string; title: string; line: string; Icon: React.ComponentType<IconProps>; tone: Tone; tag?: string }[] = [
  { n: "01", title: "Visit happens", line: "Record it, or type and dictate. Works even for a walk in with no AI screening.", Icon: IconChat, tone: "blue" },
  { n: "02", title: "AI drafts the SOAP note", line: "Assembled from the visit. Your sections, your style.", Icon: IconSparkle, tone: "blue" },
  { n: "03", title: "Letters drafted too", line: "Sick notes, return to work, school, travel, disability. One click each.", Icon: IconForm, tone: "blue" },
  { n: "04", title: "You edit", line: "Everything is editable. Nothing is locked.", Icon: IconApprove, tone: "green" },
  { n: "05", title: "Doctor signs", line: "Attestation recorded with a timestamp.", Icon: IconDoctor, tone: "solid" },
  { n: "06", title: "Into your EMR", line: "Clean paste to any EMR, or sent to the patient by SMS.", Icon: IconCheck, tone: "green" },
];

const NODE_TILE: Record<Tone, string> = {
  blue: "border-gray-200 bg-white text-hilt-blue",
  green: "border-green-600/30 bg-white text-green-600",
  solid: "border-hilt-blue bg-hilt-blue text-white",
  ai: "border-violet-200 bg-white text-violet-600",
};
const NODE_BADGE: Record<Tone, string> = {
  blue: "bg-hilt-blue text-white",
  green: "bg-green-600 text-white",
  solid: "bg-white text-hilt-blue",
  ai: "bg-violet-600 text-white",
};

/* ── Hero ─────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-snow pt-28 pb-24 lg:pt-36 lg:pb-28">
      <Aurora />
      <GridGrain />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-64"
        style={{ background: "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(37,99,235,0.10), transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[1fr_minmax(440px,1fr)] lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-hilt-blue">
                AI scribe + paperwork
              </p>
              <h1 className="mt-5 text-[1.95rem] font-bold leading-[1.1] tracking-tight text-ink sm:text-4xl lg:text-[2.8rem]">
                The AI medical scribe that finishes the note{" "}
                <span className="text-hilt-blue">the moment the visit ends</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-slate">
                Drafts the note and the letters from the visit. You edit and sign. Works with your EMR.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <PrimaryCTA />
                <OpenDemoButton variant="light" />
              </div>
              <p className="mt-4 text-sm text-ash">$200 in free credits. No credit card.</p>
              <Link
                href={SIGNUP_URL}
                className="mt-1.5 inline-block text-xs text-ash/70 underline decoration-gray-300 underline-offset-2 transition-colors hover:text-slate"
              >
                or do it yourself
              </Link>
              <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ash">
                {[
                  "2M+ visits processed",
                  "About 8 minutes saved per patient",
                  "PHIPA, PIPEDA, HIPAA compliant",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <IconCheck className="h-3.5 w-3.5 shrink-0 text-green-600" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white/70 p-6 shadow-[0_30px_70px_-25px_rgba(37,99,235,0.3)] ring-1 ring-gray-900/5 backdrop-blur-sm sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-hilt-blue">How the scribe works</p>
              <ol className="relative mt-5 space-y-4">
                <span
                  aria-hidden="true"
                  className="absolute bottom-6 left-[21px] top-6 w-[2px] rounded-full"
                  style={{ background: "linear-gradient(180deg, #2563EB, #059669, #2563EB, #7C3AED)" }}
                />
                {FLOW.map(({ n, title, line, Icon, tone, tag }) => (
                  <li key={n} className="relative flex items-start gap-4">
                    <div
                      className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${NODE_TILE[tone]}`}
                    >
                      <Icon className="h-5 w-5" />
                      <span
                        className={`absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${NODE_BADGE[tone]}`}
                      >
                        {n}
                      </span>
                    </div>
                    <div className="pt-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-ink">{title}</h3>
                        {tag && (
                          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-violet-600">
                            {tag}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate">{line}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── The cost of charting today ───────────────────────── */

const COST = [
  {
    Icon: IconClock,
    title: "Charting follows you home",
    body: "More than 15 hours a week on paperwork, per the AMA. Nearly two clinic days, gone.",
  },
  {
    Icon: IconUsers,
    title: "You see fewer patients",
    body: "Minutes lost in every visit are appointments you cannot offer.",
  },
  {
    Icon: IconForm,
    title: "Letters go unbilled",
    body: "Every sick note and work letter interrupts the day, mostly unpaid.",
  },
  {
    Icon: IconDoctor,
    title: "Burnout, then turnover",
    body: "A top driver of burnout. Replacing a doctor costs far more than the typing.",
  },
];

function Cost() {
  return (
    <section className="relative overflow-hidden bg-ink py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(37,99,235,0.20), transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <div className="text-center">
            <Eyebrow light>The cost of charting today</Eyebrow>
            <FlowRule className="mt-4" />
          </div>
        </FadeIn>
        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {COST.map(({ Icon, title, body }, i) => (
            <FadeIn key={title} delay={i * 0.08}>
              <div className="flex h-full flex-col bg-ink p-8 sm:p-10">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <Icon className="h-6 w-6" />
                </span>
                <h2 className="mt-5 text-2xl font-bold text-white">{title}</h2>
                <p className="mt-2 leading-relaxed text-white/60">{body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── The solution (deep dive) ─────────────────────────── */

const SOLUTION: { title: string; desc: string; points: string[]; Icon: React.ComponentType<IconProps> }[] = [
  {
    title: "The SOAP note",
    desc: "Subjective, Objective, Assessment, and Plan, assembled from the visit.",
    points: [
      "Record it, or type and dictate",
      "Voice or text for your exam findings",
      "Your sections, your style",
    ],
    Icon: IconForm,
  },
  {
    title: "The letters suite",
    desc: "Sick notes, return to work, school, work, travel, and disability letters.",
    points: [
      "One click per letter from the visit",
      "Your branding and credentials on each",
      "Sent to the patient by SMS, optional PIN",
    ],
    Icon: IconMail,
  },
  {
    title: "Your EMR, your languages",
    desc: "Pastes clean into Epic, Athena, Cerner, and others. 130+ languages.",
    points: [
      "Any EMR that accepts text",
      "One way or two way connection on request",
      "Patient reads it in their language",
    ],
    Icon: IconGlobe,
  },
];

function Solution() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <div className="text-center">
            <Eyebrow>What the scribe does</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              From the visit to a signed note, in minutes
            </h2>
          </div>
        </FadeIn>
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {SOLUTION.map((b, i) => (
            <FadeIn key={b.title} delay={i * 0.07}>
              <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-hilt-blue/10 text-hilt-blue">
                  <b.Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-xl font-bold text-ink">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">{b.desc}</p>
                <ul className="mt-4 space-y-2">
                  {b.points.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span className="text-sm text-slate">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Outcomes ─────────────────────────────────────────── */

const OUTCOMES: { stat: string; label: string; sub: string; accent: string }[] = [
  { stat: "0", label: "notes left for after hours", sub: "Done by the time you stand up.", accent: "text-green-600" },
  { stat: "~8 min", label: "back per patient", sub: "Every visit, on the clinic average.", accent: "text-hilt-blue" },
  { stat: "~8 hrs", label: "back per week", sub: "Illustrative: a 20 patient day with 10 letters.", accent: "text-hilt-blue" },
];

function Outcomes() {
  return (
    <section className="bg-snow py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <div className="text-center">
            <Eyebrow>What changes</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">What this gives you back</h2>
          </div>
        </FadeIn>
        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          {OUTCOMES.map((o, i) => (
            <FadeIn key={o.label} delay={i * 0.08}>
              <div className="h-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                <p className={`text-4xl font-bold ${o.accent}`}>{o.stat}</p>
                <p className="mt-2 text-sm font-semibold text-ink">{o.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate">{o.sub}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── See it yourself (real homepage demo) ─────────────── */

function DemoBand() {
  return (
    <section className="relative overflow-hidden bg-white py-24">
      <GridGrain />
      <div className="relative mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <FadeIn>
            <div>
              <Eyebrow>See it yourself</Eyebrow>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">No signup. Sixty seconds.</h2>
              <p className="mt-4 max-w-md text-lg text-slate">
                Be the patient, or click through every screen your staff and doctors see.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Live demo: talk to the AI yourself",
                  "Quick demo: every screen, one tap at a time",
                  "Or book a call and we walk you through it",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2.5 text-sm text-slate">
                    <IconCheck className="h-4 w-4 shrink-0 text-green-600" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="flex justify-center lg:justify-end">
              <Suspense
                fallback={
                  <div className="h-[300px] w-full max-w-xl rounded-2xl bg-gradient-to-br from-hilt-blue via-blue-700 to-indigo-900 sm:h-[340px]" />
                }
              >
                <MockupTour className="!min-h-[300px] !max-w-xl !rounded-2xl sm:!min-h-[340px]" />
              </Suspense>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ── Objection band ───────────────────────────────────── */

function ObjectionBand() {
  return (
    <section className="bg-snow py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 text-center sm:p-10">
            <p className="text-xl font-medium leading-relaxed text-ink sm:text-2xl">
              Afraid it will invent things? It writes only from what was said in the visit, and
              nothing is filed until you sign it.{" "}
              <span className="text-hilt-blue">Your signature is the only thing that makes it a record.</span>
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── Trust and control (mechanism-as-proof until real
      testimonials exist) ──────────────────────────────── */

const TRUST_BADGES = [
  "PHIPA, PIPEDA, HIPAA & more compliant",
  "End to end encrypted",
  "Role based access controls",
  "Full audit trail",
];

const CONTROL_POINTS = [
  { Icon: IconApprove, title: "You edit every draft", body: "Nothing is locked. Change anything before you sign." },
  { Icon: IconDoctor, title: "The doctor signs", body: "Attestation is recorded with a timestamp. The AI is never the author of record." },
  { Icon: IconCheck, title: "Nothing is hidden", body: "Full audit trail for every document created, edited, and delivered." },
];

function TrustControl() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <div className="text-center">
            <Eyebrow>Trust and control</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              The AI drafts. The doctor signs.
            </h2>
            <div className="mt-7 flex flex-wrap justify-center gap-2.5">
              {TRUST_BADGES.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 rounded-full border border-hilt-blue/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-hilt-blue"
                >
                  <IconCheck className="h-3.5 w-3.5" />
                  {b}
                </span>
              ))}
            </div>
          </div>
        </FadeIn>
        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-y-10 sm:grid-cols-3 sm:gap-y-0 sm:divide-x sm:divide-gray-200">
          {CONTROL_POINTS.map(({ Icon, title, body }, i) => (
            <FadeIn key={title} delay={i * 0.07}>
              <div className="px-0 text-center sm:px-8">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-hilt-blue/10 text-hilt-blue">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">{body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Already included (no add on fees) ────────────────── */

const INCLUDED_ITEMS = [
  "Clinical visit summaries",
  "Referrals with full PDF package",
  "SOAP notes from the visit",
  "Visit notes and annotations",
  "File attachments per visit",
  "Vaccine records",
  "Follow up instructions",
  "Full audit trail",
];

function AlreadyIncluded() {
  return (
    <section className="bg-snow py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <div className="text-center">
            <Eyebrow>No add on fees</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Already included on every plan
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate">
              No per document charges. The full documentation suite from day one.
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={0.08}>
          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            {INCLUDED_ITEMS.map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <span className="text-sm text-slate">{item}</span>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── Tie to the system ────────────────────────────────── */

function TieToSystem() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <FadeIn>
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Hilt Health has nine AI agents. The scribe is one.
          </h2>
          <p className="mt-4 text-lg text-slate">
            The rest handle intake, referrals, follow ups, reviews, and bringing patients back. Your
            team approves every step.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-hilt-blue">
            <SectionLink to="/" section="problem" className="inline-flex items-center gap-1 hover:underline">
              See the full system <IconArrow className="h-4 w-4" />
            </SectionLink>
            <Link href="/features/patient-intake" className="inline-flex items-center gap-1 hover:underline">
              AI patient intake <IconArrow className="h-4 w-4" />
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── Setup (connected stepper) ────────────────────────── */

const SETUP_STEPS = [
  { n: "1", title: "Create your account", body: "Up to $200 in free credits. No card." },
  { n: "2", title: "Add your doctors", body: "License and credentials go on every letter." },
  { n: "3", title: "Pick your templates", body: "Your SOAP layout and your letter set." },
  { n: "4", title: "Tell the AI how you chart", body: "Your sections, your style, your phrasing." },
  { n: "5", title: "See your first patient", body: "It works from the first visit." },
];

function Setup() {
  return (
    <section className="bg-snow py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <div className="text-center">
            <Eyebrow>Get started</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Drafting before your next patient
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate">Most clinics are live the same day.</p>
          </div>
        </FadeIn>

        <FadeIn delay={0.08}>
          <div className="relative mt-16">
            <span
              aria-hidden="true"
              className="absolute left-[10%] right-[10%] top-[14px] h-[2px] bg-gray-200 sm:top-4"
            />
            <ol className="grid grid-cols-5 gap-2 sm:gap-4 lg:gap-6">
              {SETUP_STEPS.map((step) => (
                <li key={step.n} className="relative flex flex-col items-center text-center">
                  <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-hilt-blue text-[10px] font-bold text-white ring-4 ring-snow sm:h-8 sm:w-8 sm:text-[11px]">
                    {step.n}
                  </span>
                  <h3 className="mt-3 text-[11px] font-semibold leading-tight text-ink sm:mt-4 sm:text-sm">{step.title}</h3>
                  <p className="mt-1 text-[10px] leading-snug text-slate sm:mt-2 sm:text-xs">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </FadeIn>

        <FadeIn delay={0.14}>
          <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-hilt-blue/15 bg-gradient-to-br from-blue-50/70 to-white p-8 text-center">
            <p className="text-lg font-semibold text-ink">Rather not do it alone?</p>
            <p className="mt-2 text-slate">Book a consultation and we will be with you during setup.</p>
            <div className="mt-6 flex justify-center">
              <PrimaryCTA />
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── FAQ ──────────────────────────────────────────────── */

const FAQS: { q: string; a: string; href?: string; linkText?: string }[] = [
  {
    q: "Will the note be accurate, or will it make things up?",
    a: "It writes only from what was said in the visit. If something is missing, it flags it rather than guess. You edit every draft, and nothing is a record until you sign it.",
  },
  {
    q: "Do I have to record the visit?",
    a: "No. Record it, or type and dictate. It also works for a walk in with no AI screening. However the visit happens, the draft is built from it.",
  },
  {
    q: "Does this work with my EMR?",
    a: "Yes. The note is formatted for clean paste into Epic, Athena, Cerner, and others. Ask our team to enable a one way or two way EMR connection for your clinic.",
  },
  {
    q: "Is this HIPAA and PHIPA compliant?",
    a: "Yes. We maintain BAAs with every AI and infrastructure provider. All data is encrypted in transit and at rest, with role based access and a full audit trail.",
  },
  {
    q: "What languages does it cover?",
    a: "130+ languages. The patient can get their sick note or letter in their language while you get the SOAP note in yours.",
  },
  {
    q: "How much does it cost?",
    a: "Plans start at $79 per provider per month. Clinical documents are included on every plan, with no per document fees.",
    href: "/pricing",
    linkText: "See full pricing",
  },
];

function FAQSection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-2xl px-6">
        <FadeIn>
          <div className="mb-10 text-center">
            <Eyebrow>Questions</Eyebrow>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Questions clinics ask first</h2>
          </div>
        </FadeIn>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <FadeIn key={i} delay={i * 0.05}>
              <details className="group rounded-xl border border-gray-200 bg-white p-5 transition-colors open:border-hilt-blue/30">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                  {faq.q}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-ash transition-all group-open:rotate-45 group-open:bg-hilt-blue group-open:text-white">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-slate">{faq.a}</p>
                {faq.href && (
                  <Link
                    href={faq.href}
                    className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-hilt-blue hover:underline"
                  >
                    {faq.linkText} <IconArrow className="h-4 w-4" />
                  </Link>
                )}
              </details>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ────────────────────────────────────────── */

function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-ink py-28">
      <Aurora />
      <GridGrain className="opacity-60" />
      <div className="relative mx-auto max-w-[1200px] px-6 text-center">
        <FadeIn>
          <Eyebrow light>Get started</Eyebrow>
          <h2 className="mx-auto mt-5 max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
            See it draft your next note.
          </h2>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <PrimaryCTA />
            <OpenDemoButton variant="dark" />
          </div>
          <p className="mt-4 text-sm text-white/55">$200 in free credits, no credit card.</p>
          <Link
            href={SIGNUP_URL}
            className="mt-3 inline-block text-sm text-white/55 underline decoration-white/25 underline-offset-4 transition-colors hover:text-white/80"
          >
            Prefer to start on your own? Start the free trial &rarr;
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── Footer (verbatim from homepage) ──────────────────── */

function Footer() {
  return (
    <footer className="bg-white py-12 border-t border-gray-100">
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

/* ── Sticky mobile CTA ────────────────────────────────── */

function StickyMobileCTA() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 p-3 backdrop-blur lg:hidden">
      <a
        href={CAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-hilt-blue px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-hilt-blue/25"
      >
        Book a consultation
        <IconArrow />
      </a>
    </div>
  );
}

/* ── Structured data ──────────────────────────────────── */

function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Hilt Health AI Medical Scribe",
        applicationCategory: "HealthApplication",
        operatingSystem: "Web",
        description:
          "AI medical scribe and clinical paperwork software. It records the visit and drafts the SOAP note, sick notes, and work letters in 130+ languages. The doctor edits and signs. Works with any EMR.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free trial with up to $200 in credits, no credit card" },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

/* ── Page ─────────────────────────────────────────────── */

export default function AiScribeAndPaperworkFeaturePage() {
  return (
    <main>
      <StructuredData />
      <Hero />
      <Cost />
      <Solution />
      <Outcomes />
      <DemoBand />
      <ObjectionBand />
      <TrustControl />
      <AlreadyIncluded />
      <TieToSystem />
      <Setup />
      <FAQSection />
      <FinalCTA />
      <Footer />
      <div className="h-20 lg:hidden" aria-hidden="true" />
      <StickyMobileCTA />
    </main>
  );
}
