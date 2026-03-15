import { requireAuth, isOwner } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const ownerCheck = await isOwner(user.id);

  if (!ownerCheck) {
    redirect("/d/select-role");
  }

  return (
    <div className="min-h-screen bg-snow lg:flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
