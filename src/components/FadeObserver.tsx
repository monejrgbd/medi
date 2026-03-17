"use client";

import { useEffect } from "react";

export default function FadeObserver() {
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
  }, []);

  return null;
}
