"use client";

import { useEffect, useState } from "react";

const CARDS = [
  {
    headline: "Eight hours of doctor time, gone. Per day.",
    image: "/images/pain/time-lost.png",
    pain: "At least ten minutes per patient on the same intake questions and paperwork, even for returning patients. Non English speakers take twice as long or get half the detail. Fifty patients a day. That is over eight hours of doctor time, every single day.",
    fix: "AI handles intake in 130+ languages while the patient waits, remembers returning patients, and asks follow ups until nothing essential is missed. Every doctor reads the summary in their preferred language before they open the door, then signs the sick note, work letter, or SOAP note already drafted from the visit. Eight hours back, better intake, and paperwork in seconds.",
  },
  {
    headline: "Care continuity breaks. Ratings drop.",
    image: "/images/pain/patient-vanish.png",
    pain: "After the visit, nothing happens. The doctor forgets what they wanted to ask on the follow up. No one asks for a review, no record sent to the patient. You have no way to tell your own patients about new services. Continuity of care breaks down, and the next thing you hear is a one star rating on Google.",
    fix: "After the visit, everything is handled. Follow ups carry doctor instructions across visits. Happy patients guided to leave a review. Low ratings come to you privately first. Tell AI which patients to bring back and reach them by SMS.",
  },
  {
    headline: "Running on hunches, not data.",
    image: "/images/pain/flying-blind.png",
    pain: "Which doctor sees the most patients? How long are people really waiting? Who referred who? You have no idea.",
    fix: "Real time analytics. Wait times, throughput, patient volume, and referral tracking, per doctor, per location, per day.",
  },
  {
    headline: "Weak existing patient targeting, lost revenue.",
    image: "/images/pain/marketing.png",
    pain: "You know who is overdue for a cleaning. Who never got the second vaccine dose. Who would benefit from a new service you offer. But pulling that list and writing the campaign by hand takes hours you do not have, so it never happens. They drift to competitors who reach out first.",
    fix: "Tell AI who to bring back in plain English. Anyone overdue for an annual. Patients who never finished a treatment plan. Anyone not seen in a year. AI scans your records, finds the exact list, and sends a personalized SMS. The patients you already won, asked back on autopilot.",
  },
];

function CardImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-amber-100 px-6">
        <span className="text-center text-xs font-medium leading-snug text-amber-800">{alt}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover"
      onError={() => setError(true)}
    />
  );
}

export default function PainCards() {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hasHover, setHasHover] = useState(false);

  useEffect(() => {
    setHasHover(window.matchMedia("(hover: hover)").matches);
  }, []);

  function toggleExpanded(i: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className="mt-10 grid grid-cols-1 items-start gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((card, i) => {
        const isOpen = expanded.has(i) || (hasHover && hoveredIndex === i);
        return (
          <div
            key={i}
            onClick={() => toggleExpanded(i)}
            onMouseEnter={hasHover ? () => setHoveredIndex(i) : undefined}
            onMouseLeave={hasHover ? () => setHoveredIndex(null) : undefined}
            className={`group cursor-pointer rounded-2xl bg-amber-50 p-4 shadow-md transition-all duration-300 ${
              isOpen ? "-translate-y-0.5 shadow-xl" : ""
            }`}
          >
            {/* Image area with description overlay */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
              <CardImage src={card.image} alt={card.headline} />
              <div
                className={`absolute inset-0 flex flex-col gap-2 overflow-y-auto bg-amber-50/97 p-3 transition-opacity duration-300 ${
                  isOpen ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                <p className="text-[11px] leading-snug text-gray-700">{card.pain}</p>
                <div className="border-t border-amber-200 pt-2">
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-hilt-blue">
                    With Hilt
                  </p>
                  <p className="text-[11px] leading-snug text-gray-700">{card.fix}</p>
                </div>
              </div>
            </div>

            {/* Headline + chevron — fixed position below image */}
            <div className="mt-4 flex items-start justify-between gap-3">
              <h3 className="text-base font-bold leading-tight text-gray-900 lg:text-lg">
                {card.headline}
              </h3>
              <svg
                className={`mt-1 shrink-0 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#4B5563"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
