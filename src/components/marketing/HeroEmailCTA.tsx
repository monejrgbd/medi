"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function HeroEmailCTA() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    // Save email for marketing before navigating
    if (supabase) {
      await supabase.rpc("capture_email", { p_email: email.trim(), p_source: "homepage" });
    }

    router.push(`/signup?email=${encodeURIComponent(email.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md">
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-0">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your clinic email"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 sm:rounded-r-none sm:border-r-0 sm:text-xs md:text-sm lg:text-base lg:py-3.5"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-hilt-blue px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-hilt-blue/25 transition-all hover:shadow-xl hover:-translate-y-0.5 sm:rounded-l-none sm:text-xs sm:px-3 sm:py-2 md:text-sm md:px-4 md:py-2.5 lg:text-base lg:px-6 lg:py-3.5"
        >
          Start Trial
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
      <p className="mt-2 text-xs text-slate">No credit card required.</p>
    </form>
  );
}
