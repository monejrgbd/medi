"use client";

/* Navigates to another page and scrolls to a section there WITHOUT putting a
   hash in the URL (uses the ScrollTo sessionStorage handoff). This keeps a
   refresh at the top of the page instead of jumping back to the section.
   The href still carries the hash as a no-JS fallback. */

import { useRouter } from "next/navigation";

export default function SectionLink({
  to,
  section,
  className,
  children,
}: {
  to: string;
  section: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (window.location.pathname === to) {
      document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
    } else {
      sessionStorage.setItem("scrollTo", section);
      router.push(to);
    }
  }

  return (
    <a href={`${to}#${section}`} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
