import Link from "next/link";
import SignUpForm from "@/components/SignUpForm";
import FadeIn from "@/components/FadeIn";
import DoctorMockup from "@/components/marketing/DoctorMockup";
import { getAllPosts } from "@/lib/blog";

/* ── Hero ─────────────────────────────────────────────── */

function ChatMockup() {
  const chatMessages = [
    { role: "ai", text: "Hi Sarah, welcome back! Last time you came in for knee pain. Is today\u2019s visit related?", time: "9:03 AM", delay: "0.5s" },
    { role: "patient", text: "Yes, it is worse now and my hands are stiff every morning too", time: "9:04 AM", delay: "1.8s" },
    { role: "ai", text: "How long does the morning stiffness last? Any swelling or redness?", time: "9:05 AM", delay: "3.2s" },
    { role: "patient", text: "About an hour each morning. My knuckles have been a bit swollen", time: "9:06 AM", delay: "4.6s" },
  ];

  return (
    <div className="space-y-3">
      {/* Chat card */}
      <div className="w-[300px] sm:w-[340px] rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl ring-1 ring-gray-900/5">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-hilt-blue" />
          <span className="text-xs font-semibold text-hilt-blue">Hilt Health</span>
        </div>
        <div className="space-y-2.5">
          {chatMessages.map((m, i) => (
            <div
              key={i}
              className={`hero-msg ${m.role === "patient" ? "ml-6" : ""}`}
              style={{ "--delay": m.delay } as React.CSSProperties}
            >
              <div className={`rounded-xl px-3 py-2.5 ${m.role === "patient" ? "bg-hilt-blue/10" : "bg-snow"}`}>
                <p className={`text-sm leading-relaxed ${m.role === "patient" ? "text-ink" : "text-slate"}`}>
                  {m.text}
                </p>
              </div>
              <p className={`mt-0.5 text-[9px] text-ash ${m.role === "patient" ? "text-right" : ""}`}>{m.time}</p>
            </div>
          ))}
          <div
            className="hero-msg flex items-center gap-2 pt-1"
            style={{ "--delay": "6s" } as React.CSSProperties}
          >
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-hilt-blue" />
            <span className="text-[11px] text-ash">Hilt Health is typing...</span>
          </div>
          <div
            className="hero-msg flex items-center justify-center pt-2 text-[10px] text-ash"
            style={{ "--delay": "6.3s" } as React.CSSProperties}
          >
            10 more messages
          </div>
        </div>
      </div>

      {/* Arrow: chat → summary (scroll-based) */}
      <FadeIn>
        <div className="flex justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-900/5">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
            </svg>
          </div>
        </div>
      </FadeIn>

      {/* Summary confirmation card (scroll-based) */}
      <FadeIn delay={0.1}>
        <div className="w-[300px] sm:w-[340px] rounded-2xl border border-green-200 bg-green-50 p-5 shadow-xl ring-1 ring-green-900/5">
          <p className="text-[10px] font-semibold text-green-700 mb-2">Summary for your approval</p>
          <p className="text-sm leading-relaxed text-green-900 mb-3">
            Returning patient with worsening knee pain, new morning stiffness in hands lasting about 1 hour, and knuckle swelling. Ibuprofen provides partial relief. Fatigue reported. Family history of rheumatoid arthritis.
          </p>
          {/* Medical info on file */}
          <div className="rounded-lg bg-white/60 p-2.5 mb-3">
            <p className="text-[9px] font-semibold text-green-800 mb-1.5">Your information on file</p>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div>
                <p className="font-medium text-slate">Meds</p>
                <p className="text-ink">Ibuprofen</p>
              </div>
              <div>
                <p className="font-medium text-red-600">Allergies</p>
                <p className="text-ink">Penicillin</p>
              </div>
              <div>
                <p className="font-medium text-slate">Chronic</p>
                <p className="text-ash">None</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 rounded-lg border border-green-300 bg-white py-2 text-center text-xs font-medium text-green-700">
              Something is not right
            </div>
            <div className="flex-1 rounded-lg bg-green-600 py-2 text-center text-xs font-semibold text-white">
              This is accurate ✓
            </div>
          </div>
          <p className="mt-2 text-[9px] text-right text-ash">9:09 AM</p>
        </div>
      </FadeIn>
    </div>
  );
}


