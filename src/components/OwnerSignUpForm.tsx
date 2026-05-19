"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { REF_COOKIE_NAME, GCLID_COOKIE_NAME } from "@/lib/constants";
import { setAdsUserData } from "@/lib/conversions";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

export default function OwnerSignUpForm() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const codeParam = (searchParams.get("code") || searchParams.get("ref") || "").toUpperCase();

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState(codeParam);
  const [codeOpen, setCodeOpen] = useState(Boolean(codeParam));
  const [refBanner, setRefBanner] = useState<{ display_name: string; code_type: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // On mount: pull code from query/cookie and look up the partner banner
  useEffect(() => {
    let cancelled = false;
    async function init() {
      let initial = codeParam;
      if (!initial) {
        const fromCookie = readCookie(REF_COOKIE_NAME);
        if (fromCookie) initial = fromCookie.toUpperCase();
      }
      if (initial) {
        setCode(initial);
        setCodeOpen(true);
        const supabase = createClient();
        const { data } = await supabase.rpc("lookup_partner_by_code", { p_code: initial });
        if (!cancelled && data && typeof data === "object" && "display_name" in data) {
          setRefBanner(data as { display_name: string; code_type: string });
        }
      }
    }
    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
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

    const trimmedCode = code.trim() || null;

    // Google Ads click ids: URL param first (ad pointed straight at /signup),
    // else the hh_gclid cookie captured by ClickIdCapture on the marketing
    // landing page. Persisted to the org for the server-side Purchase upload.
    const clickFromCookie = (() => {
      try {
        const raw = readCookie(GCLID_COOKIE_NAME);
        return raw
          ? (JSON.parse(raw) as { gclid?: string; gbraid?: string; wbraid?: string })
          : {};
      } catch {
        return {};
      }
    })();
    const gclid = searchParams.get("gclid") || clickFromCookie.gclid || null;
    const gbraid = searchParams.get("gbraid") || clickFromCookie.gbraid || null;
    const wbraid = searchParams.get("wbraid") || clickFromCookie.wbraid || null;

    const { data: orgResult, error: orgError } = await supabase.rpc(
      "create_organization",
      {
        p_owner_auth_uid: userId,
        p_name: "My Clinic",
        p_approval_code: trimmedCode,
        p_gclid: gclid,
        p_gbraid: gbraid,
        p_wbraid: wbraid,
      }
    );

    if (orgError || (orgResult && !orgResult.success)) {
      setError(orgError?.message || orgResult?.error || "Failed to create organization");
      setLoading(false);
      return;
    }

    // Clear ref + gclid cookies after successful attribution
    clearCookie(REF_COOKIE_NAME);
    clearCookie(GCLID_COOKIE_NAME);

    await supabase.auth.refreshSession();
    setLoading(false);

    setAdsUserData({ email });
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "conversion", {
        send_to: "AW-18032484152/Zz_ACOfbpZccELi-x5ZD",
        value: 1.0,
        currency: "CAD",
        transaction_id: orgResult?.org_id || "",
      });
    }

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

  if (step === "otp") {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-4">
        <button
          type="button"
          onClick={() => setStep("form")}
          className="inline-flex items-center gap-1 text-sm text-slate hover:text-ink transition-colors"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <a
        href="/"
        className="inline-flex items-center gap-1 text-sm text-slate hover:text-ink transition-colors"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back
      </a>
      <h1 className="text-2xl font-bold text-ink">Create your account</h1>
      <p className="text-sm text-slate">
        Start with free credits. No credit card required.
      </p>

      {refBanner && (
        <div className="rounded-lg border border-hilt-blue/20 bg-hilt-blue/5 p-3 text-sm text-ink">
          {refBanner.code_type === "premium_trial"
            ? <>Premium trial code applied. <span className="font-medium">{refBanner.display_name}</span> sent you 200 credits.</>
            : <>Referred by <span className="font-medium">{refBanner.display_name}</span>.</>
          }
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

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
        {!codeOpen ? (
          <button
            type="button"
            onClick={() => setCodeOpen(true)}
            className="text-xs text-slate hover:text-ink hover:underline"
          >
            Have a referral or premium trial code?
          </button>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Code (optional)</label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                const next = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                setCode(next);
                if (refBanner) setRefBanner(null);
              }}
              maxLength={16}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm uppercase tracking-wider focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
              placeholder="ABCD1234"
            />
          </div>
        )}
      </div>

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
