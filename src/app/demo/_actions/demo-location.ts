"use server";

import { createClient } from "@/lib/supabase/server";

export async function syncDemoLocationFeatures(
  locationId: string,
  features: {
    nurseEnabled: boolean;
    vitalsEnabled: boolean;
    vaccinesEnabled: boolean;
    reviewCollection: boolean;
  }
) {
  if (!locationId) return { success: false, error: "Missing location ID" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("locations")
    .update({
      nurse_enabled: features.nurseEnabled,
      vitals_enabled: features.vitalsEnabled,
      vaccines_enabled: features.vaccinesEnabled,
      review_sms_enabled: features.reviewCollection,
    })
    .eq("id", locationId);

  if (error) return { success: false, error: "Failed to sync location features" };
  return { success: true };
}
