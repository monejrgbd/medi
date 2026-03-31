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
    if (trialType === "professional" && !approvalCode.trim()) {
      setError("Approval code is required for the Professional trial");
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
        p_approval_code: (trialType === "payg" || trialType === "professional") ? (approvalCode || null) : null,
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

      {/* Trial type selector */}
      <div>
        <label className="mb-3 block text-sm font-medium text-ink">Choose your trial</label>

        {/* PAyG */}
        <button type="button" onClick={() => setTrialType("payg")}
          className={`w-full rounded-xl border p-4 text-left transition-colors mb-3 ${
            trialType === "payg" ? "border-hilt-blue bg-blue-50 ring-1 ring-hilt-blue" : "border-gray-200 hover:border-gray-300"
          }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">Pay As You Go</p>
              <p className="text-xs text-slate mt-1">No credit card required</p>
              <div className="flex gap-3 mt-2">
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">$20 free</span>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">Up to $200 with code</span>
              </div>
            </div>
            <div className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${trialType === "payg" ? "border-hilt-blue bg-hilt-blue" : "border-gray-300"}`}>
              {trialType === "payg" && <div className="mx-auto mt-[3px] h-1.5 w-1.5 rounded-full bg-white" />}
            </div>
          </div>
        </button>

        {/* Subscription plans header */}
        <p className="text-xs font-medium text-ash uppercase tracking-wider mb-2 mt-4">Subscription Plans</p>

        <div className="grid grid-cols-2 gap-2 items-stretch">
          {/* Starter */}
          <button type="button" onClick={() => setTrialType("starter")}
            className={`flex flex-col rounded-xl border p-4 text-left transition-colors ${
              trialType === "starter" ? "border-hilt-blue bg-blue-50 ring-1 ring-hilt-blue" : "border-gray-200 hover:border-gray-300"
            }`}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-ink">Starter</p>
              <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${trialType === "starter" ? "border-hilt-blue bg-hilt-blue" : "border-gray-300"}`}>
                {trialType === "starter" && <div className="mx-auto mt-[3px] h-1.5 w-1.5 rounded-full bg-white" />}
              </div>
            </div>
            <p className="text-xs text-slate mt-1">Standard AI</p>
            <p className="text-xs text-slate">50 screenings</p>
            <p className="text-xs font-medium text-ink mt-2">14 days free</p>
            <p className="text-[11px] text-ash">then $79/doctor and nurse/mo</p>
          </button>

          {/* Professional */}
          <button type="button" onClick={() => setTrialType("professional")}
            className={`flex flex-col rounded-xl border p-4 text-left transition-colors ${
              trialType === "professional" ? "border-hilt-blue bg-blue-50 ring-1 ring-hilt-blue" : "border-gray-200 hover:border-gray-300"
            }`}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-ink">Professional</p>
              <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${trialType === "professional" ? "border-hilt-blue bg-hilt-blue" : "border-gray-300"}`}>
                {trialType === "professional" && <div className="mx-auto mt-[3px] h-1.5 w-1.5 rounded-full bg-white" />}
              </div>
            </div>
            <p className="text-xs text-slate mt-1">Advanced AI</p>
            <p className="text-xs text-slate">50 screenings</p>
            <p className="text-xs font-medium text-ink mt-2">14 days free</p>
            <p className="text-[11px] text-ash">then $149/doctor and nurse/mo</p>
            <span className="mt-2 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">Code required</span>
          </button>
        </div>
      </div>

      {/* Approval code — show for PAyG (optional) and Professional (required) */}
      {(trialType === "payg" || trialType === "professional") && (
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Approval Code{trialType === "payg" ? " " : ""}
            {trialType === "payg" && <span className="font-normal text-ash">(optional)</span>}
          </label>
          <input type="text" value={approvalCode} onChange={(e) => setApprovalCode(e.target.value)}
            required={trialType === "professional"}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
            placeholder={trialType === "professional" ? "Required for Professional trial" : "Enter code for premium trial"} />
          <p className="mt-1 text-xs text-ash">
            {trialType === "professional"
              ? <>A valid approval code is required for the Professional trial. <ContactLink className="text-hilt-blue hover:underline font-medium">Apply for a code</ContactLink></>
              : <>Have an approval code? Enter it for $200 in credits and a 30 day trial. <ContactLink className="text-hilt-blue hover:underline font-medium">Apply for a code</ContactLink></>}
          </p>
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
