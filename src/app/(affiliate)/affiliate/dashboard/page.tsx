import { createClient } from "@/lib/supabase/server";
import StatsCards from "@/components/affiliate/StatsCards";
import RecentReferrals from "@/components/affiliate/RecentReferrals";
import RecentCommissions from "@/components/affiliate/RecentCommissions";
import { PARTNER_TAX_FORM_BANNER_CENTS, PARTNER_TAX_FORM_THRESHOLD_CENTS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function PartnerDashboardPage() {
  const supabase = await createClient();
  const { data: result } = await supabase.rpc("get_partner_dashboard");
  if (!result || !result.success) {
    return <div className="text-sm text-slate">Failed to load dashboard.</div>;
  }

  const profile = result.profile;
  const totals = result.totals;
  const showTaxBanner =
    profile.country === "US" &&
    profile.tax_form_status !== "verified" &&
    totals.total_earned_cents >= PARTNER_TAX_FORM_BANNER_CENTS;
  const taxBlocked =
    profile.country === "US" &&
    profile.tax_form_status !== "verified" &&
    totals.total_earned_cents >= PARTNER_TAX_FORM_THRESHOLD_CENTS;

  return (
    <div className="space-y-6">
      {showTaxBanner && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {taxBlocked
            ? "You have crossed $600 in lifetime earnings. Submit a W-9 in your profile before your next payout can clear."
            : "You are approaching $600 lifetime earnings. We will need a W-9 before payouts can continue once you cross that threshold."}
        </div>
      )}
      <StatsCards totals={totals} activeCode={result.active_affiliate_code} />
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentReferrals rows={result.recent_referrals} />
        <RecentCommissions rows={result.recent_commissions} />
      </div>
    </div>
  );
}
