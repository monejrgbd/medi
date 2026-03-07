"use server";

import { createClient } from "@/lib/supabase/server";

export async function createStaffUser(formData: {
  orgId: string;
  fullName: string;
  username: string;
  password: string;
  locationId: string;
  roles: string[];
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_staff_user", {
    p_org_id: formData.orgId,
    p_full_name: formData.fullName,
    p_username: formData.username,
    p_password: formData.password,
    p_location_id: formData.locationId,
    p_roles: formData.roles,
  });

  if (error) return { success: false, error: error.message };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, staffUserId: data?.staff_user_id };
}

export async function deactivateStaff(staffUserId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("deactivate_staff", {
    p_staff_user_id: staffUserId,
  });

  if (error) return { success: false, error: error.message };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true };
}

export async function deleteStaff(staffUserId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("delete_staff", {
    p_staff_user_id: staffUserId,
  });

  if (error) return { success: false, error: error.message };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true };
}

export async function resetStaffPassword(
  staffUserId: string,
  newPassword: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("reset_staff_password", {
    p_staff_user_id: staffUserId,
    p_new_password: newPassword,
  });

  if (error) return { success: false, error: error.message };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true };
}
