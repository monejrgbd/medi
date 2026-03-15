import { requireAuth, isOwner, getMyRoles } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  const ownerCheck = await isOwner(user.id);
  if (!ownerCheck) {
    const roles = await getMyRoles();
    const hasManager = roles.some(
      (r: { role: string }) => r.role === "manager"
    );
    if (!hasManager) {
      redirect("/d/select-role");
    }
  }

  return (
    <div className="min-h-screen bg-snow lg:flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
