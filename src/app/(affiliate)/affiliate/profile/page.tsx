import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/affiliate/ProfileForm";

export const dynamic = "force-dynamic";

export default async function PartnerProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: partner } = await supabase
    .from("partners")
    .select("display_name, email, phone, country, payout_method, payout_email, status, tax_form_status, total_earned_cents, commission_rate")
    .eq("auth_uid", user!.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Profile</h1>
        <p className="mt-1 text-sm text-slate">How you appear to referred clinics, and where we send your money.</p>
      </div>
      <ProfileForm partner={partner!} />
    </div>
  );
}
