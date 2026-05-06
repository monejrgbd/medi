"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function HeroEmailCTA() {
  const router = useRouter();
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);

    const trimmed = email.trim();
    try {
      if (supabase) {
        await supabase.rpc("capture_email", { p_email: trimmed, p_source: "homepage" });
      }
    } catch {
      // Capture is best effort, do not block signup if it fails
    }

    router.push(`/signup?email=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="flex flex-col items-start lg:items-end">
      {!showEmail ? (
        <div className="flex flex-row flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowEmail(true)}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-hilt-blue px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-hilt-blue/25 transition-all hover:bg-hilt-blue-dark hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 sm:px-7 sm:py-3.5 sm:text-base"
          >
            Start Trial
          </button>
          <a
            href="https://cal.com/102937474/hilt-health-meeting"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-full border-2 border-hilt-blue bg-transparent px-5 py-2.5 text-sm font-semibold text-hilt-blue transition-all hover:bg-hilt-blue/5 hover:-translate-y-0.5 active:translate-y-0 sm:px-7 sm:py-3 sm:text-base"
          >
            Book a Consultation
          </a>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-sm items-center gap-2 rounded-full border-2 border-hilt-blue bg-white py-1.5 pl-4 pr-1.5 shadow-sm sm:w-[400px]"
        >
          <button
            type="button"
            onClick={() => setShowEmail(false)}
            aria-label="Back"
            className="shrink-0 rounded-full p-1 text-ash transition-colors hover:bg-hilt-blue/5 hover:text-slate"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your clinic email"
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ash focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            aria-label="Continue"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-hilt-blue text-white transition-all hover:bg-hilt-blue-dark disabled:opacity-50"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </form>
      )}
      <p className="mt-3 text-sm text-ash">No credit card required</p>
    </div>
  );
}
