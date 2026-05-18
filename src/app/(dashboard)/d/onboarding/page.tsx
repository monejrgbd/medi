import { requireAuth, isOwner, getMyOrg } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { countryFromISO2 } from "@/lib/countries";
import { edgeCountryISO2 } from "@/lib/edge-geo";

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

  // Best-effort country prefill from the host edge geo signal (Netlify
  // x-nf-geo). Empty when unavailable (local dev) so the dropdown starts blank.
  const hdrs = await headers();
  const detectedCountry = countryFromISO2(edgeCountryISO2(hdrs));

  return (
    <OnboardingWizard
      org={{
        id: org.id,
        name: org.name,
        slug: org.slug,
        credits_total: org.credits_total,
        credits_used: org.credits_used,
        trial_end_date: org.trial_end_date,
        country: org.country ?? null,
      }}
      detectedCountry={detectedCountry}
      existingLocations={existingLocations}
    />
  );
}
