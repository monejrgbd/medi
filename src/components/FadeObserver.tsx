"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function FadeObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "-60px 0px" }
    );

    function observeNew(root: ParentNode) {
      root.querySelectorAll(".fade-in-view:not(.visible)").forEach((el) => io.observe(el));
    }

    observeNew(document);
    requestAnimationFrame(() => observeNew(document));

    return () => {
      io.disconnect();
    };
  }, [pathname]);

  return null;
}
