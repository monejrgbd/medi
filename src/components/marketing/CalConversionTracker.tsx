"use client";

import { useEffect } from "react";

/**
 * Catches clicks on any <a> pointing to cal.com/102937474 anywhere in the
 * marketing tree and fires the Google Ads conversion. Works with regular
 * clicks, cmd/ctrl-click, and middle-click (auxclick), so we capture every
 * outbound book attempt without sprinkling onClick handlers on every link.
 */
export default function CalConversionTracker() {
  useEffect(() => {
    function fireConversion() {
      if (typeof window === "undefined" || typeof window.gtag !== "function") return;
      window.gtag("event", "conversion", {
        send_to: "AW-18032484152/9-IpCO_ljpccELi-x5ZD",
        transaction_id: `book-${Date.now()}`,
      });
    }

    function handler(e: MouseEvent) {
      // Skip if another handler already canceled the navigation
      if (e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      if (!href.includes("cal.com/102937474")) return;
      fireConversion();
    }

    document.addEventListener("click", handler);
    document.addEventListener("auxclick", handler);
    return () => {
      document.removeEventListener("click", handler);
      document.removeEventListener("auxclick", handler);
    };
  }, []);

  return null;
}
