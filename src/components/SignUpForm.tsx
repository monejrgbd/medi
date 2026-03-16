"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

const CITIES = [
  "St. Catharines",
  "Niagara Falls",
  "Welland",
  "Fort Erie",
  "Thorold",
  "Grimsby",
  "Lincoln",
  "Pelham",
  "Port Colborne",
  "Niagara-on-the-Lake",
  "Other",
];

function Spinner() {
  return (
    <svg className="inline-block h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
    </svg>
  );
}

const fieldVariants = {
  hidden: { opacity: 0, height: 0, marginTop: 0, overflow: "hidden" as const },
  visible: { opacity: 1, height: "auto", marginTop: 16, overflow: "visible" as const },
};

export default function SignUpForm() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const [interest, setInterest] = useState<"free_trial" | "meet">("free_trial");

  useEffect(() => {
    if (!supabase) return;
    supabase.rpc("get_waitlist_count").then(({ data }) => {
      if (data !== null && data > 0) setWaitlistCount(data);
    });
  }, []);

  // Auto-select "meet" when arriving via ?interest=demo or ?interest=meet
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const val = params.get("interest");
    if (val === "demo" || val === "meet") {
      setInterest("meet");
    }
  }, []);

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

    const { error: dbError } = await supabase.rpc("submit_contact", {
      p_clinic_name: (data.get("clinic_name") as string) || null,
      p_contact_name: data.get("contact_name") as string,
      p_email: data.get("email") as string,
      p_phone: (data.get("phone") as string) || null,
      p_city: interest === "free_trial" ? (data.get("city") as string) : null,
      p_interest: interest,
      p_notes: (data.get("notes") as string) || null,
    });

    setLoading(false);

    if (dbError) {
      const msg = dbError.message?.toLowerCase() ?? "";
      if (msg.includes("email")) {
        setError("Please enter a valid email address.");
      } else if (msg.includes("clinic name")) {
        setError("Please enter your clinic name.");
      } else if (msg.includes("contact name")) {
        setError("Please enter your name.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      return;
    }

    if (interest === "meet") {
      router.push("/book");
      return;
    }

    setSubmitted(true);
  }

  return (
    <>
      {!submitted && (
        <div className="mb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={interest}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="mb-3 text-3xl font-bold text-ink sm:text-4xl">
                {interest === "meet" ? "Meet with us" : "Apply for Premium Trial"}
              </h2>
              <p className="text-lg text-slate">
                {interest === "meet"
                  ? "Let\u2019s find a time to chat about how Hilt Health can work for your clinic."
                  : <>Start with 200 free credits. No card required. <Link href="/start-trial" className="text-hilt-blue hover:underline font-medium">See trial details</Link>.</>}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {waitlistCount !== null && !submitted && interest === "free_trial" && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 text-sm font-medium text-hilt-blue"
        >
          {waitlistCount + 24} clinics already on the waitlist
        </motion.p>
      )}

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
              We&apos;ll be in touch!
            </h3>
            <p className="text-slate">
              Expect to hear from us within 48 hours.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="mx-auto max-w-lg"
          >
            {/* Honeypot — hidden from real users, bots fill it */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <input type="text" name="company_url" tabIndex={-1} autoComplete="off" suppressHydrationWarning />
            </div>

            <div>
              <label htmlFor="interest" className="mb-1 block text-sm font-medium text-ink text-left">
                I&apos;m interested in <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setInterest("free_trial")}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    interest === "free_trial"
                      ? "border-hilt-blue bg-hilt-blue/5 text-hilt-blue"
                      : "border-gray-300 text-slate hover:border-gray-400"
                  }`}
                >
                  Premium Free Trial
                </button>
                <button
                  type="button"
                  onClick={() => setInterest("meet")}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    interest === "meet"
                      ? "border-hilt-blue bg-hilt-blue/5 text-hilt-blue"
                      : "border-gray-300 text-slate hover:border-gray-400"
                  }`}
                >
                  Meet with Us
                </button>
              </div>
              <input type="hidden" name="interest" value={interest} />
            </div>

            <AnimatePresence initial={false}>
              {interest === "free_trial" && (
                <motion.div
                  key="clinic_name"
                  variants={fieldVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
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
                </motion.div>
              )}
            </AnimatePresence>

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

            <AnimatePresence initial={false}>
              {interest === "free_trial" && (
                <motion.div
                  key="city"
                  variants={fieldVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  <label htmlFor="city" className="mb-1 block text-sm font-medium text-ink text-left">
                    City <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="city"
                      name="city"
                      required
                      defaultValue=""
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-10 text-ink focus:border-hilt-blue focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 transition-colors appearance-none bg-white"
                      suppressHydrationWarning
                    >
                      <option value="" disabled>
                        Select your city
                      </option>
                      {CITIES.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ash"
                      width="20"
                      height="20"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4">
              <label htmlFor="notes" className="mb-1 block text-sm font-medium text-ink text-left">
                {interest === "meet" ? (
                  <>What would you like to discuss? <span className="text-red-400">*</span></>
                ) : (
                  <>Notes <span className="text-ash font-normal">(optional)</span></>
                )}
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                required={interest === "meet"}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 transition-colors resize-none"
                placeholder={interest === "meet" ? "e.g. I'd like to learn about AI pre-screening for my walk-in clinic" : "Anything you'd like us to know"}
              />
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600">{error}</p>
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
              ) : interest === "meet" ? (
                "Book a Meeting"
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
          </motion.form>
        )}
      </AnimatePresence>
    </>
  );
}
