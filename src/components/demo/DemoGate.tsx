"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { requestDemoOtp, verifyDemoOtp } from "@/app/demo/_actions/demo";
import { Shield } from "lucide-react";

interface DemoGateProps {
  existingSession: boolean;
}

export default function DemoGate({ existingSession }: DemoGateProps) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first OTP input when switching to OTP step
  useEffect(() => {
    if (step === "otp") {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await requestDemoOtp(email);
    setLoading(false);

    if (result.success) {
      setStep("otp");
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

  return (
    <div className="min-h-screen bg-snow flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-hilt-blue mb-2">Hilt Health</p>
          <h1 className="text-xl font-semibold text-ink">Try the Live Demo</h1>
          <p className="text-slate mt-1 text-sm">
            Experience the full patient to doctor flow
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
              <p className="text-sm text-slate mb-4">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-ink">{email}</span>
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

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp(["", "", "", "", "", ""]);
                  setError("");
                }}
                className="w-full text-sm text-slate hover:text-ink transition-colors text-center"
              >
                Back
              </button>
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
