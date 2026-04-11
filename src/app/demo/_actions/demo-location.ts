"use server";

import { createClient } from "@/lib/supabase/server";

export async function syncDemoLocationFeatures(
  locationId: string,
  features: {
    nurseEnabled: boolean;
    reviewCollection: boolean;
  }
) {
  if (!locationId) return { success: false, error: "Missing location ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("sync_demo_location_features", {
    p_location_id: locationId,
    p_nurse_enabled: features.nurseEnabled,
    p_vitals_enabled: true,
    p_vaccines_enabled: true,
    p_review_sms_enabled: features.reviewCollection,
  });

  if (error) return { success: false, error: "Failed to sync location features" };
  if (data && !data.success) return { success: false, error: data.error };
  return { success: true };
}
