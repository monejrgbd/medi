import { createClient } from "@/lib/supabase/server";
import { requireAuth, isOwner, getMyRoles, getMyOrg, getStaffUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import LocationDetail from "@/components/dashboard/LocationDetail";

export const metadata = {
  title: "Location Settings — Hilt Health",
};

export default async function ManagerLocationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();
  const ownerCheck = await isOwner(user.id);
  const roles = await getMyRoles();

  // Verify caller is owner or manager at this specific location
  if (!ownerCheck) {
    const isManagerAtLocation = roles.some(
      (r: { role: string; location_id: string }) =>
        r.role === "manager" && r.location_id === id
    );
    if (!isManagerAtLocation) {
      redirect("/d/select-role");
    }
  }

  const supabase = await createClient();
  const staffUser = await getStaffUser(user.id);
  const org = await getMyOrg();
  const orgId = staffUser?.org_id || (ownerCheck ? (org as { id?: string })?.id : null);

  if (!orgId) redirect("/d/manager");

  const [{ data: detail }, { data: staffList }] = await Promise.all([
    supabase.rpc("get_location_detail", { p_location_id: id }),
    supabase.rpc("get_staff_list", {
      p_org_id: orgId,
      p_location_id: id,
    }),
  ]);

  if (!detail?.success || !detail?.location) {
    redirect("/d/manager");
  }

  // Manager only sees locations they manage; owner sees all
  let locationOptions: { id: string; name: string }[];
  if (ownerCheck) {
    const { data: locs } = await supabase
      .from("locations")
      .select("id, name")
      .eq("org_id", orgId)
      .order("name");
    locationOptions = locs ?? [];
  } else {
    const managerRoles = roles.filter(
      (r: { role: string }) => r.role === "manager"
    );
    const locMap = new Map<string, string>();
    for (const r of managerRoles) {
      locMap.set(r.location_id, r.location_name);
    }
    locationOptions = Array.from(locMap.entries()).map(([lid, name]) => ({
      id: lid,
      name,
    }));
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <LocationDetail
        location={detail.location}
        staff={staffList || []}
        locations={locationOptions}
      />
    </div>
  );
}
