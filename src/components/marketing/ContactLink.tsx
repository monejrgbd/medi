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
    sessionStorage.setItem("scrollToContact", "1");
    if (preselect) {
      sessionStorage.setItem("preselectInterest", preselect);
    }
    router.push("/");
  }

  return (
    <a href="/" onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
