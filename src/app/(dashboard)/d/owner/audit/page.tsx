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
    <div className="p-6">
      <h1 className="text-xl font-bold text-ink mb-6">Audit Trail</h1>
      <AuditTrailViewer orgId={orgId} />
    </div>
  );
}
