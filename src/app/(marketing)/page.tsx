import Link from "next/link";
import dynamic from "next/dynamic";
import FadeIn from "@/components/FadeIn";
const DoctorMockup = dynamic(() => import("@/components/marketing/DoctorMockup"), {
  loading: () => <div className="h-[500px] rounded-2xl border border-gray-200 bg-white" />,
});
import ContactLink from "@/components/marketing/ContactLink";
import { getAllPosts } from "@/lib/blog";

const SignUpForm = dynamic(() => import("@/components/SignUpForm"), {
  loading: () => <div className="h-[400px]" />,
});
const DemoQR = dynamic(() => import("@/components/marketing/DemoQR"), {
  loading: () => <div className="rounded-lg bg-gray-100" />,
});
const DashboardMockup = dynamic(() => import("@/components/marketing/DashboardMockup"), {
  loading: () => <div className="h-[300px] rounded-2xl border border-gray-200 bg-gray-50" />,
});

/* ── Hero ─────────────────────────────────────────────── */

function ChatMockup() {
  const chatMessages = [
    { role: "ai", text: "Hi Sarah, welcome back to All locations Clinic! What brings you in today?", time: "9:03 AM", delay: "0.5s" },
    { role: "patient", text: "My hands have been really stiff every morning and my knuckles are swollen", time: "9:04 AM", delay: "1.8s" },
    { role: "ai", text: "I see you came in for knee pain on March 1. Could the hand stiffness be related?", time: "9:05 AM", delay: "3.2s" },
    { role: "patient", text: "Actually yes, my knee has been worse too", time: "9:06 AM", delay: "4.6s" },
  ];

  return (
    <div className="space-y-3">
      {/* Chat card */}
      <div className="w-[300px] sm:w-[340px] rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-gray-900/5 overflow-hidden">
        {/* Header — matches prod: logo + name left, language switcher right */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-hilt-blue">
              <span className="text-[10px] font-bold text-white">H</span>
            </div>
            <span className="text-xs font-semibold text-ink">All locations Clinic</span>
          </div>
          <button className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] text-slate">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            English
          </button>
        </div>

        {/* Messages */}
        <div className="space-y-2.5 px-4 py-4">
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
        </div>

        {/* Input area — matches prod: textarea + mic + send */}
        <div className="flex items-center gap-1 border-t border-gray-100 bg-white px-2 py-2">
          <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5">
            <p className="text-[10px] text-ash">Send a message</p>
          </div>
          {/* Mic button */}
          <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-gray-100">
            <svg className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          </div>
          {/* Send button */}
          <div className="flex h-[26px] shrink-0 items-center justify-center rounded-lg bg-hilt-blue px-2.5">
            <span className="text-[10px] font-medium text-white">Send</span>
          </div>
        </div>
      </div>

      {/* Arrow: chat → summary */}
      <div className="hero-msg flex justify-center" style={{ "--delay": "7s" } as React.CSSProperties}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-900/5">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
          </svg>
        </div>
      </div>

      {/* Summary confirmation card */}
      <div>
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
            <div className="flex-1 rounded-lg border border-green-300 bg-white py-2 text-center text-[10px] font-medium text-green-700">
              Something is not right
            </div>
            <div className="flex-1 rounded-lg bg-green-600 py-2 text-center text-[10px] font-semibold text-white">
              This is accurate ✓
            </div>
          </div>
          <p className="mt-2 text-[9px] text-right text-ash">9:09 AM</p>
        </div>
      </div>
    </div>
  );
}


