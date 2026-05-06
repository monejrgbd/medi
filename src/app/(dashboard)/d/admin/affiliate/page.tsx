import { createClient } from "@/lib/supabase/server";
import AffiliateAdminPanel from "@/components/admin/AffiliateAdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminAffiliatePage() {
  const supabase = await createClient();
  const [partners, payouts] = await Promise.all([
    supabase.rpc("admin_list_partners", { p_status: null, p_search: null, p_limit: 100, p_offset: 0 }),
    supabase.rpc("admin_get_pending_payouts"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Affiliate program</h1>
        <p className="mt-1 text-sm text-slate">
          Partner roster and payout queue. Pending payouts list shows partners with ≥ $50 net eligible balance and tax requirements satisfied.
        </p>
      </div>
      <AffiliateAdminPanel
        partners={partners.data?.rows || []}
        payouts={payouts.data?.rows || []}
      />
    </div>
  );
}
