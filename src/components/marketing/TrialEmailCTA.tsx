"use client";

/* Primary trial CTA for the feature landing pages. Mirrors the homepage
   HeroEmailCTA behaviour exactly (capture the email best-effort with a
   per-page source, then continue to the trial) but renders with the
   feature pages' solid primary-button styling. Email validation is the
   same native type="email" required approach the signup forms use. The
   homepage HeroEmailCTA is intentionally left untouched. */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ArrowIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    width="18"
    height="18"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.5"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);

export default function TrialEmailCTA({
  source,
  className = "",
}: {
  source: string;
  className?: string;
}) {
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
        await supabase.rpc("capture_email", { p_email: trimmed, p_source: source });
      }
    } catch {
      // Capture is best effort, do not block the trial if it fails
    }

    router.push(`/start-trial?email=${encodeURIComponent(trimmed)}`);
  }

  if (showEmail) {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm items-center gap-2 rounded-xl border-2 border-hilt-blue bg-white py-1.5 pl-4 pr-1.5 shadow-sm"
      >
        <button
          type="button"
          onClick={() => setShowEmail(false)}
          aria-label="Back"
          className="shrink-0 rounded-full p-1 text-ash transition-colors hover:bg-hilt-blue/5 hover:text-slate"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
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
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-hilt-blue text-white transition-all hover:bg-hilt-blue-dark disabled:opacity-50"
        >
          <ArrowIcon className="h-4 w-4" />
        </button>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowEmail(true)}
      className={`group inline-flex items-center gap-2 rounded-xl bg-hilt-blue px-8 py-4 text-base font-semibold text-white shadow-lg shadow-hilt-blue/25 transition-all hover:bg-hilt-blue-dark hover:shadow-xl hover:-translate-y-0.5 ${className}`}
    >
      Start free
      <ArrowIcon className="transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