function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 to-white pt-24 pb-20 lg:pt-32 lg:pb-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 md:gap-6 lg:gap-16 sm:pt-8">
          {/* Left column */}
          <div className="sm:flex-1 sm:min-w-0">
            <h1 className="mb-4 text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
              Patients describe
              <br />
              symptoms to AI.
              <br />
              In 130+ languages.
              <br />
              <span className="text-hilt-blue">Doctors read
              <br />
              the summary.</span>
            </h1>
            <p className="mb-8 text-lg text-slate sm:text-sm md:text-base lg:text-xl">
              Doctors save 5 minutes per patient, patients feel heard from the start.
            </p>
            {/* Start Trial CTA */}
            <Link
              href="/start-trial"
              className="inline-flex items-center gap-2 rounded-xl bg-hilt-blue px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-hilt-blue/25 transition-all hover:shadow-xl hover:-translate-y-0.5 sm:text-xs sm:px-3 sm:py-2 md:text-sm md:px-4 md:py-2.5 lg:text-base lg:px-6 lg:py-3.5"
            >
              Start Trial, Up to $200 in Free Credits
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <p className="mt-2 text-xs text-slate">No credit card required</p>

            {/* Live Demo Card */}
            <div className="mt-6 sm:mt-4 md:mt-8 max-w-md rounded-xl sm:rounded-xl md:rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-3 sm:px-2 sm:py-2.5 md:px-3 md:py-4 shadow-lg">
              {/* Mobile layout — horizontal QR + text */}
              <div className="flex items-center gap-3 sm:hidden">
                <div className="shrink-0 rounded-lg bg-white p-1 shadow-sm ring-1 ring-gray-900/5">
                  <DemoQR size={50} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-ink mb-1.5">See it in action</p>
                  <Link
                    href="/demo"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-md shadow-green-600/20"
                  >
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                    </svg>
                    Try Live Demo
                  </Link>
                </div>
              </div>
              {/* Desktop layout — vertical stack */}
              <div className="hidden sm:flex flex-col items-center text-center">
                <div className="md:hidden rounded-lg bg-white p-1 shadow-sm ring-1 ring-gray-900/5 mb-1.5">
                  <DemoQR size={20} />
                </div>
                <div className="hidden md:block rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-gray-900/5 mb-2">
                  <DemoQR size={70} />
                </div>
                <p className="text-[10px] md:text-xs font-bold text-ink mb-0.5">See it in action</p>
                <p className="text-[9px] md:text-[11px] text-slate mb-1.5 md:mb-2">Experience the full patient-to-doctor flow.</p>
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-1 md:gap-1.5 rounded-lg bg-green-600 px-2 py-1 md:px-3 md:py-1.5 text-[9px] md:text-[11px] font-semibold text-white shadow-md shadow-green-600/20 transition-all hover:bg-green-700 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                  </svg>
                  Try Live Demo
                </Link>
              </div>
            </div>
          </div>

          {/* Patient flow: chat → summary (phone-sized, right column) */}
          <div className="sm:shrink-0 sm:w-[340px] lg:w-auto lg:flex-1 flex flex-col items-center gap-3 mt-8 mb-8 sm:mt-0 sm:mb-0">
            {/* Glow behind everything */}
            <div className="relative">
              <div className="absolute -inset-12 rounded-[40px]" style={{ background: "radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)" }} />
              <div className="relative z-10">
                <ChatMockup />
              </div>
            </div>
          </div>
        </div>

        {/* Doctor view: centered, wider */}
        <FadeIn>
          <div className="mt-12">
            <p className="mb-4 text-center text-sm font-medium text-slate">Doctor sees in an auto updated queue of patients</p>
            <div className="mx-auto max-w-3xl">
              <DoctorMockup />
            </div>
          </div>
        </FadeIn>

        {/* Post-visit flow: review + follow-up SMS mockups */}
        <FadeIn>
          <div className="mt-16">
            {/* Arrow connector */}
            <div className="flex justify-center mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-900/5">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                </svg>
              </div>
            </div>
            <p className="mb-8 text-center text-sm font-medium text-slate">After the visit</p>

            <div className="mx-auto max-w-4xl grid gap-5 sm:grid-cols-2">
              {/* Marketing SMS Campaign */}
              <FadeIn delay={0.1}>
                <div className="h-full rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50/80 to-white p-3.5 shadow-xl ring-1 ring-blue-900/5">
                  <div className="mb-2 flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-semibold text-blue-700">Targeted patient outreach</span>
                    <span className="ml-auto rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-medium text-blue-700">via SMS</span>
                  </div>
                  <div className="rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-gray-900/5 space-y-1.5">
                    {/* Filter chips */}
                    <div className="flex gap-1">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[7px] text-ink">Age 50+</span>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[7px] text-ink">Female</span>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[7px] text-ink">All locations</span>
                    </div>
                    {/* AI criteria */}
                    <div className="rounded border border-blue-200 bg-blue-50/50 px-2 py-1">
                      <p className="text-[7px] font-medium text-blue-600 mb-0.5">AI criteria</p>
                      <p className="text-[8px] text-ink italic">&ldquo;Mentioned joint pain or arthritis&rdquo;</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-green-400" />
                        <span className="text-[8px] font-medium text-ink">31 matched</span>
                      </div>
                      <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[7px] font-medium text-green-700">Ready</span>
                    </div>
                    <div className="rounded bg-gray-50 px-2 py-1 text-[8px] text-slate">
                      Hi &#123;first_name&#125;, &#123;clinic_name&#125; now offers orthopedic services. Call us to book.
                    </div>
                    <div className="rounded bg-blue-600 py-1 text-center text-[8px] font-semibold text-white">
                      Send to 31 Patients
                    </div>
                  </div>
                  <p className="mt-2 text-[8px] text-ash">Filter first, then AI scans visit summaries for the rest</p>
                </div>
              </FadeIn>

              {/* Review SMS */}
              <FadeIn delay={0.2}>
                <div className="h-full rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50/80 to-white p-5 shadow-xl ring-1 ring-amber-900/5">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-semibold text-amber-700">Review request</span>
                    <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">via SMS</span>
                  </div>
                  <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-900/5">
                    <p className="text-xs text-slate leading-relaxed mb-2">
                      Hi Sarah, thank you for visiting Dr. Chen today! How was your experience?
                    </p>
                    <div className="flex justify-center gap-0.5 mb-0.5">
                      {[1,2,3,4,5].map(n => (
                        <svg key={n} className="h-6 w-6 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-amber-100/80 px-3 py-2 text-center">
                    <p className="text-[11px] font-medium text-amber-800">
                      Review collected internally first, then happy patients redirected to any review platform(s) you choose
                    </p>
                  </div>
                </div>
              </FadeIn>

              {/* Follow-up SMS */}
              <FadeIn delay={0.3}>
                <div className="h-full rounded-2xl border border-green-200 bg-gradient-to-b from-green-50/80 to-white p-5 shadow-xl ring-1 ring-green-900/5">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    <span className="text-xs font-semibold text-green-700">Continuity of care, built in</span>
                    <span className="ml-auto rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-medium text-green-700">AI powered</span>
                  </div>
                  {/* AI remembers past visits */}
                  <p className="text-[8px] font-semibold text-green-800 mb-1.5">AI remembers past visits</p>
                  <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-900/5 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-200">
                        <span className="text-[7px] font-bold text-ash">S</span>
                      </div>
                      <p className="text-[10px] text-ink leading-relaxed">
                        My hands have been really stiff every morning.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-500">
                        <span className="text-[7px] font-bold text-white">AI</span>
                      </div>
                      <p className="text-[10px] text-ink leading-relaxed">
                        You came in for knee pain on March 1. Could the hand stiffness be related?
                      </p>
                    </div>
                  </div>

                  <div className="my-3 border-t border-green-200" />
                  {/* Follow-up tagging */}
                  <p className="text-[8px] font-semibold text-green-800 mb-1.5">Doctor tagged follow ups</p>
                  <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-900/5">
                    <p className="text-[10px] text-slate leading-relaxed">
                      Doctors tag sessions with instructions. On the return visit, the AI continues with full memory of what was said and what the doctor wanted next.
                    </p>
                  </div>
                </div>
              </FadeIn>

              {/* Refer patient */}
              <FadeIn delay={0.4}>
                <div className="h-full rounded-2xl border border-purple-200 bg-gradient-to-b from-purple-50/80 to-white p-3.5 shadow-xl ring-1 ring-purple-900/5">
                  <div className="mb-2 flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    <span className="text-[10px] font-semibold text-purple-700">Send referral</span>
                  </div>
                  <div className="rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-gray-900/5 space-y-1.5">
                    {/* Specialty */}
                    <div>
                      <p className="text-[8px] font-medium text-slate mb-0.5">Specialty</p>
                      <div className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-[9px] text-ink">Rheumatology</div>
                    </div>
                    {/* Visits included */}
                    <div>
                      <p className="text-[8px] font-medium text-slate mb-0.5">Include visit chats</p>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-[8px]">
                          <div className="h-2.5 w-2.5 rounded-sm border border-hilt-blue bg-hilt-blue flex items-center justify-center">
                            <svg className="h-1.5 w-1.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          </div>
                          <span className="text-ink">Today, Knee pain, hand stiffness</span>
                        </div>
                        <div className="flex items-center gap-1 text-[8px]">
                          <div className="h-2.5 w-2.5 rounded-sm border border-hilt-blue bg-hilt-blue flex items-center justify-center">
                            <svg className="h-1.5 w-1.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          </div>
                          <span className="text-ink">Mar 1, Initial knee assessment</span>
                        </div>
                      </div>
                    </div>
                    {/* Destination */}
                    <div>
                      <p className="text-[8px] font-medium text-slate mb-0.5">Destination</p>
                      <div className="rounded border border-hilt-blue bg-blue-50/50 px-2 py-1">
                        <p className="text-[8px] font-medium text-ink">City Rheum Clinic</p>
                        <p className="text-[7px] text-ash">Dr. Patel &middot; 123 Health St</p>
                      </div>
                    </div>
                    {/* Send button */}
                    <div className="rounded bg-purple-600 py-1 text-center text-[9px] font-semibold text-white">
                      Send Referral
                    </div>
                  </div>
                  <p className="mt-2 text-[8px] text-ash">Transcript, summary, and notes sent digitally</p>
                </div>
              </FadeIn>


            </div>

            {/* Arrow: post-visit → analytics */}
            <div className="flex justify-center mt-6 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-900/5">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                </svg>
              </div>
            </div>
            <p className="mb-6 text-center text-sm font-medium text-slate">Everything tracked in your dashboard</p>

            {/* Analytics dashboard mockup */}
            <div className="mx-auto max-w-4xl">
              <DashboardMockup />
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
                  { from: "ai", text: "Good morning, All locations Clinic. How can I help?" },
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
      <div className="mx-auto max-w-[680px] px-6">
        <FadeIn>
          <h2 className="text-3xl font-bold text-white sm:text-4xl leading-tight">
            Your clinic is losing more than you think.
          </h2>
        </FadeIn>

        <div className="mt-10 space-y-6">
          <FadeIn delay={0.08}>
            <p className="text-lg leading-relaxed text-gray-300">
              Five minutes per patient on the same intake questions, even for returning patients. Non English speakers take twice as long or get half the detail. Fifty patients a day.{" "}
              <span className="text-white font-semibold">Over four hours of doctor time, gone.</span>
            </p>
          </FadeIn>
          <FadeIn delay={0.24}>
            <p className="text-lg leading-relaxed text-gray-300">
              After the visit, nothing happens. The doctor forgets what they wanted to ask on the follow up. No one asks for a review, no record sent to the patient. You have no way to tell your own patients about new services.{" "}
              <span className="text-white font-semibold">Continuity of care breaks down, and the next thing you hear is a one star rating on Google.</span>
            </p>
          </FadeIn>
          <FadeIn delay={0.56}>
            <p className="text-lg leading-relaxed text-gray-300">
              Which doctor sees the most patients? How long are people really waiting? Who referred who?{" "}
              <span className="text-white font-semibold">You have no idea.</span>
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={0.75}>
          <div className="mt-12 border-t border-gray-700 pt-10">
            <p className="text-xl font-semibold text-blue-300 mb-6">
              Hilt Health fixes every one of these.
            </p>
            <div className="space-y-3">
              <p className="text-lg leading-relaxed text-gray-400">
                <span className="text-blue-300 font-medium">Four hours back, and better intake.</span>{" "}
                AI handles intake in 130+ languages while the patient waits, remembers returning patients, and asks follow ups until nothing essential is missed. Every doctor reads the summary in their preferred language before they open the door.
              </p>
              <p className="text-lg leading-relaxed text-gray-400">
                <span className="text-blue-300 font-medium">After the visit, everything is handled.</span>{" "}
                Follow ups carry doctor instructions across visits. Happy patients guided to leave a review. Low ratings come to you privately first. Tell AI which patients to bring back and reach them by SMS.
              </p>
              <p className="text-lg leading-relaxed text-gray-400">
                <span className="text-blue-300 font-medium">Real time analytics.</span>{" "}
                Wait times, throughput, patient volume, and referral tracking per doctor, per location, per day.
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── How It Works ─────────────────────────────────────── */

function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Patient scans a QR code in your waiting room.",
      desc: "Patients scan it with their own phone or a clinic tablet, enter their name and date of birth, and they are checked in. About 10 seconds.",
      tag: "Clinic tablet kiosk mode for patients without phones",
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625v2.625m0 3v.375m0-3h2.625m-2.625 0H15m3.75 0v.375m0-3v.375m0 0h.375m-3.375 0H15" />
        </svg>
      ),
      accent: "bg-blue-50 text-hilt-blue ring-blue-100",
    },
    {
      num: "02",
      title: "Receptionist approves with one click.",
      desc: "Patient appears in the front desk queue. Receptionist verifies ID, taps approve, and the AI conversation begins.",
      tag: "Returning patients identified by full name, birthday, and sometimes phone",
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      accent: "bg-amber-50 text-amber-600 ring-amber-100",
    },
    {
      num: "03",
      title: "Patient talks to the AI while they wait.",
      desc: "AI asks about symptoms, medications, and allergies through a conversation. 130+ languages, voice and text. The patient reviews and approves the summary before it reaches the doctor.",
      tag: "Phone number collected here if not already on file",
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      ),
      accent: "bg-violet-50 text-violet-600 ring-violet-100",
    },
    {
      num: "04",
      title: "Doctor walks in already briefed.",
      desc: "Summary, suggested differentials, medications, allergies, and full visit history. A 30 second read replaces 5 minutes of intake questions.",
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
        </svg>
      ),
      accent: "bg-green-50 text-green-600 ring-green-100",
    },
  ];

  return (
    <section className="cv-auto bg-snow pt-32 pb-24 lg:pt-40 lg:pb-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-wider text-hilt-blue">
            How it works
          </p>
          <h2 className="mb-6 text-center text-3xl font-bold text-ink sm:text-4xl">
            Four steps. No training needed.
          </h2>
          <p className="mx-auto mb-16 max-w-lg text-center text-lg text-slate">
            Set it up in five minutes. Results start with the first patient.
          </p>
        </FadeIn>
        <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 lg:gap-8">
          {/* Connecting line — desktop only */}
          <div className="pointer-events-none absolute top-16 left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] hidden lg:block">
            <div className="h-px w-full bg-gradient-to-r from-blue-200 via-violet-200 via-amber-200 to-green-200" />
          </div>
          {steps.map((s, i) => (
            <FadeIn key={s.num} delay={i * 0.12}>
              <div className="relative flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md h-full">
                {/* Icon */}
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${s.accent}`}>
                  {s.icon}
                </div>
                {/* Step number + title */}
                <div className="mb-3 flex items-baseline gap-2.5">
                  <span className="text-xs font-bold tracking-wider text-ash">{s.num}</span>
                  <h3 className="text-base font-semibold text-ink leading-snug">{s.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate">{s.desc}</p>
                {s.tag && (
                  <span className="mt-auto pt-3 inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-green-200 self-start">
                    {s.tag}
                  </span>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
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
                Every clinic is different. Features are enabled per location, and we build custom workflows for clients who need them.
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
                  { label: "Weight tracking", desc: "Per patient over time", on: true },
                  { label: "Height tracking", desc: "Per patient over time", on: false },
                  { label: "Smart follow ups", desc: "AI linked cross session care", on: true },
                  { label: "Review collection", desc: "Post visit feedback routing", on: true },
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
      desc: "Sign up with your email and organization name. You get $200 worth of free credits to start, no card required.",
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
      desc: "Add each clinic location and get a unique QR code for each one. Add your logo if you want them branded.",
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
      desc: "Create logins for your doctors and receptionists. Assign roles per location. Takes about 30 seconds each.",
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
      desc: "Download the QR code as a PDF, put it in your waiting room. Patients start scanning and the system is live.",
      icon: (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m0 0a48.108 48.108 0 0 1 10.5 0m-10.5 0V6.75a2 2 0 0 1 2-2h6.5a2 2 0 0 1 2 2v.878" />
        </svg>
      ),
      accent: "bg-green-50 text-green-600 ring-green-200/60",
    },
  ];

  return (
    <section className="cv-auto bg-snow py-20 lg:py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-wider text-hilt-blue">
            How to set up
          </p>
          <h2 className="mb-4 text-center text-3xl font-bold text-ink sm:text-4xl">
            Ready before your next patient.
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-lg text-slate">
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
    { label: "Referred", done: true },
    { label: "Received", done: true },
    { label: "Checked in", done: true },
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
                Refer a patient with one click. The receiving clinic gets the full package: AI summary, doctor notes, visit history. You see when they arrive. No fax, no wondering.
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
                  AI summary + notes + history sent digitally
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

/* ── Pricing Hint + Contact ───────────────────────────── */

function PricingAndContactSection() {
  return (
    <section id="contact" className="cv-auto bg-snow py-24 lg:py-32">
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
    <section className="cv-auto bg-white py-24 lg:py-32">
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
    <footer className="cv-auto bg-white py-12 border-t border-gray-100">
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

export default async function Home() {
  return (
    <>
      <main>
        <HeroSection />
        <BuiltForYourClinicSection />
        <RavenSchedulerSection />
        <BeforeAfterSection />
        <HowToSetUpSection />
        <HowItWorksSection />
        <BeyondTheVisitSection />
        <TrustAndControlSection />
        <PricingAndContactSection />
        <BlogSection />
      </main>
      <Footer />
    </>
  );
}
