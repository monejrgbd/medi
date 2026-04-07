"use client";

import Link from "next/link";
import FadeIn from "@/components/FadeIn";

export default function BookPage() {
  return (
    <div className="bg-gradient-to-b from-blue-50/50 to-snow min-h-[calc(100vh-80px)]">
      <div className="mx-auto max-w-2xl px-6 pt-24 pb-20 lg:pt-32">
        <FadeIn>
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#22C55E" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-ink sm:text-4xl">
              Thanks! Let&apos;s book a time.
            </h1>
            <p className="mt-3 text-lg text-slate max-w-md mx-auto">
              We received your info. Pick a time that works for you and we&apos;ll meet to discuss how Hilt Health can help your clinic.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-hilt-blue/10">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-ink mb-2">
              Schedule a meeting
            </h2>
            <p className="text-sm text-slate mb-6">
              Choose a 15-minute slot that works for you. We&apos;ll send a confirmation with a meeting link.
            </p>
            <a
              href="https://cal.com/102937474/hilt-health-meeting"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (typeof window !== "undefined" && typeof window.gtag === "function") {
                  window.gtag("event", "conversion", {
                    send_to: "AW-18032484152/9-IpCO_ljpccELi-x5ZD",
                    transaction_id: `book-${Date.now()}`,
                  });
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-hilt-blue px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-hilt-blue/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              Pick a Time
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mt-8 text-center text-sm text-slate">
            Prefer email? Reach us at{" "}
            <a href="mailto:business@hilthealth.com" className="text-hilt-blue hover:underline font-medium">
              business@hilthealth.com
            </a>
          </p>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-ash hover:text-slate transition-colors">
              Back to homepage
            </Link>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
