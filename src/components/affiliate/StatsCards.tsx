function fmtCents(c: number) {
  return `$${(c / 100).toFixed(2)}`;
}

export default function StatsCards({
  totals,
  activeCode,
}: {
  totals: {
    total_earned_cents: number;
    total_paid_out_cents: number;
    total_clawed_back_cents: number;
    pending_balance_cents: number;
    held_balance_cents: number;
    referrals_count: number;
  };
  activeCode: string | null;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card label="Pending payable" value={fmtCents(totals.pending_balance_cents)} hint="Eligible for next payout (≥ $50)" />
      <Card label="Held" value={fmtCents(totals.held_balance_cents)} hint="In hold period" />
      <Card label="Total earned" value={fmtCents(totals.total_earned_cents)} hint="Lifetime gross commissions" />
      <Card label="Paid out" value={fmtCents(totals.total_paid_out_cents)} hint="Sent to your PayPal" />
      <Card
        label="Referrals"
        value={String(totals.referrals_count)}
        hint="Clinics attributed to you"
      />
      <Card
        label="Active code"
        value={activeCode || "—"}
        hint={activeCode ? "Share this with prospects" : "Generate one in Codes"}
      />
    </div>
  );
}

function Card({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-slate">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ash">{hint}</p>}
    </div>
  );
}
