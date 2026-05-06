"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PARTNER_TOS_VERSION } from "@/lib/constants";

const COUNTRIES = [
  "US","CA","GB","AU","DE","FR","NL","ES","IT","SE","NZ","MX","BR","IN","JP","OTHER",
];

export default function PartnerConnectForm() {
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("US");
  const [payoutEmail, setPayoutEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tosAccepted, setTosAccepted] = useState(false);
  const [antiSpam, setAntiSpam] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!tosAccepted || !antiSpam) {
      setError("You must accept both checkboxes to continue");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login?next=/affiliate/connect";
      return;
    }
    const { data: result, error: rpcError } = await supabase.rpc("register_partner_for_existing_user", {
      p_display_name: displayName,
      p_country: country,
      p_payout_email: payoutEmail || user.email || "",
      p_phone: phone || null,
      p_tos_version: PARTNER_TOS_VERSION,
    });
    if (rpcError || (result && !result.success)) {
      setError(rpcError?.message || result?.error || "Failed to register");
      setLoading(false);
      return;
    }
    await supabase.auth.refreshSession();
    window.location.href = "/affiliate/dashboard";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-2xl font-bold text-ink">Connect your account</h1>
      <p className="text-sm text-slate">
        You already have a Hilt account. Add the affiliate role and start earning.
      </p>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Your name or business</label>
        <input type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Country</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">PayPal email</label>
          <input type="email" value={payoutEmail} onChange={(e) => setPayoutEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Phone (optional)</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
      </div>

      <label className="flex items-start gap-2 text-xs text-slate">
        <input type="checkbox" checked={tosAccepted} onChange={(e) => setTosAccepted(e.target.checked)} className="mt-0.5 accent-hilt-blue" />
        <span>I have read and accept the <Link href="/affiliate/terms" target="_blank" className="text-hilt-blue hover:underline">Affiliate Terms</Link>.</span>
      </label>
      <label className="flex items-start gap-2 text-xs text-slate">
        <input type="checkbox" checked={antiSpam} onChange={(e) => setAntiSpam(e.target.checked)} className="mt-0.5 accent-hilt-blue" />
        <span>I will only generate premium trial codes for clinics that have given me permission to contact them about Hilt Health.</span>
      </label>

      <button type="submit" disabled={loading}
        className="w-full rounded-lg bg-hilt-blue py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hilt-blue-dark disabled:opacity-50">
        {loading ? "Connecting..." : "Activate partner account"}
      </button>
    </form>
  );
}
