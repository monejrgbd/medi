import { createClient } from "@/lib/supabase/server";
import { getMyOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import LocationDetail from "@/components/dashboard/LocationDetail";

export const metadata = {
  title: "Location Detail — Hilt Health",
};

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const org = await getMyOrg();

  if (!org?.id) redirect("/d/owner");

  const [{ data: detail }, { data: staffList }, { data: locations }] =
    await Promise.all([
      supabase.rpc("get_location_detail", { p_location_id: id }),
      supabase.rpc("get_staff_list", {
        p_org_id: org.id,
        p_location_id: id,
      }),
      supabase.rpc("get_locations"),
    ]);

  if (!detail?.success || !detail?.location) {
    redirect("/d/owner/locations");
  }

  const locationOptions = (locations || []).map(
    (l: { id: string; name: string }) => ({
      id: l.id,
      name: l.name,
    })
  );

  return (
    <LocationDetail
      location={detail.location}
      staff={staffList || []}
      locations={locationOptions}
    />
  );
}
