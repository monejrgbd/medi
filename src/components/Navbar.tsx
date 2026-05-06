"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const NAV_LINKS = [
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/affiliate", label: "Affiliate" },
];

const CAL_URL = "https://cal.com/102937474/hilt-health-meeting";

export default function Navbar() {
  const pathname = usePathname();
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

  // Body scroll lock when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function closeMenu() {
    setMobileOpen(false);
  }

  return (
    <>
      <nav
        className={`sticky top-0 z-30 transition-all duration-200 ${
          scrolled ? "bg-white/98 shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-hilt-blue sm:text-2xl">
            Hilt Health
          </Link>

          {/* Desktop nav (sm+) */}
          <div className="hidden items-center gap-3 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2.5 text-sm font-medium text-slate transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
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
                href={CAL_URL}
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

          {/* Mobile actions: always-visible Book a call CTA + hamburger */}
          <div className="flex items-center gap-2 sm:hidden">
            {!isLoggedIn && (
              <a
                href={CAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
              >
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                Book consultation
              </a>
            )}
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg text-ink"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <span className="block h-0.5 w-6 bg-current" />
              <span className="block h-0.5 w-6 bg-current" />
              <span className="block h-0.5 w-6 bg-current" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer + backdrop */}
      <div
        className={`fixed inset-0 z-50 sm:hidden ${mobileOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        {/* Backdrop */}
        <div
          onClick={closeMenu}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Drawer panel slides from the right */}
        <div
          className={`absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <Link
              href="/"
              onClick={closeMenu}
              className="text-xl font-bold tracking-tight text-hilt-blue"
            >
              Hilt Health
            </Link>
            <button
              onClick={closeMenu}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-snow"
              aria-label="Close menu"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-1 p-4">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                    active
                      ? "bg-blue-50 text-hilt-blue"
                      : "text-slate hover:bg-snow hover:text-ink"
                  }`}
                >
                  <span>{link.label}</span>
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-hilt-blue" aria-hidden="true" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Primary CTAs */}
          <div className="mt-auto space-y-3 border-t border-gray-100 p-4">
            {!isLoggedIn && (
              <a
                href={CAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMenu}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-green-700"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                Book a Consultation
              </a>
            )}
            <a
              href="/signup"
              onClick={closeMenu}
              className="flex w-full items-center justify-center rounded-xl border-2 border-hilt-blue px-5 py-3 text-base font-semibold text-hilt-blue transition-colors hover:bg-blue-50"
            >
              Start Free Trial
            </a>
          </div>

          {/* Sign in row */}
          <div className="border-t border-gray-100 px-4 py-3 text-center">
            <Link
              href="/login"
              onClick={closeMenu}
              className="text-sm font-medium text-slate transition-colors hover:text-ink"
            >
              Already a customer?{" "}
              <span className="font-semibold text-hilt-blue">Sign in →</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
