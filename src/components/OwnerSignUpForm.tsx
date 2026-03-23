"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function OwnerSignUpForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [approvalCode, setApprovalCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP step state
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleSubmit(e: React.FormEvent) {
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

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError("Signup failed. Please try again.");
      setLoading(false);
      return;
    }

    // Duplicate email detection (Supabase returns empty identities)
    if (authData.user.identities?.length === 0) {
      setError("Unable to create account. This email may already be registered.");
      setLoading(false);
      return;
    }

    // With "Confirm email" enabled, session is null — user needs to verify OTP
    setUserId(authData.user.id);
    setStep("otp");
    setResendCooldown(60);
    setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "signup",
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    // Session is now established — create organization
    const { data: orgResult, error: orgError } = await supabase.rpc(
      "create_organization",
      {
        p_owner_auth_uid: userId,
        p_name: orgName,
        p_approval_code: approvalCode || null,
      }
    );

    if (orgError || (orgResult && !orgResult.success)) {
      setError(
        orgError?.message || orgResult?.error || "Failed to create organization"
      );
      setLoading(false);
      return;
    }

    // Refresh session so JWT picks up org_id from app_metadata
    await supabase.auth.refreshSession();

    window.location.href = "/d/onboarding";
  }

  async function handleResendOtp() {
    if (resendCooldown > 0 || loading) return;
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setLoading(false);

    if (resendError) {
      setError(resendError.message);
      return;
    }

    setResendCooldown(60);
  }

  if (step === "otp") {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-4">
        <h1 className="text-2xl font-bold text-ink">Verify your email</h1>
        <p className="text-sm text-slate">
          We sent a 6-digit code to <span className="font-medium text-ink">{email}</span>
        </p>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Verification Code
          </label>
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
            onClick={handleResendOtp}
            disabled={resendCooldown > 0 || loading}
            className="font-medium text-hilt-blue hover:underline disabled:text-ash disabled:no-underline"
          >
            {loading ? "Sending..." : resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("form");
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-2xl font-bold text-ink">Create your account</h1>
      <p className="text-sm text-slate">
        Start your free trial with 20 credits. No card required.
      </p>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Full Name
        </label>
        <input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
          placeholder="Dr. Sarah Smith"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
          placeholder="sarah@clinic.com"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Password
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
          placeholder="At least 8 characters"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Confirm Password
        </label>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
          placeholder="Re-enter your password"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Organization Name
        </label>
        <input
          type="text"
          required
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
          placeholder="Smith Family Clinic"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Approval Code{" "}
          <span className="font-normal text-ash">(optional)</span>
        </label>
        <input
          type="text"
          value={approvalCode}
          onChange={(e) => setApprovalCode(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
          placeholder="Enter code for premium trial"
        />
        <p className="mt-1 text-xs text-ash">
          Have an approval code? Enter it for 200 credits and a 30-day trial.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-hilt-blue py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hilt-blue-dark disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Create Account"}
      </button>

      <p className="text-center text-sm text-slate">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-hilt-blue hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
