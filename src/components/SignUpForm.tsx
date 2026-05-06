"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { COUNTRIES } from "@/lib/countries";
import CountryCombobox from "@/components/CountryCombobox";

function Spinner() {
  return (
    <svg className="inline-block h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
    </svg>
  );
}

const GENERIC_DOMAINS = new Set([
  "gmail.com","googlemail.com","outlook.com","hotmail.com",
  "live.com","msn.com","aol.com","icloud.com","me.com","mac.com","mail.com",
  "protonmail.com","proton.me","zoho.com","yandex.com","gmx.com","gmx.net",
  "yahoo.com","yahoo.ca",
]);

export default function SignUpForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | React.ReactNode>("");
  const [submittedEmail, setSubmittedEmail] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot — if filled, silently succeed (bot)
    if (data.get("company_url")) {
      setLoading(false);
      setSubmitted(true);
      return;
    }

    if (!supabase) {
      setLoading(false);
      setError("Service unavailable. Please try again later.");
      return;
    }

    const emailValue = data.get("email") as string;
    const countryValue = (data.get("country") as string) || "";

    // Country is required (hidden inputs skip native HTML5 validation)
    if (!countryValue.trim()) {
      setLoading(false);
      setError("Please select a country from the dropdown.");
      return;
    }

    // Client-side generic domain check for instant feedback
    const domain = emailValue.split("@")[1]?.toLowerCase();
    if (domain && GENERIC_DOMAINS.has(domain)) {
      setLoading(false);
      setError(
        <>Premium trial requires a clinic email address. Do not have one? <a href="https://cal.com/102937474/hilt-health-meeting" target="_blank" rel="noopener noreferrer" className="font-semibold text-hilt-blue hover:underline">Schedule a meeting</a> instead.</>
      );
      return;
    }

    const { data: premiumResult, error: premiumError } = await supabase.rpc(
      "request_premium_code",
      { p_email: emailValue }
    );

    if (premiumError) {
      setLoading(false);
      setError("Something went wrong. Please try again.");
      return;
    }

    if (premiumResult && !premiumResult.success) {
      setLoading(false);
      if (premiumResult.error === "identifier_taken" && premiumResult.email === "taken") {
        setError(
          <>You have already applied. Check your email including spam. Contact <a href="mailto:support@hilthealth.com" className="text-hilt-blue hover:underline">support@hilthealth.com</a> if you did not receive it.</>
        );
      } else if (premiumResult.error === "identifier_taken" && premiumResult.domain === "taken") {
        setError(
          <>Your clinic has already been approved. The code was sent to <strong>{premiumResult.domain_approved_email}</strong>. Contact <a href="mailto:support@hilthealth.com" className="text-hilt-blue hover:underline">support@hilthealth.com</a> if you need help.</>
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
      return;
    }

    // Premium code request succeeded — also store contact for lead tracking (fire-and-forget)
    supabase.rpc("submit_contact", {
      p_clinic_name: (data.get("clinic_name") as string) || null,
      p_contact_name: data.get("contact_name") as string,
      p_email: emailValue,
      p_phone: (data.get("phone") as string) || null,
      p_country: (data.get("country") as string) || null,
      p_city: (data.get("city") as string) || null,
      p_interest: "free_trial",
      p_notes: (data.get("notes") as string) || null,
    });

    setLoading(false);
    setSubmittedEmail(emailValue);
    setSubmitted(true);
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "conversion", {
        send_to: "AW-18032484152/P8SxCPDbpZccELi-x5ZD",
        transaction_id: `email-${emailValue}`,
      });
    }
  }

  return (
    <AnimatePresence mode="wait">
      {submitted ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <motion.svg
                width="40"
                height="40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#22C55E"
                strokeWidth="2"
              >
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </motion.svg>
            </div>
            <h3 className="mb-2 text-2xl font-semibold text-ink">
              Application received
            </h3>
            <p className="text-slate max-w-sm">
              Good news! A staff member is currently online, expect a rejection or approval within one hour sent to <strong className="text-ink">{submittedEmail}</strong>.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="apply"
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-16"
          >
            <div className="lg:flex-1 lg:pt-2">
              <h2 className="mb-3 text-3xl font-bold text-ink sm:text-4xl">
                Apply for Premium Trial
              </h2>
              <p className="text-lg text-slate">
                Start with $200 worth of credits. No card required.
              </p>
              <p className="mt-2 text-sm text-ash">
                Want to talk first?{" "}
                <a href="https://cal.com/102937474/hilt-health-meeting" target="_blank" rel="noopener noreferrer" className="font-semibold text-hilt-blue hover:underline">
                  Schedule a meeting
                </a>{" "}
                instead.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full lg:max-w-lg lg:flex-shrink-0">
            {/* Honeypot — hidden from real users, bots fill it */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <input type="text" name="company_url" tabIndex={-1} autoComplete="off" suppressHydrationWarning />
            </div>

            <div>
              <label htmlFor="clinic_name" className="mb-1 block text-sm font-medium text-ink text-left">
                Clinic name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="clinic_name"
                name="clinic_name"
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 transition-colors"
                placeholder="Niagara Family Health Clinic"
                suppressHydrationWarning
              />
            </div>

            <div className="mt-4">
              <label htmlFor="contact_name" className="mb-1 block text-sm font-medium text-ink text-left">
                Your name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="contact_name"
                name="contact_name"
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 transition-colors"
                placeholder="Dr. Sarah Chen"
                suppressHydrationWarning
              />
            </div>

            <div className="mt-4">
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink text-left">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 transition-colors"
                placeholder="sarah@clinic.ca"
                suppressHydrationWarning
              />
            </div>

            <div className="mt-4">
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-ink text-left">
                Phone <span className="text-ash font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 transition-colors"
                placeholder="(905) 555-0123"
                suppressHydrationWarning
              />
            </div>

            <div className="mt-4">
              <label htmlFor="country" className="mb-1 block text-sm font-medium text-ink text-left">
                Country <span className="text-red-400">*</span>
              </label>
              <CountryCombobox
                id="country"
                name="country"
                options={COUNTRIES}
                required
              />
            </div>

            <div className="mt-4">
              <label htmlFor="city" className="mb-1 block text-sm font-medium text-ink text-left">
                City <span className="text-ash font-normal">(optional)</span>
              </label>
              <input
                type="text"
                id="city"
                name="city"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 transition-colors"
                placeholder="Toronto"
                suppressHydrationWarning
              />
            </div>

            <div className="mt-4">
              <label htmlFor="notes" className="mb-1 block text-sm font-medium text-ink text-left">
                Notes <span className="text-ash font-normal">(optional)</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 transition-colors resize-none"
                placeholder="Anything you'd like us to know"
              />
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-hilt-blue py-4 text-lg font-semibold text-white transition-all hover:bg-hilt-blue-dark disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Spinner />
                  Submitting...
                </>
              ) : (
                "Apply for Premium Trial"
              )}
            </button>

            {/* CASL consent + privacy link */}
            <p className="mt-4 text-xs text-ash text-center leading-relaxed">
              By submitting, you consent to Hilt Health contacting you by email about
              our services. You can unsubscribe at any time. See our{" "}
              <Link href="/privacy" className="text-hilt-blue hover:underline">
                Privacy Policy
              </Link>.
            </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
  );
}
