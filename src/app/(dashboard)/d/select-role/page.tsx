import { requireAuth, isOwner, getMyOrg, isPlatformAdmin, getPartnerByAuthUid, getMyRoles } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Select Role, Hilt Health",
};

const ROLE_PREFERENCE = ["doctor", "nurse", "receptionist", "manager", "reviews", "marketer"];

async function signOutAction() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function SelectRolePage() {
  const user = await requireAuth();

  // Demo user should never reach the real dashboard, sign them out
  if (user.email === process.env.DEMO_STAFF_EMAIL) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  // Platform admin
  const adminCheck = await isPlatformAdmin();
  if (adminCheck) {
    redirect("/d/admin");
  }

  const [ownerCheck, partner, roles] = await Promise.all([
    isOwner(user.id),
    getPartnerByAuthUid(user.id),
    getMyRoles(),
  ]);

  // Partner only (no clinic association)
  const hasClinicLink = ownerCheck || (Array.isArray(roles) && roles.length > 0);
  if (partner && !hasClinicLink) {
    redirect("/affiliate/dashboard");
  }

  const org = await getMyOrg();
  const orgMeta = org as { id?: string; onboarding_completed_at?: string };

  // Owner without onboarding goes to onboarding flow
  if (ownerCheck && !orgMeta?.onboarding_completed_at) {
    const supabase = await createClient();
    const { data: locations } = await supabase.rpc("get_locations");
    if (!locations || locations.length === 0) {
      redirect("/d/onboarding");
    }
  }

  const hasOrg = !!orgMeta?.id;

  // Owner with a real org goes to the owner dashboard
  if (ownerCheck && hasOrg) {
    redirect("/d/owner");
  }

  // Staff with roles plus a resolvable org goes to their preferred role
  if (Array.isArray(roles) && roles.length > 0 && hasOrg) {
    const userRoleSet = new Set(roles.map((r: { role: string }) => r.role));
    const target = ROLE_PREFERENCE.find((r) => userRoleSet.has(r));
    if (target) {
      redirect(`/d/${target}`);
    }
  }

  // Anything else (no roles, missing org, unplaceable) renders the empty state
  return (
    <div className="flex min-h-screen items-center justify-center bg-snow px-4">
      <div className="w-full max-w-md">
        {partner && (
          <div className="mb-4 rounded-xl border border-hilt-blue/20 bg-hilt-blue/5 p-3 text-sm text-ink">
            You are also a Hilt affiliate.{" "}
            <Link href="/affiliate/dashboard" className="font-medium text-hilt-blue hover:underline">
              Go to affiliate dashboard →
            </Link>
          </div>
        )}
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-6 mb-6 text-center">
          <p className="text-sm text-amber-800">
            No roles assigned. Contact your administrator.
          </p>
        </div>
        <form action={signOutAction} className="text-center">
          <button
            type="submit"
            className="text-sm text-slate hover:text-ink transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
