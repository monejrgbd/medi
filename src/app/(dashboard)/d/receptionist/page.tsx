import { requireAuth, getStaffUser, isOwner, getMyRoles } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ReceptionistDashboard from "./ReceptionistDashboard";
import { redirect } from "next/navigation";

export default async function ReceptionistPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const staffUser = await getStaffUser(user.id);
  const ownerCheck = await isOwner(user.id);

  // Get org_id - staff user has it, owner needs lookup
  let orgId: string | null = staffUser?.org_id ?? null;
  if (!orgId && ownerCheck) {
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .single();
    orgId = org?.id ?? null;
  }

  if (!orgId) redirect("/d/select-role");

  // Check if user is currently checked in as receptionist
  let checkedInLocationId: string | null = null;

  if (staffUser) {
    const { data: checkin } = await supabase
      .from("staff_checkins")
      .select("location_id")
      .eq("staff_user_id", staffUser.id)
      .eq("role", "receptionist")
      .is("checked_out_at", null)
      .order("checked_in_at", { ascending: false })
      .limit(1)
      .single();

    checkedInLocationId = checkin?.location_id ?? null;
  }

  // Get location name if checked in
  let locationName = "Reception";
  if (checkedInLocationId) {
    const { data: locationRow } = await supabase
      .from("locations")
      .select("name")
      .eq("id", checkedInLocationId)
      .single();
    locationName = locationRow?.name ?? "Reception";
  }

  // If not checked in, get available locations
  if (!checkedInLocationId) {
    const roles = await getMyRoles();
    const receptionistLocations = ownerCheck
      ? await supabase.rpc("get_locations").then((r) =>
          (r.data ?? []).map((l: { id: string; name: string }) => ({
            id: l.id,
            name: l.name,
          }))
        )
      : roles
          .filter((r: { role: string }) => r.role === "receptionist")
          .map((r: { location_id: string; location_name: string }) => ({
            id: r.location_id,
            name: r.location_name,
          }));

    return (
      <ReceptionistDashboard
        mode="select_location"
        locations={receptionistLocations}
        staffUserId={staffUser?.id ?? null}
        orgId={orgId}
        locationId={null}
        initialPending={[]}
        initialActive={[]}
        initialCompleted={[]}
        initialCounts={null}
      />
    );
  }

  // Checked in — load initial data
  const [pendingRes, countsRes, activeRes, completedRes] = await Promise.all([
    supabase.rpc("get_pending_approvals", {
      p_location_id: checkedInLocationId,
    }),
    supabase.rpc("get_receptionist_counts", {
      p_location_id: checkedInLocationId,
    }),
    supabase
      .from("visits")
      .select(
        "id, status, priority, gave_tablet, handled, has_previous_visits, created_at, claimed_by, claimed_at, patient_id, patients(first_name, last_name, birthday), claimed_doctor:staff_users!visits_claimed_by_fkey(full_name)"
      )
      .eq("location_id", checkedInLocationId)
      .not("status", "in", '("completed","left")')
      .eq("handled", false)
      .order("created_at", { ascending: true }),
    supabase
      .from("visits")
      .select(
        "id, status, gave_tablet, has_previous_visits, created_at, completed_at, patient_id, patients(first_name, last_name, birthday)"
      )
      .eq("location_id", checkedInLocationId)
      .eq("status", "completed")
      .gte("completed_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      .order("completed_at", { ascending: false }),
  ]);

  return (
    <ReceptionistDashboard
      mode="dashboard"
      locations={[]}
      staffUserId={staffUser?.id ?? null}
      orgId={orgId}
      locationId={checkedInLocationId}
      locationName={locationName}
      initialPending={pendingRes.data?.pending ?? []}
      initialActive={(activeRes.data ?? []) as any}
      initialCompleted={(completedRes.data ?? []) as any}
      initialCounts={countsRes.data ?? null}
    />
  );
}
