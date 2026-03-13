import { createClient } from "@/lib/supabase/server";
import CheckinFlow from "./CheckinFlow";

export default async function CheckinPage({
  params,
  searchParams,
}: {
  params: Promise<{ locationId: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { locationId } = await params;
  const { embed } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase.rpc("check_location_active", {
    p_location_id: locationId,
  });

  return (
    <CheckinFlow
      locationId={locationId}
      locationData={data ?? { active: false }}
      embed={embed === "true"}
    />
  );
}
