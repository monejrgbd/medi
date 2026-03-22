"use server";

import { createClient } from "@/lib/supabase/server";

export async function setVisitDemoFeatures(visitId: string, features: Record<string, boolean>) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_visit_demo_features", {
    p_visit_id: visitId,
    p_features: features,
  });
  if (error) return { success: false, error: "Failed to set demo features" };
  return data || { success: true };
}
