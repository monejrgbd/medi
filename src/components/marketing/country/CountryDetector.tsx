"use client";

import { useEffect } from "react";
import { GOOGLE_LOC_TO_COUNTRY, COUNTRY_CODES } from "@/lib/country";

/**
 * Post-hydration country detection backstop + IP fallback.
 *
 * Priority (matches the inline no-flash script, then adds IP):
 *   1. ?country= ad param  → applied AND persisted to localStorage
 *   2. localStorage choice → applied (explicit prior visit)
 *   3. IP via /api/geo     → applied EPHEMERALLY (never persisted), only when
 *                            there is no explicit signal, never overrides one
 *   4. otherwise           → GENERIC (untouched SSR default)
 *
 * Guardrails: IP is lowest priority, never written to localStorage (a bad
 * geo guess lasts one pageview, not the journey), and never overrides an
 * explicit param/stored choice. SSR is always GENERIC, so Googlebot indexes
 * the global page regardless of any of this.
 */
export default function CountryDetector() {
  useEffect(() => {
    let cancelled = false;
    const root = () => document.getElementById("country-root");

    try {
      const params = new URLSearchParams(window.location.search);
      const loc = params.get("country");

      // 1. Explicit ad param — highest priority, persists.
      if (loc && GOOGLE_LOC_TO_COUNTRY[loc]) {
        const c = GOOGLE_LOC_TO_COUNTRY[loc];
        try {
          localStorage.setItem("hilt_country", c);
        } catch {
          /* storage disabled */
        }
        root()?.setAttribute("data-country", c);
        return;
      }

      // 2. Explicit prior choice in localStorage.
      let saved: string | null = null;
      try {
        saved = localStorage.getItem("hilt_country");
      } catch {
        /* storage disabled */
      }
      if (saved && COUNTRY_CODES.includes(saved)) {
        root()?.setAttribute("data-country", saved);
        return;
      }

      // 3. No explicit signal → IP fallback. Ephemeral: not persisted, and
      //    re-checked so it never overrides an explicit choice.
      fetch("/api/geo")
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { country?: string | null } | null) => {
          if (cancelled || !data?.country) return;
          if (!COUNTRY_CODES.includes(data.country)) return;
          let explicit: string | null = null;
          try {
            explicit = localStorage.getItem("hilt_country");
          } catch {
            /* storage disabled */
          }
          if (explicit && COUNTRY_CODES.includes(explicit)) return;
          root()?.setAttribute("data-country", data.country);
        })
        .catch(() => {
          /* geo is best-effort; GENERIC stays */
        });
    } catch {
      /* never break the page over personalization */
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
