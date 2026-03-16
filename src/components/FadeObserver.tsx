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

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.target instanceof HTMLElement && m.target.closest("[data-no-fade-observe]")) continue;
        for (const node of m.addedNodes) {
          if (node instanceof HTMLElement) {
            if (node.classList.contains("fade-in-view") && !node.classList.contains("visible")) {
              io.observe(node);
            }
            observeNew(node);
          }
        }
      }
    });

    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
