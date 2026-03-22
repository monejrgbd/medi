"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function TeamCodeCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("team");
    if (code) {
      localStorage.setItem("demo_team_code", code.toUpperCase());
    }
  }, [searchParams]);

  return null;
}
