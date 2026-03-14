"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

interface CustomPlanModalProps {
  open: boolean;
  onClose: () => void;
}

function Spinner() {
  return (
    <svg className="inline-block h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
    </svg>
  );
}

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

export default function CustomPlanModal({ open, onClose }: CustomPlanModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setSubmitted(false);
      setLoading(false);
      setError("");
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const data = new FormData(e.currentTarget);

    if (!supabase) {
      setLoading(false);
      setError("Service unavailable. Please try again later.");
      return;
    }

    const { error: dbError } = await supabase.rpc("submit_contact", {
      p_clinic_name: data.get("clinic_name") as string,
      p_contact_name: data.get("contact_name") as string,
      p_email: data.get("email") as string,
      p_phone: (data.get("phone") as string) || null,
      p_city: data.get("city") as string,
      p_interest: "custom_plan",
      p_notes: (data.get("notes") as string) || null,
    });

    setLoading(false);

    if (dbError) {
      const msg = dbError.message?.toLowerCase() ?? "";
      if (msg.includes("email")) {
        setError("Please enter a valid email address.");
      } else if (msg.includes("clinic name")) {
        setError("Please enter your clinic or organization name.");
      } else if (msg.includes("contact name")) {
        setError("Please enter your name.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      return;
    }

    setSubmitted(true);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          onClick={handleOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-ash hover:text-ink transition-colors"
              aria-label="Close"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <motion.svg
                    width="32"
                    height="32"
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
                <h3 className="mb-2 text-xl font-semibold text-ink">
                  We&apos;ll be in touch!
                </h3>
                <p className="text-slate">
                  Our team will reach out within 48 hours to discuss your custom plan.
                </p>
              </motion.div>
            ) : (
              <>
                <h2 className="mb-1 text-xl font-semibold text-ink">Get a custom plan</h2>
                <p className="mb-6 text-sm text-slate">
                  Tell us about your organization and we&apos;ll build a plan that fits.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="cp-clinic" className="mb-1 block text-sm font-medium text-ink">
                      Organization / Clinic name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="cp-clinic"
                      name="clinic_name"
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 transition-colors"
                      placeholder="Niagara Health Network"
                    />
                  </div>

                  <div>
                    <label htmlFor="cp-name" className="mb-1 block text-sm font-medium text-ink">
                      Your name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="cp-name"
                      name="contact_name"
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 transition-colors"
                      placeholder="Dr. Sarah Chen"
                    />
                  </div>

                  <div>
                    <label htmlFor="cp-email" className="mb-1 block text-sm font-medium text-ink">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      id="cp-email"
                      name="email"
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 transition-colors"
                      placeholder="sarah@clinic.ca"
                    />
                  </div>

                  <div>
                    <label htmlFor="cp-phone" className="mb-1 block text-sm font-medium text-ink">
                      Phone <span className="text-ash font-normal">(optional)</span>
                    </label>
                    <input
                      type="tel"
                      id="cp-phone"
                      name="phone"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 transition-colors"
                      placeholder="(905) 555-0123"
                    />
                  </div>

                  <div className="relative">
                    <label htmlFor="cp-city" className="mb-1 block text-sm font-medium text-ink">
                      City <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="cp-city"
                        name="city"
                        required
                        defaultValue=""
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-10 text-ink focus:border-hilt-blue focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 transition-colors appearance-none bg-white"
                      >
                        <option value="" disabled>Select your city</option>
                        {CITIES.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      <svg
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ash"
                        width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="cp-notes" className="mb-1 block text-sm font-medium text-ink">
                      Notes <span className="text-ash font-normal">(optional)</span>
                    </label>
                    <textarea
                      id="cp-notes"
                      name="notes"
                      rows={3}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 transition-colors resize-none"
                      placeholder="Number of locations, estimated patient volume, or anything else"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-hilt-blue py-3 text-sm font-semibold text-white transition-colors hover:bg-hilt-blue-dark disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Spinner />
                        Submitting...
                      </>
                    ) : (
                      "Contact Us"
                    )}
                  </button>

                  <p className="text-xs text-ash text-center leading-relaxed">
                    By submitting, you consent to Hilt Health contacting you by email about
                    our services. You can unsubscribe at any time. See our{" "}
                    <Link href="/privacy" className="text-hilt-blue hover:underline">
                      Privacy Policy
                    </Link>.
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
