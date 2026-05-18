"use client";

import { useEffect } from "react";
import { GOOGLE_LOC_TO_COUNTRY, COUNTRY_CODES } from "@/lib/country";

/**
 * Post-hydration backstop for the blocking inline script in the marketing
 * layout. The inline script handles the no-flash hard-load path; this
 * re-applies detection after hydration so the active country survives any
 * React reconciliation. Renders nothing.
 */
export default function CountryDetector() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const loc = params.get("country");
      let country: string;
      if (loc && GOOGLE_LOC_TO_COUNTRY[loc]) {
        country = GOOGLE_LOC_TO_COUNTRY[loc];
        try {
          localStorage.setItem("hilt_country", country);
        } catch {
          /* private mode / storage disabled */
        }
      } else {
        let saved: string | null = null;
        try {
          saved = localStorage.getItem("hilt_country");
        } catch {
          /* private mode / storage disabled */
        }
        country = saved && COUNTRY_CODES.includes(saved) ? saved : "GENERIC";
      }
      document
        .getElementById("country-root")
        ?.setAttribute("data-country", country);
    } catch {
      /* never break the page over personalization */
    }
  }, []);

  return null;
}
