"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { requestDemoOtp, verifyDemoOtp, startPrelogDemo } from "@/app/demo/_actions/demo";
import { Shield } from "lucide-react";

interface DemoGateProps {
  existingSession: boolean;
}

export default function DemoGate({ existingSession }: DemoGateProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prelogEmail = searchParams.get("prelog");
  const isPrelog = !!prelogEmail && !existingSession;
  const [teamCode, setTeamCode] = useState(() => {
    const fromUrl = searchParams.get("team");
    if (fromUrl) {
      const code = fromUrl.toUpperCase();
      if (typeof window !== "undefined") localStorage.setItem("demo_team_code", code);
      return code;
    }
    if (typeof window !== "undefined") {
      return localStorage.getItem("demo_team_code") || "";
    }
    return "";
  });
  const [prelogState, setPrelogState] = useState<"choose" | "loading" | "failed">("choose");

  const [showCodeInput, setShowCodeInput] = useState(false);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first OTP input when switching to OTP step
  useEffect(() => {
    if (step === "otp") {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handlePrelogLive() {
    if (!prelogEmail) return;
    setPrelogState("loading");
    const result = await startPrelogDemo(prelogEmail);
    if (!result.success) {
      setPrelogState("failed");
      return;
    }
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "conversion", {
        send_to: "AW-18032484152/BFv3CO3bpZccELi-x5ZD",
        transaction_id: `demo-${prelogEmail}`,
      });
    }
    router.refresh();
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await requestDemoOtp(email, teamCode || undefined);
    setLoading(false);

    if (result.success) {
      setStep("otp");
      setResendCooldown(60);
    } else {
      setError(result.error ?? "Failed to send code.");
    }
  }

  const submitOtp = useCallback(
    async (digits: string[]) => {
      const code = digits.join("");
      if (code.length !== 6) return;

      setError("");
      setLoading(true);

      const result = await verifyDemoOtp(email, code);
      setLoading(false);

      if (result.success) {
        if (typeof window !== "undefined" && typeof window.gtag === "function") {
          window.gtag("event", "conversion", {
            send_to: "AW-18032484152/BFv3CO3bpZccELi-x5ZD",
            transaction_id: `demo-${email}`,
          });
        }
        router.refresh();
      } else {
        setError(result.error ?? "Verification failed.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    },
    [email, router]
  );

  function handleOtpChange(index: number, value: string) {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (digit && newOtp.every((d) => d !== "")) {
      submitOtp(newOtp);
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newOtp = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);

    if (pasted.length === 6) {
      submitOtp(newOtp);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  }

  // Prelog mode picker: show Live/Quick/Book choice before auto-login
  if (isPrelog && prelogState === "choose") {
    const chevron = (
      <svg
        className="mt-1 h-5 w-5 shrink-0 text-ash transition-transform duration-200 group-hover:translate-x-1 group-hover:text-ink"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    );
    const cardBase =
      "group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-hilt-blue/30";
    return (
      <div className="min-h-screen bg-snow flex items-start justify-center pt-20 px-4">
        <div className="w-full max-w-lg">
          <a
            href="/"
            className="inline-flex items-center gap-1 text-sm text-slate hover:text-ink transition-colors mb-6"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back
          </a>
          <div className="text-center mb-8">
            <p className="text-2xl font-bold text-hilt-blue mb-2">Hilt Health</p>
            <h1 className="text-xl font-semibold text-ink">How would you like to try it?</h1>
          </div>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handlePrelogLive}
              className={`${cardBase} hover:border-hilt-blue/50 hover:bg-blue-50/40`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-hilt-blue/10 text-hilt-blue">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-base font-semibold text-ink">Live demo</p>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-ash">~3 min</span>
                </div>
                <p className="mt-1 text-sm leading-snug text-slate">Be the patient yourself. Type a symptom, see what the AI asks back.</p>
              </div>
              {chevron}
            </button>
            <a
              href="/?demo=quick"
              className={`${cardBase} hover:border-green-500/40 hover:bg-green-50/50`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
                <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-base font-semibold text-ink">Quick demo</p>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-ash">~60 sec</span>
                </div>
                <p className="mt-1 text-sm leading-snug text-slate">Click through every screen, one mockup at a time.</p>
              </div>
              {chevron}
            </a>
            <a
              href="https://cal.com/102937474/hilt-health-meeting"
              target="_blank"
              rel="noopener noreferrer"
              className={`${cardBase} hover:border-violet-500/40 hover:bg-violet-50/50`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-base font-semibold text-ink">Book a meeting</p>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-ash">~15 min</span>
                </div>
                <p className="mt-1 text-sm leading-snug text-slate">Let us be with you on a call. We will walk you through it ourselves.</p>
              </div>
              {chevron}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Prelog loading state: show spinner while auto-login is in flight
  if (isPrelog && prelogState === "loading") {
    return (
      <div className="min-h-screen bg-snow flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-hilt-blue mb-2">Hilt Health</p>
          <div className="w-6 h-6 border-2 border-hilt-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate text-sm">Starting your demo...</p>
        </div>
      </div>
    );
  }

  // Prelog failed: show error with option to fall back to email
  if (isPrelog && prelogState === "failed") {
    return (
      <div className="min-h-screen bg-snow flex items-start justify-center pt-20 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <p className="text-2xl font-bold text-hilt-blue mb-2">Hilt Health</p>
            <h1 className="text-xl font-semibold text-ink">Demo link unavailable</h1>
            <p className="text-slate mt-1 text-sm">
              That link is not active or has been used too many times today.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/demo")}
            className="w-full bg-hilt-blue text-white font-medium py-2.5 rounded-lg hover:bg-hilt-blue/90 transition-colors"
          >
            Use email instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-snow flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <a
            href="/"
            className="inline-flex items-center gap-1 text-sm text-slate hover:text-ink transition-colors"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back
          </a>
          {teamCode ? (
            <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-md font-mono">
              {teamCode.toUpperCase()}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setShowCodeInput(!showCodeInput)}
              className="p-1.5 rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
              title="Enter team code"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
              </svg>
            </button>
          )}
        </div>
        {/* Team code input */}
        {showCodeInput && (
          <div className="mb-4 flex items-center gap-2">
            <input
              type="text"
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
              placeholder="Team code"
              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-mono tracking-wider"
              autoFocus
            />
            <button
              type="button"
              onClick={() => { if (teamCode) { localStorage.setItem("demo_team_code", teamCode.toUpperCase()); setShowCodeInput(false); } }}
              disabled={!teamCode}
              className="px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              Save
            </button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-hilt-blue mb-2">Hilt Health</p>
          <h1 className="text-xl font-semibold text-ink">Try the Live Demo</h1>
          <p className="text-slate mt-1 text-sm">
            Experience the full patient to doctor flow
          </p>
        </div>

        {/* Intro note */}
        <div className="mb-4 rounded-lg bg-blue-50 border border-blue-100 p-3">
          <p className="text-xs text-blue-700">
            Every clinic is different. Features are enabled per location, and we build custom workflows for clients who need them.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {existingSession && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              Starting the demo will sign you out of your current account.
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleEmailSubmit}>
              <label
                htmlFor="demo-email"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Email address
              </label>
              <input
                id="demo-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 mb-4 border border-gray-200 rounded-lg text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-hilt-blue/30 focus:border-hilt-blue"
              />

              {error && (
                <p className="text-red-600 text-sm mb-3">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-hilt-blue text-white font-medium py-2.5 rounded-lg hover:bg-hilt-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Sending..." : "Send Code"}
              </button>
            </form>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-hilt-blue" />
                <p className="text-sm font-medium text-ink">
                  Enter verification code
                </p>
              </div>
              <p className="text-sm text-slate mb-1">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-ink">{email}</span>
              </p>
              <p className="text-xs text-gray-400 mb-4">
                It may take up to a minute to arrive.
              </p>

              <div
                className="flex gap-2 justify-center mb-4"
                onPaste={handleOtpPaste}
              >
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-14 text-center text-xl font-semibold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hilt-blue/30 focus:border-hilt-blue text-ink"
                  />
                ))}
              </div>

              {loading && (
                <p className="text-sm text-slate text-center mb-3">
                  Verifying...
                </p>
              )}

              {error && (
                <p className="text-red-600 text-sm text-center mb-3">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-center gap-3 text-sm">
                <button
                  type="button"
                  disabled={loading || resendCooldown > 0}
                  onClick={async () => {
                    if (resendCooldown > 0) return;
                    setError("");
                    setOtp(["", "", "", "", "", ""]);
                    const result = await requestDemoOtp(email, teamCode || undefined);
                    if (!result.success) {
                      setError(result.error ?? "Failed to resend.");
                    } else {
                      setResendCooldown(60);
                    }
                    inputRefs.current[0]?.focus();
                  }}
                  className="text-hilt-blue hover:text-hilt-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp(["", "", "", "", "", ""]);
                    setError("");
                  }}
                  className="text-slate hover:text-ink transition-colors"
                >
                  Change email
                </button>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
            This is a demo environment. Please do not enter real medical
            information.
          </p>
        </div>
      </div>
    </div>
  );
}
