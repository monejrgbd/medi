"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollTo() {
  const pathname = usePathname();

  useEffect(() => {
    // Backward compatible: contact form deep-link (ContactLink).
    if (sessionStorage.getItem("scrollToContact")) {
      sessionStorage.removeItem("scrollToContact");
      const el = document.getElementById("contact");
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "instant" }), 100);
      return;
    }
    // Generic: scroll to any element id once, then forget it. No URL hash is
    // ever set, so a refresh stays at the top instead of jumping to it.
    const id = sessionStorage.getItem("scrollTo");
    if (!id) return;
    sessionStorage.removeItem("scrollTo");
    const el = document.getElementById(id);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "instant" }), 100);
  }, [pathname]);

  return null;
}
