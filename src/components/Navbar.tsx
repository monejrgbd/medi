"use client";

import { useState, useEffect } from "react";
import SignInModal from "./SignInModal";

export default function Navbar() {
  const [modalOpen, setModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToContact() {
    setMobileOpen(false);
    const el = document.getElementById("contact");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "/#contact";
    }
  }

  return (
    <>
      <nav
        className={`sticky top-0 z-40 transition-all duration-200 ${
          scrolled ? "bg-white/95 backdrop-blur shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <a href="/" className="text-2xl font-bold text-hilt-blue tracking-tight">
            hilthealth
          </a>

          <div className="hidden sm:flex items-center gap-3">
            <a
              href="/blog"
              className="px-4 py-2.5 text-sm font-medium text-slate transition-colors hover:text-ink"
            >
              Blog
            </a>
            <a
              href="/pricing"
              className="px-4 py-2.5 text-sm font-medium text-slate transition-colors hover:text-ink"
            >
              Pricing
            </a>
            <button
              onClick={() => setModalOpen(true)}
              className="rounded-xl border-2 border-hilt-blue px-5 py-2.5 text-sm font-semibold text-hilt-blue transition-colors hover:bg-hilt-blue/5"
            >
              Sign In
            </button>
            <button
              onClick={scrollToContact}
              className="rounded-xl bg-hilt-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hilt-blue-dark"
            >
              Request Free Trial
            </button>
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
            <a
              href="/blog"
              className="block w-full rounded-xl px-5 py-3 text-center text-sm font-medium text-slate"
            >
              Blog
            </a>
            <a
              href="/pricing"
              className="block w-full rounded-xl px-5 py-3 text-center text-sm font-medium text-slate"
            >
              Pricing
            </a>
            <button
              onClick={() => { setMobileOpen(false); setModalOpen(true); }}
              className="w-full rounded-xl border-2 border-hilt-blue px-5 py-3 text-sm font-semibold text-hilt-blue"
            >
              Sign In
            </button>
            <button
              onClick={scrollToContact}
              className="w-full rounded-xl bg-hilt-blue px-5 py-3 text-sm font-semibold text-white"
            >
              Request Free Trial
            </button>
          </div>
        )}
      </nav>

      <SignInModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
