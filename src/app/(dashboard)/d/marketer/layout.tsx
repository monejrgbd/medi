import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MarketerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();

  // Check: owner or marketer role
  const supabase = await createClient();
  const { data: rolesData } = await supabase.rpc("get_my_roles");
  const roles = rolesData?.roles || [];
  const isMarketer = roles.some((r: { role: string }) => r.role === "marketer");

  // Also check if owner (owners can access marketer dashboard too)
  const { data: orgData } = await supabase.from("organizations").select("id").eq("owner_id", user.id).maybeSingle();
  const isOwner = !!orgData;

  if (!isMarketer && !isOwner) {
    redirect("/d/select-role");
  }

  return (
    <div className="min-h-screen bg-snow">
      <main className="p-6 lg:p-8">{children}</main>
    </div>
  );
}
