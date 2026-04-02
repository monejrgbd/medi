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

export async function setupOnboardingDemo(locationId: string) {
  await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("setup_onboarding_demo", {
    p_location_id: locationId,
  });
  if (error) return { success: false, error: "Failed to set up demo" };
  return data as { success: boolean; error?: string; staff_user_id?: string };
}

export async function updateOrganizationProfile(orgName: string, fullName: string) {
  await requireAuth();
  const supabase = await createClient();

  const { error: nameError } = await supabase.rpc("update_organization_name", {
    p_name: orgName,
  });
  if (nameError) return { success: false, error: "Failed to update organization name" };

  const { error: userError } = await supabase.auth.updateUser({
    data: { full_name: fullName },
  });
  if (userError) return { success: false, error: "Failed to update name" };

  return { success: true };
}

export async function approveOnboardingVisit(visitId: string) {
  await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("approve_patient", {
    p_visit_id: visitId,
  });
  if (error) return { success: false, error: "Failed to approve visit" };
  return data as { success: boolean; error?: string };
}
