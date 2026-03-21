"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { stripHtml } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";

export async function createStaffUser(formData: {
  orgId: string;
  fullName: string;
  username: string;
  password: string;
  locationId: string;
  roles: string[];
}) {
  await requireAuth();
  const fullName = stripHtml(formData.fullName).slice(0, 100);
  const username = formData.username.toLowerCase().trim().slice(0, 50);
  const password = formData.password;

  if (!fullName || !username || !password) {
    return { success: false, error: "All fields are required" };
  }

  if (!/^[a-z0-9_]+$/.test(username)) {
    return { success: false, error: "Username must be alphanumeric with underscores only" };
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }

  if (password.length > 72) {
    return { success: false, error: "Password must be at most 72 characters" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_staff_user", {
    p_org_id: formData.orgId,
    p_full_name: fullName,
    p_username: username,
    p_password: password,
    p_location_id: formData.locationId,
    p_roles: formData.roles,
  });

  if (error) {
    console.error("create_staff_user RPC error:", error.message, error.code);
    return { success: false, error: "Failed to create staff user" };
  }
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/owner");
  return { success: true, staffUserId: data?.staff_user_id };
}

export async function deactivateStaff(staffUserId: string) {
  await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("deactivate_staff", {
    p_staff_user_id: staffUserId,
  });

  if (error) return { success: false, error: "Failed to deactivate staff" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/owner");
  return { success: true };
}

export async function deleteStaff(staffUserId: string) {
  await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("delete_staff", {
    p_staff_user_id: staffUserId,
  });

  if (error) return { success: false, error: "Failed to delete staff" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/owner");
  return { success: true };
}

export async function resetStaffPassword(
  staffUserId: string,
  newPassword: string
) {
  await requireAuth();

  if (newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }

  if (newPassword.length > 72) {
    return { success: false, error: "Password must be at most 72 characters" };
  }
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("reset_staff_password", {
    p_staff_user_id: staffUserId,
    p_new_password: newPassword,
  });

  if (error) return { success: false, error: "Failed to reset password" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true };
}

export async function assignRole(
  staffUserId: string,
  locationId: string,
  role: string
) {
  await requireAuth();
  if (!["doctor", "nurse", "receptionist", "manager", "reviews"].includes(role)) {
    return { success: false, error: "Invalid role" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("assign_role", {
    p_staff_user_id: staffUserId,
    p_location_id: locationId,
    p_role: role,
  });

  if (error) return { success: false, error: "Failed to assign role" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/owner");
  return { success: true };
}

export async function removeRole(
  staffUserId: string,
  locationId: string,
  role: string
) {
  await requireAuth();
  if (!["doctor", "nurse", "receptionist", "manager", "reviews"].includes(role)) {
    return { success: false, error: "Invalid role" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("remove_role", {
    p_staff_user_id: staffUserId,
    p_location_id: locationId,
    p_role: role,
  });

  if (error) return { success: false, error: "Failed to remove role" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/owner");
  return { success: true };
}
