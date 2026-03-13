"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface PhoneVerificationProps {
  phone: string;
  visitId: string;
  sessionToken: string;
  locationId: string;
  verificationId: string;
  onVerified: () => void;
  onResend: () => void;
  onError: (msg: string) => void;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function PhoneVerification({
  phone,
  visitId,
  sessionToken,
  locationId,
  verificationId,
  onVerified,
  onResend,
  onError,
}: PhoneVerificationProps) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { t } = useLanguage();

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Start cooldown on mount
  useEffect(() => {
    setCooldown(60);
  }, []);

  const maskedPhone = phone.length >= 4 ? `***-***-${phone.slice(-4)}` : '***-***-****';

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;

      const newDigits = [...digits];
      if (value.length > 1) {
        // Handle paste
        const pasted = value.replace(/\D/g, "").slice(0, 6);
        for (let i = 0; i < 6; i++) {
          newDigits[i] = pasted[i] || "";
        }
        setDigits(newDigits);
        const nextEmpty = newDigits.findIndex((d) => !d);
        const focusIdx = nextEmpty === -1 ? 5 : nextEmpty;
        inputRefs.current[focusIdx]?.focus();
        return;
      }

      newDigits[index] = value;
      setDigits(newDigits);

      // Auto-advance
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits]
  );

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-phone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          action: "verify_code",
          phone,
          code,
          verification_id: verificationId,
          session_token: sessionToken,
          visit_id: visitId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        onVerified();
        return;
      }

      if (data.attempts_remaining !== undefined) {
        setAttemptsRemaining(data.attempts_remaining);
      }

      setError(data.error || "Verification failed");

      if (data.attempts_remaining === 0) {
        setError("Too many attempts. Please request a new code.");
      }
    } catch {
      setError("Failed to verify code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-submit when all digits filled
  useEffect(() => {
    if (digits.every((d) => d) && !loading) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  function handleResend() {
    setDigits(["", "", "", "", "", ""]);
    setError("");
    setAttemptsRemaining(null);
    setCooldown(60);
    onResend();
    inputRefs.current[0]?.focus();
  }

  return (
    <div className="w-full max-w-md text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
        <svg className="h-7 w-7 text-hilt-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-ink mb-2">{t("verify.title")}</h2>
      <p className="text-sm text-slate mb-6">
        {t("verify.subtitle").replace("{phone}", maskedPhone)}
      </p>

      <div className="flex justify-center gap-2 mb-4">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={digit}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="h-12 w-10 rounded-lg border border-gray-300 text-center text-lg font-semibold text-ink focus:border-hilt-blue focus:ring-1 focus:ring-hilt-blue"
          />
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {attemptsRemaining !== null && attemptsRemaining > 0 && (
        <p className="mb-4 text-xs text-ash">
          {attemptsRemaining} attempt{attemptsRemaining !== 1 ? "s" : ""} remaining
        </p>
      )}

      <button
        onClick={handleVerify}
        disabled={loading || digits.some((d) => !d)}
        className="w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 mb-3"
      >
        {loading ? t("verify.verifying") : t("verify.button")}
      </button>

      <button
        onClick={handleResend}
        disabled={cooldown > 0}
        className="w-full text-sm text-hilt-blue hover:underline disabled:text-ash disabled:no-underline py-2"
      >
        {cooldown > 0 ? t("verify.resendIn").replace("{seconds}", String(cooldown)) : t("verify.resend")}
      </button>
    </div>
  );
}
