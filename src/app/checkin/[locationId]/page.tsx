import { createClient } from "@/lib/supabase/server";
import CheckinFlow from "./CheckinFlow";

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("check_location_active", {
    p_location_id: locationId,
  });

  return (
    <CheckinFlow
      locationId={locationId}
      locationData={data ?? { active: false }}
    />
  );
}
