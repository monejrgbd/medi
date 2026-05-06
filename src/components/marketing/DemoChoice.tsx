"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type Option = {
  href: string;
  title: string;
  description: string;
  duration: string;
  accent: string;
  icon: React.ReactNode;
};

const options: Option[] = [
  {
    href: "/demo",
    title: "Live demo",
    description: "Talk to the AI yourself, like a patient would.",
    duration: "~3 min",
    accent: "hover:bg-blue-50",
    icon: (
      <svg className="h-5 w-5 text-hilt-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    ),
  },
  {
    href: "/demo?mode=quick",
    title: "Quick demo",
    description: "Watch a scripted patient conversation play through.",
    duration: "~30 sec",
    accent: "hover:bg-green-50",
    icon: (
      <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
      </svg>
    ),
  },
];

export default function DemoChoice() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate shadow-sm transition-all hover:border-hilt-blue/40 hover:text-hilt-blue focus:outline-none focus:ring-2 focus:ring-hilt-blue/30"
      >
        Try a demo
        <svg
          className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.25"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="demo-choice-pop absolute left-1/2 top-full z-30 mt-2 w-[340px] -translate-x-1/2 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl ring-1 ring-black/5"
        >
          {options.map((opt) => (
            <Link
              key={opt.href}
              href={opt.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={`group flex items-start gap-3 rounded-xl p-3 transition-colors ${opt.accent}`}
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 ring-1 ring-black/5 transition-colors group-hover:bg-white">
                {opt.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{opt.title}</p>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium tabular-nums text-ash">
                    {opt.duration}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-snug text-slate">{opt.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style jsx>{`
        .demo-choice-pop {
          animation: demoChoicePop 0.16s ease-out;
        }
        @keyframes demoChoicePop {
          from {
            opacity: 0;
            transform: translate(-50%, -4px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .demo-choice-pop {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
