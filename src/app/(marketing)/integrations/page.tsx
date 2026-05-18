import Link from "next/link";
import FadeIn from "@/components/FadeIn";

export const metadata = {
  title: "EHR Integration | Hilt Health",
  description:
    "Hilt works with the EHR you already use. No rip and replace. From formatted notes you paste in seconds to a full two way connection, you choose how deep it goes.",
};

export default function IntegrationsPage() {
  return (
    <div className="bg-gradient-to-b from-blue-50/50 to-snow min-h-[calc(100vh-80px)]">
      <div className="mx-auto max-w-4xl px-6 pt-24 pb-20 lg:pt-32">
        {/* Hero */}
        <FadeIn>
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-hilt-blue/10">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-ink sm:text-4xl lg:text-5xl tracking-tight">
              Works With Your EHR
            </h1>
            <p className="mt-4 text-lg text-slate max-w-2xl mx-auto">
              Hilt runs alongside the system you already use. No rip and replace. From clean formatted notes your team pastes in seconds, to a full two way connection, you choose how deep the integration goes.
            </p>
          </div>
        </FadeIn>

        {/* CTA */}
        <FadeIn delay={0.1}>
          <div className="mt-12 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-hilt-blue/10">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-ink mb-2">
              Want it wired into your EHR?
            </h2>
            <p className="text-sm text-slate mb-6 max-w-md mx-auto">
              Book a 15 minute call. We will look at your current system and map the cleanest way to connect Hilt to it.
            </p>
            <a
              href="https://cal.com/102937474/hilt-health-meeting"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-hilt-blue px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-hilt-blue/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              Schedule a Meeting
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          </div>
        </FadeIn>

        {/* Stats */}
        <FadeIn delay={0.15}>
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                value: "Any EHR",
                label: "Works Day One",
                description: "Formatted notes paste cleanly into any system, no setup required",
                icon: (
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                ),
              },
              {
                value: "1 or 2 way",
                label: "Connection Options",
                description: "Optional one way push or a full two way sync, configured for your clinic",
                icon: (
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                ),
              },
              {
                value: "$0",
                label: "To Get Started",
                description: "Formatted copy and paste is included free on every plan",
                icon: (
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                ),
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm"
              >
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-hilt-blue/10">
                  {stat.icon}
                </div>
                <p className="text-2xl font-bold text-ink sm:text-3xl tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-semibold text-ash uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="mt-2 text-sm text-slate">{stat.description}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* How it works */}
        <FadeIn delay={0.15}>
          <div className="mt-16">
            <h2 className="text-center text-xl font-bold text-ink sm:text-2xl">
              How It Works
            </h2>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-0">
              {[
                {
                  step: "1",
                  title: "Tell Us Your EHR",
                  description:
                    "A quick 15 minute call. Tell us what you run, Epic, athenahealth, Oracle Health, or anything else.",
                },
                {
                  step: "2",
                  title: "We Configure It",
                  description:
                    "Formatted notes work the moment you start. For a deeper link, our team sets up a one way or two way connection.",
                },
                {
                  step: "3",
                  title: "Go Live",
                  description:
                    "Your team works in Hilt, the record lands in your EHR. Nothing changes about how you chart.",
                },
              ].map((item, i) => (
                <div key={i} className="relative flex flex-col items-center text-center px-6 py-6">
                  {i < 2 && (
                    <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-12 bg-gray-200" />
                  )}
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-hilt-blue text-white text-sm font-bold">
                    {item.step}
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate max-w-[240px]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* What connects */}
        <FadeIn delay={0.2}>
          <div className="mt-14 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-bold text-ink mb-5">
              What Flows Into Your EHR
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "AI visit summaries",
                "SOAP and clinical notes",
                "Structured intake data",
                "Sick notes and letters",
                "Diagnoses and problem lists",
                "Medications and allergies",
                "Patient demographics",
                "Attachments and documents",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <svg
                    className="shrink-0"
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="#16a34a"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                  <span className="text-sm text-slate">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* CTA (bottom) */}
        <FadeIn delay={0.2}>
          <div className="mt-14 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-hilt-blue/10">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-ink mb-2">
              Want it wired into your EHR?
            </h2>
            <p className="text-sm text-slate mb-6 max-w-md mx-auto">
              Book a 15 minute call. We will look at your current system and map the cleanest way to connect Hilt to it.
            </p>
            <a
              href="https://cal.com/102937474/hilt-health-meeting"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-hilt-blue px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-hilt-blue/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              Schedule a Meeting
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="mt-8 text-center text-sm text-slate">
            Questions? Email us at{" "}
            <a
              href="mailto:business@hilthealth.com"
              className="text-hilt-blue hover:underline font-medium"
            >
              business@hilthealth.com
            </a>
          </p>
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-ash hover:text-slate transition-colors"
            >
              Back to homepage
            </Link>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
