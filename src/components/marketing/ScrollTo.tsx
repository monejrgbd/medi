"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollTo() {
  const pathname = usePathname();

  useEffect(() => {
    const target = sessionStorage.getItem("scrollToContact");
    if (!target) return;

    sessionStorage.removeItem("scrollToContact");
    const el = document.getElementById("contact");
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "instant" });
      }, 100);
    }
  }, [pathname]);

  return null;
}
