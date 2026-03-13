import { createClient } from "@/lib/supabase/server";
import OrgSettingsForm from "@/components/dashboard/OrgSettingsForm";
import EmbeddableWidgetConfig from "@/components/dashboard/EmbeddableWidgetConfig";

export const metadata = {
  title: "Settings — Hilt Health",
};

export default async function OwnerSettingsPage() {
  const supabase = await createClient();
  const { data: overview } = await supabase.rpc("get_organization_overview");

  const { data: locationData } = await supabase
    .from("locations")
    .select("id, name")
    .eq("org_id", overview?.org?.id || "")
    .order("name");

  return (
    <div className="space-y-8">
      <OrgSettingsForm
        overview={overview || { org: {} }}
      />
      {locationData && locationData.length > 0 && (
        <EmbeddableWidgetConfig locations={locationData} />
      )}
    </div>
  );
}
