"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PARTNER_TOS_VERSION } from "@/lib/constants";

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "SE", name: "Sweden" },
  { code: "NZ", name: "New Zealand" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
  { code: "IN", name: "India" },
  { code: "JP", name: "Japan" },
  { code: "OTHER", name: "Other" },
];

export default function PartnerSignupForm() {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("US");
  const [payoutEmail, setPayoutEmail] = useState("");
  const [tosAccepted, setTosAccepted] = useState(false);
  const [antiSpam, setAntiSpam] = useState(false);
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!tosAccepted || !antiSpam) {
      setError("You must accept both checkboxes to continue");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data?.user?.identities?.length === 0) {
      setError("This email is already registered. If you already have a Hilt account, log in and visit /affiliate/connect to add the partner role.");
      return;
    }
    setUserId(data?.user?.id || "");
    setStep("otp");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: otp, type: "signup" });
    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }
    const { data: result, error: rpcError } = await supabase.rpc("register_partner", {
      p_auth_uid: userId,
      p_display_name: displayName,
      p_email: email,
      p_phone: null,
      p_country: country,
      p_payout_email: payoutEmail || email,
      p_tos_version: PARTNER_TOS_VERSION,
    });
    if (rpcError || (result && !result.success)) {
      setError(rpcError?.message || result?.error || "Failed to register partner");
      setLoading(false);
      return;
    }
    await supabase.auth.refreshSession();
    window.location.href = "/affiliate/dashboard";
  }

  if (step === "otp") {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        <h1 className="text-2xl font-bold text-ink">Verify your email</h1>
        <p className="text-sm text-slate">We sent a 6-digit code to <span className="font-medium text-ink">{email}</span></p>
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <input type="text" required maxLength={6} inputMode="numeric" autoFocus
          value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-center text-2xl font-bold tracking-[0.3em] focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
          placeholder="000000" />
        <button type="submit" disabled={loading || otp.length !== 6}
          className="w-full rounded-lg bg-hilt-blue py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hilt-blue-dark disabled:opacity-50">
          {loading ? "Verifying..." : "Verify and finish"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-2xl font-bold text-ink">Become a partner</h1>
      <p className="text-sm text-slate">Earn 30% lifetime on every clinic you refer.</p>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Your name or business</label>
        <input type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
          placeholder="Sarah Smith / Acme Marketing" />
        <p className="mt-1 text-xs text-slate">Shown to clinics that receive a code from you.</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Password</label>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
          placeholder="At least 8 characters" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Country</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue">
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">PayPal email</label>
          <input type="email" value={payoutEmail} onChange={(e) => setPayoutEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
            placeholder="(defaults to your email)" />
        </div>
      </div>

      <label className="flex items-start gap-2 text-xs text-slate">
        <input type="checkbox" checked={tosAccepted} onChange={(e) => setTosAccepted(e.target.checked)}
          className="mt-0.5 accent-hilt-blue" />
        <span>I have read and accept the <Link href="/affiliate/terms" target="_blank" className="text-hilt-blue hover:underline">Affiliate Terms</Link>.</span>
      </label>

      <label className="flex items-start gap-2 text-xs text-slate">
        <input type="checkbox" checked={antiSpam} onChange={(e) => setAntiSpam(e.target.checked)}
          className="mt-0.5 accent-hilt-blue" />
        <span>I will only generate premium trial codes for clinics that have given me permission to contact them about Hilt Health.</span>
      </label>

      <button type="submit" disabled={loading}
        className="w-full rounded-lg bg-hilt-blue py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hilt-blue-dark disabled:opacity-50">
        {loading ? "Creating..." : "Create partner account"}
      </button>

      <p className="text-center text-sm text-slate">
        Already have a Hilt account?{" "}
        <Link href="/affiliate/connect" className="font-medium text-hilt-blue hover:underline">Connect it</Link>
      </p>
    </form>
  );
}
