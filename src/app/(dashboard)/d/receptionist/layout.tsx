import { requireAuth, isOwner, getMyRoles } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ReceptionistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  // Allow owner or anyone with receptionist role
  const ownerCheck = await isOwner(user.id);
  if (!ownerCheck) {
    const roles = await getMyRoles();
    const hasReceptionist = roles.some(
      (r: { role: string }) => r.role === "receptionist"
    );
    if (!hasReceptionist) {
      redirect("/d/select-role");
    }
  }

  return (
    <div className="min-h-screen bg-snow">
      {children}
    </div>
  );
}
