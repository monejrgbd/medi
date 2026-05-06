import { requireAuth, isOwner, getMyOrg, isPlatformAdmin, getPartnerByAuthUid, getMyRoles } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import RoleSelector from "@/components/RoleSelector";

export const metadata = {
  title: "Select Role — Hilt Health",
};

export default async function SelectRolePage() {
  const user = await requireAuth();

  // Demo user should never reach the real dashboard — sign them out
  if (user.email === process.env.DEMO_STAFF_EMAIL) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }
  // Platform admin → admin dashboard
  const adminCheck = await isPlatformAdmin();
  if (adminCheck) {
    redirect("/d/admin");
  }

  const [ownerCheck, partner, roles] = await Promise.all([
    isOwner(user.id),
    getPartnerByAuthUid(user.id),
    getMyRoles(),
  ]);

  // Partner only (no clinic association) → affiliate dashboard
  const hasClinicLink = ownerCheck || (Array.isArray(roles) && roles.length > 0);
  if (partner && !hasClinicLink) {
    redirect("/affiliate/dashboard");
  }

  if (ownerCheck) {
    const org = await getMyOrg();
    if (!org?.onboarding_completed_at) {
      const supabase = await createClient();
      const { data: locations } = await supabase.rpc("get_locations");
      if (!locations || locations.length === 0) {
        redirect("/d/onboarding");
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-snow px-4">
      <div className="w-full max-w-2xl">
        {partner && (
          <div className="mb-4 rounded-xl border border-hilt-blue/20 bg-hilt-blue/5 p-3 text-sm text-ink">
            You are also a Hilt affiliate. <Link href="/affiliate/dashboard" className="font-medium text-hilt-blue hover:underline">Go to affiliate dashboard →</Link>
          </div>
        )}
        <RoleSelector />
      </div>
    </div>
  );
}
