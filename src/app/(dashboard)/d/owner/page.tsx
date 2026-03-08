import { createClient } from "@/lib/supabase/server";
import OwnerOverview from "@/components/dashboard/OwnerOverview";

export const metadata = {
  title: "Overview — Hilt Health",
};

export default async function OwnerPage() {
  const supabase = await createClient();

  const [{ data: overview }, { data: locations }] = await Promise.all([
    supabase.rpc("get_organization_overview"),
    supabase.rpc("get_locations"),
  ]);

  return (
    <OwnerOverview
      overview={overview || { org: {}, location_count: 0, staff_count: 0, active_staff_count: 0 }}
      locations={locations || []}
    />
  );
}
