import { requireAuth, isOwner, getMyRoles } from "@/lib/auth";
import { redirect } from "next/navigation";
import VitalTypesConfig from "@/components/dashboard/VitalTypesConfig";

export default async function VitalsConfigPage() {
  const user = await requireAuth();
  const ownerCheck = await isOwner(user.id);
  if (!ownerCheck) {
    const roles = await getMyRoles();
    const hasManager = roles.some((r: { role: string }) => r.role === "manager");
    if (!hasManager) redirect("/d/select-role");
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <VitalTypesConfig />
    </div>
  );
}
