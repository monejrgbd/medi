"use client";

import { useEffect, useRef } from "react";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { signOutDemoUser } from "@/app/demo/_actions/demo";
import { useRouter } from "next/navigation";

const AUTO_SIGNOUT_MS = 3 * 60 * 1000; // 3 minutes

interface DemoCompleteProps {
  onRestart: () => void;
}

export default function DemoComplete({ onRestart }: DemoCompleteProps) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto sign-out after 3 minutes of inactivity on completion screen
  useEffect(() => {
    timerRef.current = setTimeout(async () => {
      await signOutDemoUser();
      router.push("/");
    }, AUTO_SIGNOUT_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [router]);

  async function handleSignOut() {
    if (timerRef.current) clearTimeout(timerRef.current);
    await signOutDemoUser();
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-snow flex items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        {/* Success icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-ink mb-2">
          You just experienced the full Hilt Health flow!
        </h1>

        <p className="text-slate mb-6">
          From patient check in to AI pre screening to doctor ready summary,
          all in minutes.
        </p>

        {/* Flow recap */}
        <div className="flex items-center justify-center gap-3 mb-8 text-sm">
          <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium">
            AI Pre screening
          </span>
          <span className="text-gray-300">&rarr;</span>
          <span className="bg-green-50 text-green-700 px-3 py-1.5 rounded-full font-medium">
            Instant Summary
          </span>
          <span className="text-gray-300">&rarr;</span>
          <span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full font-medium">
            Doctor Ready
          </span>
        </div>

        <p className="text-ink font-medium mb-4">
          Ready to bring this to your clinic?
        </p>

        {/* CTAs */}
        <div className="flex justify-center gap-3 mb-6">
          <button
            onClick={async () => {
              await signOutDemoUser();
              router.push("/signup");
            }}
            className="inline-flex items-center justify-center px-8 py-2.5 bg-hilt-blue text-white font-medium rounded-lg hover:bg-hilt-blue/90 transition-colors"
          >
            Start Free Trial, Up to $200 in Credits
          </button>
          <button
            onClick={async () => {
              await signOutDemoUser();
              sessionStorage.setItem("scrollToContact", "1");
              sessionStorage.setItem("preselectInterest", "meet");
              router.push("/");
            }}
            className="inline-flex items-center justify-center px-8 py-2.5 border border-hilt-blue text-hilt-blue font-medium rounded-lg hover:bg-blue-50 transition-colors"
          >
            Book a Meeting
          </button>
        </div>

        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 text-sm text-slate hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Homepage
        </button>
      </div>
    </div>
  );
}
