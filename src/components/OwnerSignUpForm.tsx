"use client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PLAN_CONFIG } from "@/lib/constants";
import ContactLink from "@/components/marketing/ContactLink";

type TrialType = "payg" | "starter" | "professional";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
const PLAN_IDS: Record<string, string> = (() => {
  try {
    return JSON.parse(process.env.NEXT_PUBLIC_PAYPAL_PLAN_IDS || "{}");
  } catch {
    return {};
  }
})();

export default function OwnerSignUpForm() {
  const searchParams = useSearchParams();
  const trialParam = searchParams.get("trial");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [approvalCode, setApprovalCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Trial type
  const [trialType, setTrialType] = useState<TrialType>(
    trialParam === "plans" ? "starter" : "payg"
  );
  const [paygTier, setPaygTier] = useState<"standard" | "premium">("standard");
  const [codeVerified, setCodeVerified] = useState(false);
  const [codeChecking, setCodeChecking] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [showCodeEntry, setShowCodeEntry] = useState<"premium" | "professional" | null>(null);

  // Steps: form → otp → paypal (subscription trials only)
  const [step, setStep] = useState<"form" | "otp" | "paypal">("form");
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [orgId, setOrgId] = useState("");
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleVerifyCode() {
    if (!approvalCode.trim() || codeChecking) return;
    setCodeError("");
    setCodeChecking(true);

    const supabase = createClient();
    const { data } = await supabase.rpc("validate_approval_code", {
      p_code: approvalCode.trim(),
    });

    setCodeChecking(false);

    if (data?.valid) {
      setCodeVerified(true);
      setCodeError("");
      if (showCodeEntry === "premium") { setPaygTier("premium"); }
      if (showCodeEntry === "professional") { setTrialType("professional"); }
      setShowCodeEntry(null);
    } else {
      setCodeVerified(false);
      setCodeError("Invalid or already used code");
    }
  }

  // When code changes, reset verification
  function handleCodeChange(val: string) {
    setApprovalCode(val);
    setCodeVerified(false);
    setCodeError("");
  }

  // When clicking a code-required option, only allow if verified
  function handleCodeRequiredClick(target: "professional" | "premium") {
    if (codeVerified) {
      if (target === "professional") setTrialType("professional");
      else { setTrialType("payg"); setPaygTier("premium"); }
    }
    // Always show the code entry area regardless
  }

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
    if ((trialType === "professional" || (trialType === "payg" && paygTier === "premium")) && !codeVerified) {
      setError("Please verify your premium code first");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data?.user?.identities?.length === 0) {
      setError("This email is already registered. Try logging in instead.");
      return;
    }

    setUserId(data?.user?.id || "");
    setStep("otp");
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

    // Create organization
    const { data: orgResult, error: orgError } = await supabase.rpc(
      "create_organization",
      {
        p_owner_auth_uid: userId,
        p_name: orgName,
        p_approval_code: (trialType === "professional" || (trialType === "payg" && approvalCode.trim())) ? (approvalCode || null) : null,
      }
    );

    if (orgError || (orgResult && !orgResult.success)) {
      setError(orgError?.message || orgResult?.error || "Failed to create organization");
      setLoading(false);
      return;
    }

    await supabase.auth.refreshSession();
    setOrgId(orgResult?.org_id || "");
    setLoading(false);

    // Google Ads conversion tracking
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "conversion", {
        send_to: "AW-18032484152/aLYSCMb5oZEcELi-x5ZD",
        value: 1.0,
        currency: "CAD",
        transaction_id: orgResult?.org_id || "",
      });
    }

    // Subscription trials: show PayPal step
    if (trialType === "starter" || trialType === "professional") {
      setStep("paypal");
      return;
    }

    // PAyG: go straight to onboarding
    window.location.href = "/d/onboarding";
  }

  async function handleResendOtp() {
    if (resendCooldown > 0 || loading) return;
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data, error: resendError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    setLoading(false);

    if (resendError) {
      setError(resendError.message);
      return;
    }

    if (data?.user?.identities?.length === 0) {
      setError("This email is already confirmed. Try logging in instead.");
      return;
    }

    setResendCooldown(60);
  }

  // PayPal SDK loader
  useEffect(() => {
    if (step !== "paypal" || !PAYPAL_CLIENT_ID) return;
    if (document.querySelector('script[src*="paypal.com/sdk/js"]')) return;

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=subscription`;
    script.dataset.sdkIntegrationSource = "button-factory";
    script.onload = () => renderPayPalButton();
    document.head.appendChild(script);
  }, [step]);

  useEffect(() => {
    if (step === "paypal" && window.paypal) {
      renderPayPalButton();
    }
  }, [step, billing, trialType]);

  function renderPayPalButton() {
    if (!window.paypal) return;
    const container = document.getElementById("paypal-trial-btn");
    if (!container) return;
    container.innerHTML = "";

    // Use trial plan IDs for signup (monthly only, annual has no trial)
    const planKey = billing === "monthly" ? `${trialType}_monthly_trial` : `${trialType}_annual`;
    const planId = PLAN_IDS[planKey];
    if (!planId) return;

    window.paypal.Buttons({
      style: { layout: "vertical", label: "subscribe", shape: "rect", color: "blue", height: 45 },
      createSubscription: (
        _data: unknown,
        actions: { subscription: { create: (opts: Record<string, unknown>) => Promise<string> } }
      ) => {
        return actions.subscription.create({
          plan_id: planId,
          custom_id: `${orgId}:${trialType}:${billing}`,
          quantity: "1",
        });
      },
      onApprove: () => {
        window.location.href = "/d/onboarding";
      },
      onError: () => {
        setError("PayPal checkout failed. Please try again.");
      },
    }).render(container);
  }

  // --- PayPal step ---
  if (step === "paypal") {
    const plan = trialType === "professional" ? PLAN_CONFIG.professional : PLAN_CONFIG.starter;
    const displayPrice = billing === "annual" ? plan.annual : plan.price;

    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-ink">Start your free trial</h1>
        <p className="text-sm text-slate">
          {plan.label} plan. 14 days free, then ${displayPrice}/doctor and nurse/mo. Cancel anytime.
        </p>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-ink">{plan.label}</p>
              <p className="text-xs text-slate">{trialType === "starter" ? "Standard AI" : "Advanced AI"}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-ink">${displayPrice}</p>
              <p className="text-xs text-slate">/doctor and nurse/mo after trial</p>
            </div>
          </div>

          {/* Billing toggle */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-4">
            <button
              onClick={() => setBilling("monthly")}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                billing === "monthly" ? "bg-white text-ink shadow-sm" : "text-slate"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                billing === "annual" ? "bg-white text-ink shadow-sm" : "text-slate"
              }`}
            >
              Annual (save 20%)
            </button>
          </div>

          <div id="paypal-trial-btn" className="min-h-[50px]" />
        </div>

        <button
          onClick={() => { window.location.href = "/d/onboarding"; }}
          className="w-full text-center text-sm text-slate hover:text-ink transition-colors"
        >
          Skip and continue with pay as you go trial
        </button>
      </div>
    );
  }

  // --- OTP step ---
  if (step === "otp") {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-4">
        <h1 className="text-2xl font-bold text-ink">Verify your email</h1>
        <p className="text-sm text-slate">
          We sent a 6-digit code to <span className="font-medium text-ink">{email}</span>
        </p>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Verification Code</label>
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
            onClick={() => { setStep("form"); setOtp(""); setError(""); }}
            className="text-slate hover:underline"
          >
            Use a different email?
          </button>
        </div>
      </form>
    );
  }

  // --- Signup form ---
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-2xl font-bold text-ink">Create your account</h1>
      <p className="text-sm text-slate">
        Choose your trial type and get started in minutes.
      </p>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Full Name</label>
        <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
          placeholder="Dr. Sarah Smith" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
          placeholder="sarah@clinic.com" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Password</label>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
          placeholder="At least 8 characters" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Confirm Password</label>
        <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
          placeholder="Re-enter your password" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Organization Name</label>
        <input type="text" required value={orgName} onChange={(e) => setOrgName(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
          placeholder="Smith Family Clinic" />
      </div>

      {/* Trial type selector — two boxes */}
      <div>
        <label className="mb-3 block text-sm font-medium text-ink">Choose your trial</label>
        <div className="grid grid-cols-2 gap-3 items-stretch">

          {/* Pay As You Go */}
          <button type="button" onClick={() => setTrialType("payg")}
            className={`flex flex-col rounded-xl border p-4 text-left transition-colors ${
              trialType === "payg" ? "border-hilt-blue bg-blue-50 ring-1 ring-hilt-blue" : "border-gray-200 hover:border-gray-300"
            }`}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-ink">Pay As You Go</p>
              <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${trialType === "payg" ? "border-hilt-blue bg-hilt-blue" : "border-gray-300"}`}>
                {trialType === "payg" && <div className="mx-auto mt-[3px] h-1.5 w-1.5 rounded-full bg-white" />}
              </div>
            </div>
            <p className="text-lg font-bold text-ink mt-2">Up to $200</p>
            <p className="text-[11px] text-ash">in credits · no card required</p>
            <div className="mt-3 space-y-1">
              <p className="text-xs text-slate">✓ $20 to start, $200 with code</p>
              <p className="text-xs text-slate">✓ Every feature included</p>
            </div>
          </button>

          {/* Subscription Plans */}
          <button type="button" onClick={() => setTrialType(trialType === "professional" ? "professional" : "starter")}
            className={`flex flex-col rounded-xl border p-4 text-left transition-colors ${
              trialType === "starter" || trialType === "professional" ? "border-hilt-blue bg-blue-50 ring-1 ring-hilt-blue" : "border-gray-200 hover:border-gray-300"
            }`}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-ink">Subscription</p>
              <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${trialType === "starter" || trialType === "professional" ? "border-hilt-blue bg-hilt-blue" : "border-gray-300"}`}>
                {(trialType === "starter" || trialType === "professional") && <div className="mx-auto mt-[3px] h-1.5 w-1.5 rounded-full bg-white" />}
              </div>
            </div>
            <p className="text-lg font-bold text-ink mt-2">14 days</p>
            <p className="text-[11px] text-ash">50 screenings included</p>
            <div className="mt-3 space-y-1">
              <p className="text-xs text-slate">✓ Starter or Professional</p>
              <p className="text-xs text-slate">✓ Every feature included</p>
            </div>
          </button>
        </div>

        {/* PAyG sub-picker */}
        {trialType === "payg" && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { setPaygTier("standard"); }}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                paygTier === "standard" ? "border-hilt-blue bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}>
              <p className="text-xs font-semibold text-ink">$20 Credits</p>
              <p className="text-[11px] text-slate">No code needed</p>
            </button>
            <button type="button" onClick={() => { if (codeVerified) { setPaygTier("premium"); } else { setShowCodeEntry("premium"); } }}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                paygTier === "premium" && codeVerified ? "border-hilt-blue bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}>
              <p className="text-xs font-semibold text-ink">$200 Credits</p>
              <p className="text-[11px] text-slate">Premium code needed</p>
              {codeVerified
                ? <span className="inline-block rounded-full bg-green-50 px-1.5 py-0.5 text-[9px] font-medium text-green-700 mt-1">Verified</span>
                : <span className="inline-block rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 mt-1">Code required</span>}
            </button>
          </div>
        )}

        {/* Subscription sub-picker */}
        {(trialType === "starter" || trialType === "professional") && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setTrialType("starter")}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                trialType === "starter" ? "border-hilt-blue bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}>
              <p className="text-xs font-semibold text-ink">Starter</p>
              <p className="text-[11px] text-slate">Standard AI · $79/doctor and nurse/mo</p>
            </button>
            <button type="button" onClick={() => { if (codeVerified) { setTrialType("professional"); } else { setShowCodeEntry("professional"); } }}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                trialType === "professional" && codeVerified ? "border-hilt-blue bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}>
              <p className="text-xs font-semibold text-ink">Professional</p>
              <p className="text-[11px] text-slate">Advanced AI · $149/doctor and nurse/mo</p>
              {codeVerified
                ? <span className="inline-block rounded-full bg-green-50 px-1.5 py-0.5 text-[9px] font-medium text-green-700 mt-1">Verified</span>
                : <span className="inline-block rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 mt-1">Code required</span>}
            </button>
          </div>
        )}
      </div>

      {/* Code verification modal */}
      {showCodeEntry && !codeVerified && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl mx-4">
            <h3 className="text-lg font-semibold text-ink mb-1">Enter Premium Code</h3>
            <p className="text-sm text-slate mb-4">
              {showCodeEntry === "premium"
                ? "A valid code is required for the $200 credit trial."
                : "A valid code is required for the Professional plan trial."}
            </p>

            <input type="text" value={approvalCode} onChange={(e) => handleCodeChange(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-center font-mono tracking-wider focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
              placeholder="Enter code" />

            {codeError && <p className="text-xs text-red-500 mt-2 text-center">{codeError}</p>}

            <button type="button" onClick={handleVerifyCode}
              disabled={!approvalCode.trim() || codeChecking}
              className="mt-4 w-full rounded-lg bg-hilt-blue py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-colors hover:bg-hilt-blue-dark">
              {codeChecking ? "Verifying..." : "Verify Code"}
            </button>

            <div className="mt-3 flex items-center justify-between">
              <ContactLink className="text-xs text-hilt-blue hover:underline font-medium">Apply for a premium code</ContactLink>
              <button type="button" onClick={() => setShowCodeEntry(null)} className="text-xs text-slate hover:text-ink">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <button type="submit" disabled={loading}
        className="w-full rounded-lg bg-hilt-blue py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hilt-blue-dark disabled:opacity-50">
        {loading ? "Creating account..." : "Create Account"}
      </button>

      <p className="text-center text-sm text-slate">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-hilt-blue hover:underline">Log in</Link>
      </p>
    </form>
  );
}
