"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PARTNER_TAX_FORM_THRESHOLD_CENTS } from "@/lib/constants";

const COUNTRIES = ["US","CA","GB","AU","DE","FR","NL","ES","IT","SE","NZ","MX","BR","IN","JP","OTHER"];

type Partner = {
  display_name: string;
  email: string;
  phone: string | null;
  country: string;
  payout_method: string;
  payout_email: string | null;
  status: string;
  tax_form_status: string;
  total_earned_cents: number;
  commission_rate: number;
};

export default function ProfileForm({ partner }: { partner: Partner }) {
  const [displayName, setDisplayName] = useState(partner.display_name);
  const [country, setCountry] = useState(partner.country);
  const [phone, setPhone] = useState(partner.phone || "");
  const [payoutEmail, setPayoutEmail] = useState(partner.payout_email || "");
  const [payoutMethod, setPayoutMethod] = useState(partner.payout_method);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("update_partner_profile", {
      p_display_name: displayName,
      p_phone: phone || null,
      p_country: country,
      p_payout_method: payoutMethod,
      p_payout_email: payoutEmail || null,
    });
    setSaving(false);
    if (error || (data && !data.success)) {
      setMsg(error?.message || data?.error || "Failed to save");
    } else {
      setMsg("Saved.");
    }
  }

  const taxRequired = partner.country === "US"
    && partner.tax_form_status !== "verified"
    && partner.total_earned_cents >= PARTNER_TAX_FORM_THRESHOLD_CENTS;

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Display name</label>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
          <p className="mt-1 text-xs text-slate">Shown to clinics you target with premium trial codes.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Email</label>
          <input type="email" value={partner.email} disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-slate" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Country</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
        <h2 className="text-sm font-semibold">Payout</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Method</label>
            <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
              <option value="paypal">PayPal</option>
              <option value="manual">Manual (contact us)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">PayPal email</label>
            <input type="email" value={payoutEmail} onChange={(e) => setPayoutEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
          </div>
        </div>
        <p className="text-xs text-slate">Commission rate: {(partner.commission_rate * 100).toFixed(0)}%. Status: {partner.status}.</p>
      </div>

      {partner.country === "US" && (
        <div className={`rounded-2xl border p-6 ${taxRequired ? "border-amber-200 bg-amber-50" : "border-gray-100 bg-white"}`}>
          <h2 className="text-sm font-semibold">W-9</h2>
          <p className="mt-1 text-sm text-slate">
            Status: <span className="font-medium capitalize">{partner.tax_form_status.replace("_", " ")}</span>
          </p>
          {taxRequired && (
            <p className="mt-2 text-sm text-amber-900">
              You have crossed $600 in lifetime earnings. Please email a completed W-9 to <a href="mailto:partners@hilthealth.com" className="underline">partners@hilthealth.com</a> so we can process your next payout.
            </p>
          )}
        </div>
      )}

      {msg && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{msg}</div>}
      <button type="submit" disabled={saving}
        className="rounded-lg bg-hilt-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-hilt-blue-dark disabled:opacity-50">
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
