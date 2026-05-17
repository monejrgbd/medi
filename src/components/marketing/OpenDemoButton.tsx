"use client";

/* "Try the 60 second demo" button. Opens the MockupTour chooser (Live /
   Quick / Book) directly by dispatching a window event the (mounted)
   MockupTour listens for, instead of scrolling to the demo section. */

type Props = { variant?: "light" | "dark"; className?: string };

export default function OpenDemoButton({ variant = "light", className = "" }: Props) {
  const styles =
    variant === "dark"
      ? "border border-white/25 bg-white/5 text-white backdrop-blur hover:bg-white/10"
      : "border border-gray-200 bg-white text-ink shadow-sm hover:border-hilt-blue/40 hover:text-hilt-blue";
  const iconColor = variant === "dark" ? "" : "text-hilt-blue";

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("hilt:open-demo"))}
      className={`inline-flex items-center gap-2 rounded-xl px-6 py-4 text-base font-semibold transition-all hover:-translate-y-0.5 ${styles} ${className}`}
    >
      <svg className={`h-4 w-4 ${iconColor}`} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
      </svg>
      Try the 60 second demo
    </button>
  );
}
