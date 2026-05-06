import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function fmtCents(c: number) {
  return `${c < 0 ? "-" : ""}$${Math.abs(c / 100).toFixed(2)}`;
}

export default async function PartnerEarningsPage() {
  const supabase = await createClient();
  const [commissions, payouts] = await Promise.all([
    supabase.rpc("get_partner_commissions", { p_status: null, p_limit: 200, p_offset: 0 }),
    supabase.rpc("get_partner_payouts", { p_limit: 50, p_offset: 0 }),
  ]);

  const cRows = (commissions.data?.rows ?? []) as Array<{
    id: string; payment_amount_cents: number; commission_amount_cents: number;
    payment_date: string; eligible_for_payout_at: string; status: string; payout_id: string | null;
  }>;
  const pRows = (payouts.data?.rows ?? []) as Array<{
    id: string; amount_cents: number; method: string; reference: string | null;
    status: string; created_at: string;
  }>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Earnings</h1>
        <p className="mt-1 text-sm text-slate">Every commission, every payout. Negative entries are clawback offsets.</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate">Commissions</h2>
        {cRows.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-slate">
            No commissions recorded yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wider text-slate">
                <tr>
                  <th className="px-5 py-3">Payment date</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Commission</th>
                  <th className="px-5 py-3">Eligible</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cRows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3 text-slate">{new Date(r.payment_date).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-slate">{fmtCents(r.payment_amount_cents)}</td>
                    <td className="px-5 py-3 font-semibold text-ink">{fmtCents(r.commission_amount_cents)}</td>
                    <td className="px-5 py-3 text-slate">{new Date(r.eligible_for_payout_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <span className="capitalize">{r.status === "clawed_back" ? "clawback" : r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate">Payouts</h2>
        {pRows.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-slate">
            No payouts yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wider text-slate">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pRows.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 text-slate">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3 font-semibold text-ink">{fmtCents(p.amount_cents)}</td>
                    <td className="px-5 py-3 text-slate">{p.method}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate">{p.reference || "—"}</td>
                    <td className="px-5 py-3 capitalize">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
