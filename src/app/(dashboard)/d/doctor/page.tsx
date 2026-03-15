import { requireAuth, getStaffUser, isOwner, getMyRoles, getMyOrg } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import DoctorDashboard from "./DoctorDashboard";
import { redirect } from "next/navigation";

export default async function DoctorPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>;
}) {
  const params = await searchParams;
  const user = await requireAuth();
  const supabase = await createClient();

  const staffUser = await getStaffUser(user.id);
  const ownerCheck = await isOwner(user.id);

  // Get org_id - staff user has it, owner uses getMyOrg (SECURITY DEFINER, bypasses RLS)
  let orgId: string | null = staffUser?.org_id ?? null;
  if (!orgId && ownerCheck) {
    const org = await getMyOrg();
    orgId = (org as { id?: string })?.id ?? null;
  }

  if (!orgId) redirect("/d/select-role");

  // Role guard: must be owner or have a doctor role
  if (!ownerCheck) {
    const roles = await getMyRoles();
    if (!roles.some((r: { role: string }) => r.role === "doctor")) {
      redirect("/d/select-role");
    }
  }

  // Get all org locations via SECURITY DEFINER RPC (bypasses RLS)
  const allLocations: { id: string; name: string }[] = ownerCheck
    ? await supabase.rpc("get_locations").then((r) =>
        (r.data ?? []).map((l: { id: string; name: string }) => ({
          id: l.id,
          name: l.name,
        }))
      )
    : [];

  // Check if checked in as doctor
  let checkedInLocationId: string | null = null;
  let locationName = "Clinic";

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

    if (checkedInLocationId) {
      const { data: locationRow } = await supabase
        .from("locations")
        .select("name")
        .eq("id", checkedInLocationId)
        .single();
      locationName = locationRow?.name ?? "Clinic";
    }
  }

  // Owner direct access via ?location= param or auto-select if single location
  if (!checkedInLocationId && ownerCheck) {
    const match = params.location
      ? allLocations.find((l) => l.id === params.location)
      : allLocations.length === 1
        ? allLocations[0]
        : null;
    if (match) {
      checkedInLocationId = match.id;
      locationName = match.name;
    }
  }

  // No location yet — show picker
  if (!checkedInLocationId) {
    const roles = await getMyRoles();
    const doctorLocations = ownerCheck
      ? allLocations
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
        isOwner={ownerCheck}
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

  // Have a location — load data via RPCs (all SECURITY DEFINER)
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
      isOwner={ownerCheck}
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
