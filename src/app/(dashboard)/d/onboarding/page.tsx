import { requireAuth, isOwner, getMyOrg } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export const metadata = {
  title: "Get Started — Hilt Health",
};

export default async function OnboardingPage() {
  const user = await requireAuth();
  const ownerCheck = await isOwner(user.id);

  if (!ownerCheck) {
    redirect("/d/select-role");
  }

  const org = await getMyOrg();

  if (org.onboarding_completed_at) {
    redirect("/d/owner");
  }

  const supabase = await createClient();
  const { data: locations } = await supabase.rpc("get_locations");
  const existingLocations = (locations ?? []).map(
    (l: { id: string; name: string }) => ({ id: l.id, name: l.name })
  );

  return (
    <OnboardingWizard
      org={{
        id: org.id,
        name: org.name,
        slug: org.slug,
        credits_total: org.credits_total,
        credits_used: org.credits_used,
        trial_end_date: org.trial_end_date,
      }}
      existingLocations={existingLocations}
    />
  );
}
