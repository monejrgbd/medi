"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export async function completeOnboarding() {
  await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_onboarding");
  if (error) return { success: false, error: "Failed to complete onboarding" };
  return data as { success: boolean; error?: string };
}

export async function updateOrganizationProfile(
  orgName: string,
  fullName: string,
  country: string
) {
  await requireAuth();
  const supabase = await createClient();

  const trimmedOrg = orgName.trim();
  if (!trimmedOrg) return { success: false, error: "Organization name is required" };

  const trimmedCountry = country.trim();
  if (!trimmedCountry) return { success: false, error: "Country is required" };

  const { error: nameError } = await supabase.rpc("update_organization_name", {
    p_name: trimmedOrg,
    p_full_name: fullName.trim() || undefined,
  });
  if (nameError) {
    console.error("update_organization_name failed:", nameError);
    return { success: false, error: "Failed to update organization name" };
  }

  const { error: countryError } = await supabase.rpc("update_organization_country", {
    p_country: trimmedCountry,
  });
  if (countryError) {
    console.error("update_organization_country failed:", countryError);
    return { success: false, error: "Failed to update country" };
  }

  const { error: userError } = await supabase.auth.updateUser({
    data: { full_name: fullName },
  });
  if (userError) {
    console.error("auth.updateUser failed:", userError);
    return { success: false, error: "Failed to update name" };
  }

  return { success: true };
}
