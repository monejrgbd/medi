import { requireAuth, isOwner, getMyRoles } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  const ownerCheck = await isOwner(user.id);
  if (!ownerCheck) {
    const roles = await getMyRoles();
    const hasDoctor = roles.some(
      (r: { role: string }) => r.role === "doctor"
    );
    if (!hasDoctor) {
      redirect("/d/select-role");
    }
  }

  return <div className="min-h-screen bg-snow">{children}</div>;
}
