"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export async function toggleNotificationSound(enabled: boolean) {
  await requireAuth();
  if (typeof enabled !== "boolean")
    return { success: false, error: "Invalid value" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  // Get staff user id
  const { data: staff } = await supabase
    .from("staff_users")
    .select("id")
    .eq("auth_uid", user.id)
    .eq("is_active", true)
    .eq("is_deleted", false)
    .single();

  if (!staff) return { success: false, error: "Staff user not found" };

  const { error } = await supabase
    .from("staff_preferences")
    .upsert(
      { staff_user_id: staff.id, notification_sound: enabled },
      { onConflict: "staff_user_id" }
    );

  if (error) return { success: false, error: "Failed to update preference" };
  return { success: true };
}

export async function fetchNotificationPreference() {
  await requireAuth();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, notification_sound: true };

  const { data: staff } = await supabase
    .from("staff_users")
    .select("id")
    .eq("auth_uid", user.id)
    .eq("is_active", true)
    .eq("is_deleted", false)
    .single();

  if (!staff) return { success: false, notification_sound: true };

  const { data } = await supabase
    .from("staff_preferences")
    .select("notification_sound")
    .eq("staff_user_id", staff.id)
    .single();

  return {
    success: true,
    notification_sound: data?.notification_sound ?? true,
  };
}
