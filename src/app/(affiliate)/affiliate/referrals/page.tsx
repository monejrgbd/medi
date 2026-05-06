import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function fmtCents(c: number) {
  return `$${(c / 100).toFixed(2)}`;
}

export default async function PartnerReferralsPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_partner_referrals", { p_limit: 200, p_offset: 0 });
  if (!data?.success) return <div className="text-sm text-slate">Failed to load referrals.</div>;
  const rows = data.rows as Array<{
    id: string; org_name: string; plan: string; attributed_at: string;
    first_payment_at: string | null; commission_to_date_cents: number;
    code_used: string; code_type: string;
  }>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-ink">Referrals</h1>
        <p className="mt-1 text-sm text-slate">{data.total} clinic{data.total === 1 ? "" : "s"} attributed to you.</p>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-slate">
          No referrals yet. Share your code to get started.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wider text-slate">
              <tr>
                <th className="px-5 py-3">Clinic</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Attributed</th>
                <th className="px-5 py-3">First payment</th>
                <th className="px-5 py-3 text-right">Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3 font-medium text-ink">{r.org_name}</td>
                  <td className="px-5 py-3 text-slate">{r.plan}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate">
                    {r.code_used}
                    {r.code_type === "premium_trial" && (
                      <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber-800">trial</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate">{new Date(r.attributed_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-slate">{r.first_payment_at ? new Date(r.first_payment_at).toLocaleDateString() : "—"}</td>
                  <td className="px-5 py-3 text-right font-semibold text-ink">{fmtCents(r.commission_to_date_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
