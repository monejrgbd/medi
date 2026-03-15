import { requireAuth } from "@/lib/auth";
import Sidebar from "@/components/dashboard/Sidebar";

export default async function ReviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return (
    <div className="min-h-screen bg-snow lg:flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
