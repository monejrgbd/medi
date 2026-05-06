function fmtCents(c: number) {
  return `$${(c / 100).toFixed(2)}`;
}

type Row = {
  id: string;
  attributed_at: string;
  first_payment_at: string | null;
  code_used: string;
  code_type: string;
  org_name: string;
  plan: string;
  commission_to_date_cents: number;
};

export default function RecentReferrals({ rows }: { rows: Row[] }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white">
      <div className="border-b border-gray-100 px-5 py-3 text-sm font-semibold">Recent referrals</div>
      {rows.length === 0 ? (
        <div className="p-5 text-sm text-slate">No referrals yet. Share your code to get started.</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <p className="font-medium text-ink">{r.org_name}</p>
                <p className="text-xs text-slate">
                  {new Date(r.attributed_at).toLocaleDateString()} · {r.plan}
                  {r.code_type === "premium_trial" ? " · premium trial" : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-ink">{fmtCents(r.commission_to_date_cents)}</p>
                <p className="text-xs text-slate">
                  {r.first_payment_at ? "earned" : "trialing"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
