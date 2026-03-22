import { requireAuth, getStaffUser, isOwner, getMyRoles, getMyOrg } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ReceptionistDashboard from "./ReceptionistDashboard";
import { redirect } from "next/navigation";

export default async function ReceptionistPage({
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

  // Role guard: must be owner or have a receptionist role
  if (!ownerCheck) {
    const roles = await getMyRoles();
    if (!roles.some((r: { role: string }) => r.role === "receptionist")) {
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

  // Check if user is currently checked in as receptionist
  let checkedInLocationId: string | null = null;
  let locationName = "Reception";
  let aiAutoSkipped = false;

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

    if (checkedInLocationId) {
      const { data: locationRow } = await supabase
        .from("locations")
        .select("name, skip_ai")
        .eq("id", checkedInLocationId)
        .single();
      locationName = locationRow?.name ?? "Reception";
      aiAutoSkipped = locationRow?.skip_ai ?? false;
    }
  }

  // Also check org-level skip_ai (overrides location)
  if (!aiAutoSkipped && orgId) {
    const { data: orgRow } = await supabase.from("organizations").select("skip_ai").eq("id", orgId).single();
    if (orgRow?.skip_ai) aiAutoSkipped = true;
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
    const receptionistLocations = ownerCheck
      ? allLocations
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
        isOwner={ownerCheck}
        orgId={orgId}
        locationId={null}
        suggestedLocationId={suggestedLocationId}
        initialPending={[]}
        initialActive={[]}
        initialCompleted={[]}
        initialCounts={null}
      />
    );
  }

  // Have a location — load initial data via RPCs (SECURITY DEFINER)
  const [pendingRes, countsRes] = await Promise.all([
    supabase.rpc("get_pending_approvals", {
      p_location_id: checkedInLocationId,
    }),
    supabase.rpc("get_receptionist_counts", {
      p_location_id: checkedInLocationId,
    }),
  ]);

  // Active/completed visits — direct queries (work for staff via RLS, may be empty for owner)
  const [activeRes, completedRes] = await Promise.all([
    supabase
      .from("visits")
      .select(
        "id, status, priority, gave_tablet, handled, has_previous_visits, created_at, claimed_by, claimed_at, nurse_reviewed, patient_id, patients(id, first_name, last_name, birthday), claimed_doctor:staff_users!visits_claimed_by_fkey(full_name)"
      )
      .eq("location_id", checkedInLocationId)
      .not("status", "in", '("completed","left")')
      .eq("handled", false)
      .order("created_at", { ascending: true }),
    supabase
      .from("visits")
      .select(
        "id, status, gave_tablet, has_previous_visits, created_at, completed_at, patient_id, patients(id, first_name, last_name, birthday), follow_ups(id, due_at, ai_instructions, status)"
      )
      .eq("location_id", checkedInLocationId)
      .eq("status", "completed")
      .gte("completed_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      .order("completed_at", { ascending: false }),
  ]);

  // Enrich active visits with claimer role info (nurse vs doctor)
  const activeVisits = (activeRes.data ?? []) as any[];
  const claimedStaffIds = activeVisits
    .filter((v: any) => v.claimed_by)
    .map((v: any) => v.claimed_by as string);

  let nurseStaffIds = new Set<string>();
  if (claimedStaffIds.length > 0) {
    const { data: nurseRoles } = await supabase
      .from("staff_roles")
      .select("staff_user_id")
      .eq("location_id", checkedInLocationId)
      .eq("role", "nurse")
      .in("staff_user_id", claimedStaffIds);
    nurseStaffIds = new Set((nurseRoles ?? []).map((r: any) => r.staff_user_id));
  }

  const enrichedActive = activeVisits.map((v: any) => ({
    ...v,
    claimed_is_nurse: v.claimed_by ? nurseStaffIds.has(v.claimed_by) : false,
  }));

  return (
    <ReceptionistDashboard
      mode="dashboard"
      locations={[]}
      staffUserId={staffUser?.id ?? null}
      isOwner={ownerCheck}
      orgId={orgId}
      locationId={checkedInLocationId}
      locationName={locationName}
      initialPending={pendingRes.data?.pending ?? []}
      initialActive={enrichedActive as any}
      initialCompleted={(completedRes.data ?? []) as any}
      initialCounts={countsRes.data ?? null}
      aiAutoSkipped={aiAutoSkipped}
    />
  );
}
