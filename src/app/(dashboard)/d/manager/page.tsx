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

  let locations: { id: string; name: string; followup_sms_enabled?: boolean }[];

  if (ownerCheck) {
    // Owner sees all org locations
    const supabase = await createClient();
    const { data } = await supabase
      .from("locations")
      .select("id, name, followup_sms_enabled")
      .eq("org_id", orgId)
      .order("name");
    locations = data ?? [];
  } else {
    // Manager sees only assigned locations — need to fetch addon flags
    const managerRoles = roles.filter((r: { role: string }) => r.role === "manager");
    const locationIds = managerRoles.map((r: { location_id: string }) => r.location_id);
    const supabase = await createClient();
    const { data } = await supabase
      .from("locations")
      .select("id, name, followup_sms_enabled")
      .in("id", locationIds)
      .order("name");
    locations = data ?? [];
  }

  if (locations.length === 0) redirect("/d/owner");

  const followupAddonEnabled = locations.some((l) => l.followup_sms_enabled);

  return (
    <ManagerDashboard
      locations={locations}
      orgId={orgId}
      isOwner={ownerCheck}
      followupAddonEnabled={followupAddonEnabled}
    />
  );
}
