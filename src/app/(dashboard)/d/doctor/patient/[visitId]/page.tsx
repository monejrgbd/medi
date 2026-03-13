import { requireAuth, getStaffUser, isOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import PatientDetailView from "./PatientDetailView";

interface PageProps {
  params: Promise<{ visitId: string }>;
}

export default async function PatientDetailPage({ params }: PageProps) {
  const { visitId } = await params;

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(visitId)) notFound();

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

  // Fetch visit detail
  const { data, error } = await supabase.rpc("get_visit_detail", {
    p_visit_id: visitId,
  });

  if (error || !data?.success) {
    notFound();
  }

  const detail = data.data;

  // Defense-in-depth: verify visit belongs to caller's org (SQL already checks)
  // For claimed visits, verify caller is claiming doctor or owner
  if (
    detail.visit.status === "claimed_by_doctor" &&
    !ownerCheck &&
    detail.visit.claimed_by !== staffUser?.id
  ) {
    redirect("/d/doctor");
  }

  return (
    <PatientDetailView
      detail={detail}
      isOwner={ownerCheck}
      staffUserId={staffUser?.id ?? null}
    />
  );
}
