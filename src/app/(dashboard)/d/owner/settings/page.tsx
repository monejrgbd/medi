import { createClient } from "@/lib/supabase/server";
import OrgSettingsForm from "@/components/dashboard/OrgSettingsForm";

export const metadata = {
  title: "Settings — Hilt Health",
};

export default async function OwnerSettingsPage() {
  const supabase = await createClient();
  const { data: overview } = await supabase.rpc("get_organization_overview");

  return (
    <div className="space-y-8">
      <OrgSettingsForm
        overview={overview || { org: {} }}
      />
    </div>
  );
}
