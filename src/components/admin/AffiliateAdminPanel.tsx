"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function fmtCents(c: number) {
  return `${c < 0 ? "-" : ""}$${Math.abs(c / 100).toFixed(2)}`;
}

type Partner = {
  id: string; display_name: string; email: string; country: string; status: string;
  tax_form_status: string; total_earned_cents: number; total_paid_out_cents: number;
  pending_payable_cents: number; held_balance_cents: number; referrals_count: number;
};

type Payout = {
  partner_id: string; display_name: string; email: string; country: string;
  payout_method: string; payout_email: string;
  pending_payable_cents: number; commission_count: number; total_earned_cents: number;
  tax_form_status: string;
};

export default function AffiliateAdminPanel({
  partners,
  payouts,
}: {
  partners: Partner[];
  payouts: Payout[];
}) {
  const [tab, setTab] = useState<"payouts" | "partners">("payouts");

  return (
    <div>
      <div className="mb-4 flex gap-2 border-b border-gray-100">
        {(["payouts", "partners"] as const).map((t) => (
          <button key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t ? "border-hilt-blue text-ink" : "border-transparent text-slate hover:text-ink"
            }`}>
            {t === "payouts" ? `Pending payouts (${payouts.length})` : `All partners (${partners.length})`}
          </button>
        ))}
      </div>

      {tab === "payouts" ? <PayoutsTab payouts={payouts} /> : <PartnersTab partners={partners} />}
    </div>
  );
}

function PayoutsTab({ payouts }: { payouts: Payout[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function pay(partnerId: string, amount: number) {
    const reference = prompt(`PayPal transaction reference for $${(amount / 100).toFixed(2)}?`);
    if (!reference) return;
    setBusy(partnerId);
    setMsg(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("admin_create_payout", {
      p_partner_id: partnerId,
      p_reference: reference,
      p_notes: null,
    });
    setBusy(null);
    if (error || (data && !data.success)) {
      setMsg(error?.message || data?.error || "Payout failed");
      return;
    }
    setMsg(`Marked $${(data.amount_cents / 100).toFixed(2)} paid to partner.`);
    setTimeout(() => window.location.reload(), 1500);
  }

  if (payouts.length === 0) {
    return <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-slate">No payouts due. Partners need ≥ $50 net eligible balance.</div>;
  }

  return (
    <div className="space-y-3">
      {msg && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{msg}</div>}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wider text-slate">
            <tr>
              <th className="px-5 py-3">Partner</th>
              <th className="px-5 py-3">PayPal</th>
              <th className="px-5 py-3">Country</th>
              <th className="px-5 py-3">Tax</th>
              <th className="px-5 py-3 text-right">Pending</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payouts.map((p) => (
              <tr key={p.partner_id}>
                <td className="px-5 py-3">
                  <p className="font-medium text-ink">{p.display_name}</p>
                  <p className="text-xs text-slate">{p.email}</p>
                </td>
                <td className="px-5 py-3 text-slate">{p.payout_email}</td>
                <td className="px-5 py-3 text-slate">{p.country}</td>
                <td className="px-5 py-3 text-xs capitalize">{p.tax_form_status.replace("_", " ")}</td>
                <td className="px-5 py-3 text-right font-semibold">{fmtCents(p.pending_payable_cents)}</td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => pay(p.partner_id, p.pending_payable_cents)}
                    disabled={busy === p.partner_id}
                    className="rounded-lg bg-hilt-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-hilt-blue-dark disabled:opacity-50"
                  >
                    {busy === p.partner_id ? "…" : "Mark paid"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PartnersTab({ partners }: { partners: Partner[] }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function setStatus(partnerId: string, status: "active" | "suspended" | "banned") {
    if (status === "banned" && !confirm("Banning forfeits all unpaid commissions. Continue?")) return;
    setBusy(partnerId);
    const supabase = createClient();
    await supabase.rpc("admin_adjust_partner_status", { p_partner_id: partnerId, p_status: status, p_reason: null });
    setBusy(null);
    window.location.reload();
  }

  async function verifyTax(partnerId: string) {
    const url = prompt("Storage path or note for the W-9 / W-8BEN reference:");
    if (!url) return;
    setBusy(partnerId);
    const supabase = createClient();
    await supabase.rpc("admin_attach_tax_form", { p_partner_id: partnerId, p_form_url: url });
    setBusy(null);
    window.location.reload();
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wider text-slate">
          <tr>
            <th className="px-5 py-3">Partner</th>
            <th className="px-5 py-3">Country</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3">Tax</th>
            <th className="px-5 py-3 text-right">Earned</th>
            <th className="px-5 py-3 text-right">Pending</th>
            <th className="px-5 py-3 text-right">Refs</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {partners.map((p) => (
            <tr key={p.id}>
              <td className="px-5 py-3">
                <p className="font-medium text-ink">{p.display_name}</p>
                <p className="text-xs text-slate">{p.email}</p>
              </td>
              <td className="px-5 py-3 text-slate">{p.country}</td>
              <td className="px-5 py-3 capitalize">{p.status}</td>
              <td className="px-5 py-3 text-xs capitalize">{p.tax_form_status.replace("_", " ")}</td>
              <td className="px-5 py-3 text-right">{fmtCents(p.total_earned_cents)}</td>
              <td className="px-5 py-3 text-right">{fmtCents(p.pending_payable_cents)}</td>
              <td className="px-5 py-3 text-right">{p.referrals_count}</td>
              <td className="px-5 py-3 text-right">
                <div className="flex justify-end gap-1.5">
                  {p.status !== "active" && (
                    <button onClick={() => setStatus(p.id, "active")} disabled={busy === p.id}
                      className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-800 hover:bg-emerald-100 disabled:opacity-50">activate</button>
                  )}
                  {p.status === "active" && (
                    <button onClick={() => setStatus(p.id, "suspended")} disabled={busy === p.id}
                      className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800 hover:bg-amber-100 disabled:opacity-50">suspend</button>
                  )}
                  {p.status !== "banned" && (
                    <button onClick={() => setStatus(p.id, "banned")} disabled={busy === p.id}
                      className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-800 hover:bg-rose-100 disabled:opacity-50">ban</button>
                  )}
                  {p.tax_form_status !== "verified" && p.country === "US" && (
                    <button onClick={() => verifyTax(p.id)} disabled={busy === p.id}
                      className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-800 hover:bg-blue-100 disabled:opacity-50">verify W-9</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
