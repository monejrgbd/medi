import { createClient } from "@/lib/supabase/server";
import EmbeddableWidgetConfig from "@/components/dashboard/EmbeddableWidgetConfig";

export const metadata = {
  title: "Developer — Hilt Health",
};

export default async function DeveloperPage() {
  const supabase = await createClient();
  const { data: overview } = await supabase.rpc("get_organization_overview");

  const org = overview?.org;

  const { data: locationData } = await supabase
    .from("locations")
    .select("id, name")
    .eq("org_id", org?.id || "")
    .order("name");

  return (
    <div className="space-y-8">
      {locationData && locationData.length > 0 && (
        <EmbeddableWidgetConfig
          locations={locationData}
          subscriptionPlan={org?.subscription_plan || ""}
        />
      )}
    </div>
  );
}
