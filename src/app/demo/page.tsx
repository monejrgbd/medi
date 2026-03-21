import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import DemoGate from "@/components/demo/DemoGate";
import DemoShell from "@/components/demo/DemoShell";

const DEMO_LOCATION_ID = process.env.DEMO_LOCATION_ID!;
const DEMO_ORG_ID = process.env.DEMO_ORG_ID!;

export default async function DemoPage() {
  const supabase = await createClient();
  const user = await getUser();

  const isDemoUser = user?.email === process.env.DEMO_STAFF_EMAIL;

  if (!isDemoUser) {
    return <DemoGate existingSession={!!user} />;
  }

  // Fetch all demo data in parallel
  const [
    locationRes,
    pendingRes,
    countsRes,
    activeRes,
    completedRes,
    queueRes,
    claimedRes,
    completedLeftRes,
    doctorsRes,
    staffRes,
    reviewsRes,
    marketingData,
  ] = await Promise.all([
    supabase.rpc("check_location_active", {
      p_location_id: DEMO_LOCATION_ID,
    }),
    supabase.rpc("get_pending_approvals", {
      p_location_id: DEMO_LOCATION_ID,
    }),
    supabase.rpc("get_receptionist_counts", {
      p_location_id: DEMO_LOCATION_ID,
    }),
    supabase
      .from("visits")
      .select(
        "id, status, priority, gave_tablet, handled, has_previous_visits, created_at, claimed_by, claimed_at, nurse_reviewed, patient_id, patients(id, first_name, last_name, birthday), claimed_doctor:staff_users!visits_claimed_by_fkey(full_name)"
      )
      .eq("location_id", DEMO_LOCATION_ID)
      .not("status", "in", '("completed","left")')
      .eq("handled", false)
      .order("created_at", { ascending: true }),
    supabase
      .from("visits")
      .select(
        "id, status, gave_tablet, has_previous_visits, created_at, completed_at, patient_id, patients(id, first_name, last_name, birthday)"
      )
      .eq("location_id", DEMO_LOCATION_ID)
      .eq("status", "completed")
      .gte(
        "completed_at",
        new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
      )
      .order("completed_at", { ascending: false }),
    supabase.rpc("get_queue", { p_location_id: DEMO_LOCATION_ID }),
    supabase.rpc("get_claimed_patients", {
      p_location_id: DEMO_LOCATION_ID,
    }),
    supabase.rpc("get_completed_and_left_visits", {
      p_location_id: DEMO_LOCATION_ID,
    }),
    supabase.rpc("get_checked_in_doctors", {
      p_location_id: DEMO_LOCATION_ID,
    }),
    supabase.rpc("get_my_staff_user"),
    supabase.rpc("get_review_hub", { p_location_id: DEMO_LOCATION_ID }),
    supabase.rpc("get_campaign_list", { p_offset: 0, p_limit: 20 }),
  ]);

  const locationData = locationRes.data ?? {
    active: true,
    location_name: "Demo Clinic",
    org_name: "Hilt Health Demo",
  };

  const staffUser = staffRes.data as {
    id: string;
    org_id: string;
    full_name: string;
  } | null;

  return (
    <DemoShell
      locationId={DEMO_LOCATION_ID}
      locationData={{
        active: locationData.active ?? true,
        location_name: locationData.location_name,
        address: locationData.address,
        specialty: locationData.specialty,
        operating_hours: locationData.operating_hours ?? null,
        org_name: locationData.org_name,
        logo_url: locationData.logo_url ?? null,
      }}
      orgId={DEMO_ORG_ID}
      staffUserId={staffUser?.id ?? "dc81e052-cbfd-4a7b-86dc-ce48ad2b60a0"}
      locationName={locationData.location_name ?? "Demo Clinic"}
      receptionistInitial={{
        pending: pendingRes.data?.pending ?? [],
        active: (activeRes.data ?? []) as any[],
        completed: (completedRes.data ?? []) as any[],
        counts: countsRes.data ?? null,
      }}
      doctorInitial={{
        queue: queueRes.data?.queue ?? [],
        claimed: claimedRes.data?.claimed ?? [],
        completed: completedLeftRes.data?.completed ?? [],
        left: completedLeftRes.data?.left ?? [],
        doctors: doctorsRes.data?.doctors ?? [],
        hasMoreCompleted:
          completedLeftRes.data?.has_more_completed ?? false,
        hasMoreLeft: completedLeftRes.data?.has_more_left ?? false,
      }}
      reviewsInitial={{
        reviews: (reviewsRes.data?.reviews ?? []) as any[],
        stats: (reviewsRes.data?.stats ?? null) as any,
      }}
      marketingInitial={marketingData.data}
    />
  );
}
