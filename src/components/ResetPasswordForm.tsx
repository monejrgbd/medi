"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "otp" | "password" | "done">("email");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);

    setLoading(false);

    if (resetError) {
      setError("Could not send reset code. Please try again.");
      return;
    }

    setStep("otp");
    setResendCooldown(60);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "recovery",
    });

    setLoading(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    // Session is now established — move to password step
    setStep("password");
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setStep("done");
    setTimeout(() => {
      window.location.href = "/d/select-role";
    }, 2000);
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError("");

    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resetPasswordForEmail(email);

    if (resendError) {
      setError(resendError.message);
      return;
    }

    setResendCooldown(60);
  }

  if (step === "done") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-ink">Password updated</h1>
        <p className="text-sm text-slate">
          Your password has been changed. Redirecting to dashboard...
        </p>
      </div>
    );
  }

  if (step === "password") {
    return (
      <form onSubmit={handleSetPassword} className="space-y-4">
        <h1 className="text-2xl font-bold text-ink">Set new password</h1>
        <p className="text-sm text-slate">Enter your new password below.</p>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">New Password</label>
          <input
            type="password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Confirm New Password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
            placeholder="Re-enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-hilt-blue py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hilt-blue-dark disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    );
  }

  if (step === "otp") {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-4">
        <h1 className="text-2xl font-bold text-ink">Enter reset code</h1>
        <p className="text-sm text-slate">
          We sent a 6-digit code to <span className="font-medium text-ink">{email}</span>
        </p>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Reset Code</label>
          <input
            type="text"
            required
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-center text-2xl font-bold tracking-[0.3em] focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
            placeholder="000000"
          />
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full rounded-lg bg-hilt-blue py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hilt-blue-dark disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="font-medium text-hilt-blue hover:underline disabled:text-ash disabled:no-underline"
          >
            {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setOtp("");
              setError("");
            }}
            className="text-slate hover:underline"
          >
            Use a different email?
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendCode} className="space-y-4">
      <h1 className="text-2xl font-bold text-ink">Reset your password</h1>
      <p className="text-sm text-slate">
        Enter your email and we&apos;ll send you a code to reset your password.
      </p>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Email</label>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
          placeholder="sarah@clinic.com"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-hilt-blue py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hilt-blue-dark disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send Reset Code"}
      </button>

      <p className="text-center text-sm text-slate">
        Remember your password?{" "}
        <Link href="/login" className="font-medium text-hilt-blue hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
