function fmtCents(c: number) {
  return `${c < 0 ? "-" : ""}$${Math.abs(c / 100).toFixed(2)}`;
}

type Row = {
  id: string;
  payment_amount_cents: number;
  commission_amount_cents: number;
  payment_date: string;
  eligible_for_payout_at: string;
  status: string;
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-blue-50 text-blue-700",
  paid: "bg-emerald-50 text-emerald-700",
  clawed_back: "bg-rose-50 text-rose-700",
};

export default function RecentCommissions({ rows }: { rows: Row[] }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white">
      <div className="border-b border-gray-100 px-5 py-3 text-sm font-semibold">Recent commissions</div>
      {rows.length === 0 ? (
        <div className="p-5 text-sm text-slate">No commissions recorded yet. Once a referred clinic makes a payment, you will see it here.</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <p className="font-semibold text-ink">{fmtCents(r.commission_amount_cents)}</p>
                <p className="text-xs text-slate">
                  on {fmtCents(r.payment_amount_cents)} · {new Date(r.payment_date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status] || "bg-gray-50 text-slate"}`}>
                  {r.status === "clawed_back" ? "clawback" : r.status}
                </span>
                {r.status === "pending" && (
                  <p className="mt-1 text-xs text-ash">eligible {new Date(r.eligible_for_payout_at).toLocaleDateString()}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
