"use client";

import { useEffect } from "react";
import { GCLID_COOKIE_NAME, GCLID_COOKIE_TTL_SECONDS } from "@/lib/constants";

/**
 * Captures Google Ads click identifiers (gclid / gbraid / wbraid) from the
 * landing URL into a first-party cookie so they survive the visitor's browsing
 * until signup, where OwnerSignUpForm persists them to the org. The org's
 * stored gclid is later used for the server-side offline Purchase conversion
 * upload when that org pays.
 *
 * Last-touch: a new ad click (a new identifier in the URL) overwrites the
 * cookie, matching Google's last-click attribution and its own _gcl_aw cookie.
 * Normal navigation with no ad params leaves an existing capture untouched.
 * Mirrors CalConversionTracker (a client effect mounted in the marketing tree).
 */
export default function ClickIdCapture() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const gclid = params.get("gclid");
    const gbraid = params.get("gbraid");
    const wbraid = params.get("wbraid");
    if (!gclid && !gbraid && !wbraid) return;

    const payload: Record<string, string> = {};
    if (gclid) payload.gclid = gclid;
    if (gbraid) payload.gbraid = gbraid;
    if (wbraid) payload.wbraid = wbraid;

    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie =
      `${GCLID_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(payload))}` +
      `; path=/; max-age=${GCLID_COOKIE_TTL_SECONDS}; SameSite=Lax${secure}`;
  }, []);

  return null;
}
