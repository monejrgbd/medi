import { requireAuth, getStaffUser, isOwner, getMyRoles } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import DoctorDashboard from "./DoctorDashboard";
import { redirect } from "next/navigation";

export default async function DoctorPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const staffUser = await getStaffUser(user.id);
  const ownerCheck = await isOwner(user.id);

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

  // Role guard: must be owner or have a doctor role
  if (!ownerCheck) {
    const roles = await getMyRoles();
    if (!roles.some((r: { role: string }) => r.role === "doctor")) {
      redirect("/d/select-role");
    }
  }

  // Check if checked in as doctor
  let checkedInLocationId: string | null = null;

  if (staffUser) {
    const { data: checkin } = await supabase
      .from("staff_checkins")
      .select("location_id")
      .eq("staff_user_id", staffUser.id)
      .eq("role", "doctor")
      .is("checked_out_at", null)
      .order("checked_in_at", { ascending: false })
      .limit(1)
      .single();

    checkedInLocationId = checkin?.location_id ?? null;
  }

  // Not checked in — show location picker
  if (!checkedInLocationId) {
    const roles = await getMyRoles();
    const doctorLocations = ownerCheck
      ? await supabase
          .rpc("get_locations")
          .then((r) =>
            (r.data ?? []).map((l: { id: string; name: string }) => ({
              id: l.id,
              name: l.name,
            }))
          )
      : roles
          .filter((r: { role: string }) => r.role === "doctor")
          .map((r: { location_id: string; location_name: string }) => ({
            id: r.location_id,
            name: r.location_name,
          }));

    return (
      <DoctorDashboard
        mode="select_location"
        locations={doctorLocations}
        staffUserId={staffUser?.id ?? null}
        orgId={orgId}
        locationId={null}
        initialQueue={[]}
        initialClaimed={[]}
        initialCompleted={[]}
        initialLeft={[]}
        initialDoctors={[]}
      />
    );
  }

  // Get location name
  const { data: locationRow } = await supabase
    .from("locations")
    .select("name")
    .eq("id", checkedInLocationId)
    .single();
  const locationName = locationRow?.name ?? "Clinic";

  // Fetch all data
  const [queueRes, claimedRes, completedLeftRes, doctorsRes] =
    await Promise.all([
      supabase.rpc("get_queue", { p_location_id: checkedInLocationId }),
      supabase.rpc("get_claimed_patients", {
        p_location_id: checkedInLocationId,
      }),
      supabase.rpc("get_completed_and_left_visits", {
        p_location_id: checkedInLocationId,
      }),
      supabase.rpc("get_checked_in_doctors", {
        p_location_id: checkedInLocationId,
      }),
    ]);

  return (
    <DoctorDashboard
      mode="dashboard"
      locations={[]}
      staffUserId={staffUser?.id ?? null}
      orgId={orgId}
      locationId={checkedInLocationId}
      locationName={locationName}
      initialQueue={queueRes.data?.queue ?? []}
      initialClaimed={claimedRes.data?.claimed ?? []}
      initialCompleted={completedLeftRes.data?.completed ?? []}
      initialLeft={completedLeftRes.data?.left ?? []}
      initialDoctors={doctorsRes.data?.doctors ?? []}
      initialHasMoreCompleted={completedLeftRes.data?.has_more_completed ?? false}
      initialHasMoreLeft={completedLeftRes.data?.has_more_left ?? false}
    />
  );
}
