import { requireAuth, isOwner, getStaffUser, getMyRoles } from "@/lib/auth";
import { redirect } from "next/navigation";
import AuditTrailViewer from "@/components/dashboard/AuditTrailViewer";

export const metadata = {
  title: "Audit Trail \u2014 Hilt Health",
};

export default async function AuditTrailPage() {
  const user = await requireAuth();

  // Allow owner or manager
  const ownerCheck = await isOwner(user.id);
  let orgId: string | null = null;

  if (ownerCheck) {
    const staff = await getStaffUser(user.id);
    orgId = staff?.org_id ?? null;
    if (!orgId) {
      // Owner without staff record — look up org directly
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      orgId = org?.id ?? null;
    }
  } else {
    const roles = await getMyRoles();
    const hasManager = (roles as { role: string }[]).some(
      (r) => r.role === "manager"
    );
    if (hasManager) {
      const staff = await getStaffUser(user.id);
      orgId = staff?.org_id ?? null;
    }
  }

  if (!orgId) redirect("/d/select-role");

  return (
    <AuditTrailViewer orgId={orgId} />
  );
}
