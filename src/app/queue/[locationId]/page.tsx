import { createClient } from "@/lib/supabase/server";
import QueueDisplay from "./QueueDisplay";

export default async function QueuePage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_queue_display", {
    p_location_id: locationId,
  });

  return (
    <QueueDisplay
      locationId={locationId}
      initialData={data ?? { success: false }}
    />
  );
}
