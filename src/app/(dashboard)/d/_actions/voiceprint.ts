"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

/** Enrollment status for the calling clinician (never returns the embedding). */
export async function fetchMyVoiceprint() {
  await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_voiceprint");
  if (error) return { success: false, error: "Failed to load voiceprint status" };
  return data as {
    success: boolean;
    enrolled?: boolean;
    display_name?: string;
    model_version?: string;
    enrolled_at?: string;
    error?: string;
  };
}

/** Delete the calling clinician's voiceprint (strips the biometric, keeps audit). */
export async function deleteMyVoiceprint() {
  await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("delete_my_voiceprint");
  if (error) return { success: false, error: "Failed to delete voiceprint" };
  return data as { success: boolean; deleted?: boolean; error?: string };
}
