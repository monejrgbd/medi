"use client";

import Link from "next/link";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { signOutDemoUser } from "@/app/demo/_actions/demo";
import { useRouter } from "next/navigation";

interface DemoCompleteProps {
  onRestart: () => void;
}

export default function DemoComplete({ onRestart }: DemoCompleteProps) {
  const router = useRouter();

  async function handleSignOut() {
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
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-hilt-blue text-white font-medium rounded-lg hover:bg-hilt-blue/90 transition-colors"
          >
            Sign Up
          </Link>
          <button
            onClick={onRestart}
            className="inline-flex items-center justify-center px-6 py-2.5 bg-white border border-gray-200 text-ink font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Start Another Demo
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
