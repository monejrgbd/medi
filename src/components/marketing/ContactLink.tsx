"use client";

import { useRouter } from "next/navigation";

export default function ContactLink({
  preselect,
  children,
  className,
}: {
  preselect?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();

  const calUrl = "https://cal.com/102937474/hilt-health-meeting";

  function handleClick(e: React.MouseEvent) {
    // "Meet with us" intent goes straight to cal.com (open in new tab)
    if (preselect === "meet") {
      // Let the default <a target="_blank"> behavior open it
      return;
    }

    e.preventDefault();
    // Default: scroll to (or navigate to) the contact form
    if (window.location.pathname === "/") {
      const el = document.getElementById("contact");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      sessionStorage.setItem("scrollToContact", "1");
      router.push("/");
    }
  }

  const href = preselect === "meet" ? calUrl : "/#contact";
  const isMeet = preselect === "meet";

  return (
    <a
      href={href}
      onClick={handleClick}
      target={isMeet ? "_blank" : undefined}
      rel={isMeet ? "noopener noreferrer" : undefined}
      className={className}
    >
      {children}
    </a>
  );
}
