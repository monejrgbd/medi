import { requireAuth, isPlatformAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/dashboard/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  const adminCheck = await isPlatformAdmin();

  if (!adminCheck) {
    redirect("/d/select-role");
  }

  return (
    <div className="min-h-screen bg-snow lg:flex">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
