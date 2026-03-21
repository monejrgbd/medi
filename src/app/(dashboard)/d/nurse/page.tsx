import { requireAuth, getStaffUser, isOwner, getMyRoles, getMyOrg } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import NurseDashboard from "./NurseDashboard";
import { redirect } from "next/navigation";

export default async function NursePage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string; skip?: string }>;
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

  // Role guard: must be owner or have a nurse role
  if (!ownerCheck) {
    const roles = await getMyRoles();
    if (!roles.some((r: { role: string }) => r.role === "nurse")) {
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

  // Check if checked in as nurse
  let checkedInLocationId: string | null = null;
  let locationName = "Clinic";

  if (staffUser) {
    const { data: checkin } = await supabase
      .from("staff_checkins")
      .select("location_id")
      .eq("staff_user_id", staffUser.id)
      .eq("role", "nurse")
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

  // Owner direct access: only if explicitly skipping check-in
  let suggestedLocationId: string | null = null;
  if (!checkedInLocationId && ownerCheck) {
    const match = params.location
      ? allLocations.find((l) => l.id === params.location)
      : allLocations.length === 1
        ? allLocations[0]
        : null;
    if (params.skip === "1" && match) {
      checkedInLocationId = match.id;
      locationName = match.name;
    } else if (match) {
      suggestedLocationId = match.id;
    }
  }

  // No location yet — show picker
  if (!checkedInLocationId) {
    const roles = await getMyRoles();
    const nurseLocations = ownerCheck
      ? allLocations
      : roles
          .filter((r: { role: string }) => r.role === "nurse")
          .map((r: { location_id: string; location_name: string }) => ({
            id: r.location_id,
            name: r.location_name,
          }));

    return (
      <NurseDashboard
        mode="select_location"
        locations={nurseLocations}
        staffUserId={staffUser?.id ?? null}
        isOwner={ownerCheck}
        orgId={orgId}
        locationId={null}
        suggestedLocationId={suggestedLocationId}
        initialQueue={[]}
        initialClaimed={[]}
        initialCompleted={[]}
        initialLeft={[]}
      />
    );
  }

  // Have a location — load data via RPCs (all SECURITY DEFINER)
  const [queueRes, claimedRes, completedLeftRes] = await Promise.all([
    supabase.rpc("get_queue", { p_location_id: checkedInLocationId }),
    supabase.rpc("get_claimed_patients", {
      p_location_id: checkedInLocationId,
    }),
    supabase.rpc("get_completed_and_left_visits", {
      p_location_id: checkedInLocationId,
    }),
  ]);

  return (
    <NurseDashboard
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
      initialHasMoreCompleted={completedLeftRes.data?.has_more_completed ?? false}
      initialHasMoreLeft={completedLeftRes.data?.has_more_left ?? false}
    />
  );
}
