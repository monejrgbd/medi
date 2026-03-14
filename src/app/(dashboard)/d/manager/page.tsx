import { requireAuth, getStaffUser, isOwner, getMyRoles, getMyOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ManagerDashboard from "./ManagerDashboard";

export default async function ManagerPage() {
  const user = await requireAuth();
  const ownerCheck = await isOwner(user.id);
  const staffUser = await getStaffUser(user.id);
  const roles = await getMyRoles();
  const org = await getMyOrg();

  const orgId = staffUser?.org_id || (ownerCheck ? (org as { id?: string })?.id : null);
  if (!orgId) redirect("/d/select-role");

  let locations: { id: string; name: string }[];

  if (ownerCheck) {
    // Owner sees all org locations
    const supabase = await createClient();
    const { data } = await supabase
      .from("locations")
      .select("id, name")
      .eq("org_id", orgId)
      .order("name");
    locations = data ?? [];
  } else {
    // Manager sees only assigned locations
    const managerRoles = roles.filter((r: { role: string }) => r.role === "manager");
    const locationMap = new Map<string, string>();
    for (const r of managerRoles) {
      locationMap.set(r.location_id, r.location_name);
    }
    locations = Array.from(locationMap.entries()).map(([id, name]) => ({ id, name }));
  }

  if (locations.length === 0) redirect("/d/owner");

  const followupAddonEnabled = !!(org as { followup_sms_addon?: boolean })?.followup_sms_addon;

  return (
    <ManagerDashboard
      locations={locations}
      orgId={orgId}
      isOwner={ownerCheck}
      followupAddonEnabled={followupAddonEnabled}
    />
  );
}