function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 to-white pt-24 pb-8 lg:pt-32 lg:pb-10">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid items-start gap-16 lg:grid-cols-2 lg:pt-8">
          {/* Copy */}
          <div>
            <h1 className="mb-4 text-5xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              Patients describe
              <br />
              symptoms to AI.
              <br />
              <span className="text-hilt-blue">Doctors read
              <br />
              the summary.</span>
            </h1>
            <p className="mb-8 text-lg text-slate sm:text-xl">
              Your doctor walks in prepared. In 130+ languages.
            </p>
            {/* Trial options */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2 max-w-lg">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-sm font-bold text-ink">Standard Trial</p>
                <p className="mt-1 text-xs text-slate">$20 USD in credits · 14 days</p>
                <p className="text-xs text-slate">Full access to all features</p>
                <p className="text-xs text-slate">No card required</p>
                <Link
                  href="/signup"
                  className="mt-3 block rounded-lg bg-hilt-blue py-2.5 text-center text-sm font-semibold text-white shadow-md shadow-hilt-blue/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  Start Now
                </Link>
              </div>
              <div className="rounded-xl border-2 border-hilt-blue bg-hilt-blue/5 p-5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-ink">Premium Trial</p>
                  <span className="rounded-full bg-hilt-blue px-2 py-0.5 text-[9px] font-semibold text-white">Recommended</span>
                </div>
                <p className="mt-1 text-xs text-slate">$200 USD in credits · 30 days</p>
                <p className="text-xs text-slate">Full access to all features</p>
                <a
                  href="#contact"
                  className="mt-3 block rounded-lg border-2 border-hilt-blue py-2.5 text-center text-sm font-semibold text-hilt-blue transition-all hover:bg-hilt-blue hover:text-white"
                >
                  Apply for Access
                </a>
              </div>
            </div>
            <Link
              href="/pricing"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-hilt-blue transition-colors hover:text-hilt-blue-dark"
            >
              See full pricing
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>

          {/* Patient flow: chat → summary (phone-sized, right column) */}
          <div className="flex flex-col items-center gap-3 mt-8 mb-8 lg:mt-0 lg:mb-0">
            {/* Glow behind everything */}
            <div className="relative">
              <div className="absolute -inset-8 rounded-3xl bg-hilt-blue/5 blur-3xl" />
              <div className="relative z-10">
                <ChatMockup />
              </div>
            </div>
          </div>
        </div>

        {/* Doctor view: centered, wider */}
        <FadeIn>
          <div className="mt-12">
            <p className="mb-4 text-center text-sm font-medium text-slate">Doctor sees</p>
            <div className="mx-auto max-w-3xl">
              <DoctorMockup />
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── Before / After ───────────────────────────────────── */

function BeforeAfterSection() {
  const rows = [
    {
      without: { title: "Clipboard forms", desc: "Patients rush through paperwork they barely understand" },
      with: { title: "AI conversation", desc: "Patients share at their own pace and feel heard from the moment they sit down" },
    },
    {
      without: { title: "Doctor starts from scratch", desc: "First 5 minutes wasted repeating intake questions" },
      with: { title: "Doctor reads summary first", desc: "Full context before they enter the room" },
    },
    {
      without: { title: "Same questions, every visit", desc: '"What medications are you on?" for the third time' },
      with: { title: "AI remembers returning patients", desc: '"Still taking ibuprofen?" with full visit history' },
    },
    {
      without: { title: "English only forms", desc: "Non English speakers struggle or need a translator" },
      with: { title: "130+ languages built in", desc: "Patients speak in their language, doctors read in English" },
    },
    {
      without: { title: "No feedback loop", desc: "Patients leave and you never hear what they thought" },
      with: { title: "Automatic review collection", desc: "Every patient rates their visit after completion" },
    },
    {
      without: { title: "Paper referrals get lost", desc: "Fax a summary, hope the other clinic gets it" },
      with: { title: "Referral tracking built in", desc: "Send the full package digitally, track when they arrive" },
    },
    {
      without: { title: "Patients forget their visit details", desc: "No record of what was discussed or diagnosed" },
      with: { title: "Visit summary sent by text", desc: "Patients get a link to their summary they can show any doctor, anytime" },
    },
  ];

  return (
    <section className="bg-white py-24 lg:py-40">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <h2 className="mb-4 text-center text-3xl font-bold text-ink sm:text-4xl">
            Better for your clinic. Better for your patients.
          </h2>
          <p className="mb-12 text-center text-lg text-slate lg:mb-16">
            Patients feel heard from the first moment. Doctors walk in prepared. Everyone wins.
          </p>
        </FadeIn>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-0">
          {/* Without */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 lg:rounded-r-none lg:border-r-0">
            <p className="mb-6 text-sm font-semibold uppercase tracking-wider text-ash">
              Without Hilt Health
            </p>
            <div className="space-y-6">
              {rows.map((row, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div>
                    <p className="font-semibold text-slate">{row.without.title}</p>
                    <p className="mt-0.5 text-sm text-ash">{row.without.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          {/* With */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-8 lg:rounded-l-none lg:border-l-0">
            <p className="mb-6 text-sm font-semibold uppercase tracking-wider text-hilt-blue">
              With Hilt Health
            </p>
            <div className="space-y-6">
              {rows.map((row, i) => (
                <FadeIn key={i} delay={i * 0.1 + 0.15}>
                  <div>
                    <p className="font-semibold text-ink">{row.with.title}</p>
                    <p className="mt-0.5 text-sm text-slate">{row.with.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── How It Works ─────────────────────────────────────── */

function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Patient scans QR",
      desc: "Tablet or their own phone. AI asks what a doctor needs to know, symptoms, medications, allergies. 3 to 5 minutes. No forms. 130+ languages supported.",
    },
    {
      num: "02",
      title: "AI builds the summary",
      desc: "The patient reviews and approves the summary before it reaches the doctor. Nothing is hidden.",
    },
    {
      num: "03",
      title: "Doctor walks in ready",
      desc: "Full transcript, AI summary, and diagnostic opinion, all before the doctor enters the room.",
    },
  ];

  return (
    <section className="bg-snow pt-32 pb-24 lg:pt-40 lg:pb-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <h2 className="mb-16 text-center text-3xl font-bold text-ink sm:text-4xl">
            Three steps. No training needed.
          </h2>
        </FadeIn>
        <div className="grid gap-12 sm:grid-cols-3 sm:gap-8">
          {steps.map((s, i) => (
            <FadeIn key={s.num} delay={i * 0.15}>
              <div>
                <p className="mb-4 text-6xl font-bold text-hilt-blue/15">{s.num}</p>
                <h3 className="mb-3 text-xl font-semibold text-ink">{s.title}</h3>
                <p className="leading-relaxed text-slate">{s.desc}</p>
              </div>
            </FadeIn>
          ))}
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
    { label: "130+ languages", icon: "M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" },
    { label: "Built in Canada", icon: "m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" },
  ];

  const controls = [
    {
      title: "Doctors see everything",
      desc: "Full transcript, summary, and AI analysis, all visible to the doctor.",
      icon: "M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
    },
    {
      title: "AI never diagnoses",
      desc: "Information gathering only. No treatment suggestions to patients. Ever.",
      icon: "M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z",
    },
    {
      title: "Patient approves first",
      desc: "Summary reviewed and confirmed before it reaches the doctor.",
      icon: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    },
  ];

  return (
    <section className="bg-white pt-32 pb-24 lg:pt-40 lg:pb-32 border-y border-gray-100">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <h2 className="mb-3 text-center text-3xl font-bold text-ink sm:text-4xl">
            The AI prepares. The doctor decides.
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-lg text-slate">
            Hilt Health is an intake tool, not a diagnostic tool. Your doctors make every clinical decision.
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
        <div className="grid gap-6 sm:grid-cols-3">
          {controls.map((c, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="rounded-xl border border-gray-100 bg-white p-6 text-center">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-hilt-blue/10">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
                  </svg>
                </div>
                <h3 className="mb-2 font-semibold text-ink">{c.title}</h3>
                <p className="text-sm leading-relaxed text-slate">{c.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing Hint + Contact ───────────────────────────── */

function PricingAndContactSection() {
  return (
    <section id="contact" className="bg-snow py-24 lg:py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Pricing hint */}
        <FadeIn>
          <div className="mb-16 text-center">
            <p className="text-3xl font-bold text-ink sm:text-4xl">
              As low as $0.75 per patient
            </p>
            <p className="mt-3 text-lg text-slate">
              Plans from $99/mo · 200 free credits to start
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
          </div>
        </FadeIn>

        {/* Signup form */}
        <div className="mx-auto max-w-2xl">
          <FadeIn>
            <SignUpForm />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ── Blog ─────────────────────────────────────────────── */

function BlogSection() {
  const posts = getAllPosts().slice(0, 3);

  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <div className="mb-12 flex items-end justify-between">
            <h2 className="text-3xl font-bold text-ink sm:text-4xl">
              From the blog
            </h2>
            <a
              href="/blog"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-hilt-blue hover:underline"
            >
              View all
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </a>
          </div>
        </FadeIn>
        <div className="grid gap-6 sm:grid-cols-3">
          {posts.map((post, i) => (
            <FadeIn key={post.slug} delay={i * 0.1}>
              <a
                href={`/blog/${post.slug}`}
                className="group block h-full rounded-2xl border border-gray-100 bg-snow p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="mb-2 text-lg font-semibold leading-snug text-ink group-hover:text-hilt-blue transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate line-clamp-2">
                  {post.description}
                </p>
              </a>
            </FadeIn>
          ))}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <a
            href="/blog"
            className="inline-flex items-center gap-1 text-sm font-medium text-hilt-blue hover:underline"
          >
            View all
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ───────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="bg-white py-12 border-t border-gray-100">
      <div className="mx-auto max-w-[1200px] px-6 text-center">
        <p className="mb-2 text-2xl font-bold text-hilt-blue tracking-tight">Hilt Health</p>
        <p className="mb-4 text-slate">Built in Canada.</p>
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

export default function Home() {
  return (
    <>
      <main>
        <HeroSection />
        <BeforeAfterSection />
        <HowItWorksSection />
        <TrustAndControlSection />
        <PricingAndContactSection />
        <BlogSection />
      </main>
      <Footer />
    </>
  );
}
