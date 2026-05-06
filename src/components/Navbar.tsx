"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <nav
        className={`sticky top-0 z-40 transition-all duration-200 ${
          scrolled ? "bg-white/98 shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-bold text-hilt-blue tracking-tight">
            Hilt Health
          </Link>

          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2.5 text-sm font-medium text-slate transition-colors hover:text-ink"
            >
              Home
            </Link>
            <Link
              href="/blog"
              className="px-4 py-2.5 text-sm font-medium text-slate transition-colors hover:text-ink"
            >
              Blog
            </Link>
            <Link
              href="/pricing"
              className="px-4 py-2.5 text-sm font-medium text-slate transition-colors hover:text-ink"
            >
              Pricing
            </Link>
            <Link
              href="/affiliate"
              className="px-4 py-2.5 text-sm font-medium text-slate transition-colors hover:text-ink"
            >
              Affiliate
            </Link>
            <Link
              href="/login"
              className="rounded-xl border-2 border-hilt-blue px-5 py-2.5 text-sm font-semibold text-hilt-blue transition-colors hover:bg-hilt-blue/5"
            >
              Sign In
            </Link>
            <a
              href="/signup"
              className="rounded-xl bg-hilt-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hilt-blue-dark"
            >
              Start Free Trial
            </a>
            {!isLoggedIn && (
              <a
                href="https://cal.com/102937474/hilt-health-meeting"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-green-600 px-4 py-2.5 text-sm font-semibold text-green-700 transition-all hover:bg-green-50 hover:shadow-sm"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                Book a Consultation
              </a>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden flex flex-col gap-1.5 p-2"
            aria-label="Toggle menu"
          >
            <span className={`block h-0.5 w-6 bg-ink transition-all duration-200 ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-6 bg-ink transition-all duration-200 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-6 bg-ink transition-all duration-200 ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>

        {mobileOpen && (
          <div className="sm:hidden border-t border-gray-100 bg-white px-6 pb-4 pt-2 space-y-3">
            <Link
              href="/"
              className="block w-full rounded-xl px-5 py-3 text-center text-sm font-medium text-slate"
            >
              Home
            </Link>
            <Link
              href="/blog"
              className="block w-full rounded-xl px-5 py-3 text-center text-sm font-medium text-slate"
            >
              Blog
            </Link>
            <Link
              href="/pricing"
              className="block w-full rounded-xl px-5 py-3 text-center text-sm font-medium text-slate"
            >
              Pricing
            </Link>
            <Link
              href="/affiliate"
              className="block w-full rounded-xl px-5 py-3 text-center text-sm font-medium text-slate"
            >
              Affiliate
            </Link>
            <Link
              href="/login"
              className="block w-full rounded-xl border-2 border-hilt-blue px-5 py-3 text-center text-sm font-semibold text-hilt-blue"
            >
              Sign In
            </Link>
            <a
              href="/signup"
              className="block w-full rounded-xl bg-hilt-blue px-5 py-3 text-center text-sm font-semibold text-white"
            >
              Start Free Trial
            </a>
            {!isLoggedIn && (
              <a
                href="https://cal.com/102937474/hilt-health-meeting"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-green-600 px-5 py-3 text-center text-sm font-semibold text-green-700"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                Book a Consultation
              </a>
            )}
          </div>
        )}
      </nav>

    </>
  );
}
