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

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (preselect) {
      sessionStorage.setItem("preselectInterest", preselect);
    }
    if (window.location.pathname === "/") {
      window.dispatchEvent(new CustomEvent("preselectInterest"));
      const el = document.getElementById("contact");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      sessionStorage.setItem("scrollToContact", "1");
      router.push("/");
    }
  }

  return (
    <a href="/" onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
