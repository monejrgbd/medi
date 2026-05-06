import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PartnerShell from "@/components/affiliate/PartnerShell";

export default async function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/affiliate/dashboard");

  const { data: partner } = await supabase
    .from("partners")
    .select("id, display_name, status, country, tax_form_status")
    .eq("auth_uid", user.id)
    .maybeSingle();

  if (!partner) redirect("/affiliate/connect");

  return <PartnerShell partner={partner}>{children}</PartnerShell>;
}
