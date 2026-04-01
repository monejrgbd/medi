"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { stripHtml } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";
import { PROVIDER_ROLES } from "@/lib/constants";

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || "https://api-m.paypal.com";

async function reviseSubscriptionQuantity(orgId: string) {
  try {
    const supabase = await createClient();
    const { data: org } = await supabase
      .from("organizations")
      .select("paypal_subscription_id")
      .eq("id", orgId)
      .single();
    if (!org?.paypal_subscription_id) return;

    // Count active providers (doctors + nurses) via RPC to bypass RLS
    const { data: countResult } = await supabase.rpc("count_active_providers", { p_org_id: orgId });
    const providerCount = typeof countResult === "number" ? countResult : 0;

    // quantity = 1 (owner) + provider count
    const quantity = providerCount + 1;

    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) return;

    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString("base64");

    const tokenRes = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    });
    const tokenData = await tokenRes.json();

    await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${org.paypal_subscription_id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${tokenData.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify([{ op: "replace", path: "/quantity", value: String(quantity) }]),
    });
  } catch (err) {
    console.error("PayPal quantity revision failed:", err);
  }
}

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

  // Revise PayPal quantity if a provider role was assigned
  if (formData.roles.some((r) => (PROVIDER_ROLES as readonly string[]).includes(r))) {
    reviseSubscriptionQuantity(formData.orgId).catch(() => {});
  }

  revalidatePath("/d/owner");
  return { success: true, staffUserId: data?.staff_user_id };
}

export async function deactivateStaff(staffUserId: string, orgId?: string) {
  await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("deactivate_staff", {
    p_staff_user_id: staffUserId,
  });

  if (error) return { success: false, error: "Failed to deactivate staff" };
  if (data && !data.success) return { success: false, error: data.error };

  if (orgId) reviseSubscriptionQuantity(orgId).catch(() => {});

  revalidatePath("/d/owner");
  return { success: true };
}

export async function reactivateStaff(staffUserId: string) {
  await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("reactivate_staff", {
    p_staff_user_id: staffUserId,
  });

  if (error) return { success: false, error: "Failed to reactivate staff" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/owner");
  return { success: true };
}

export async function deleteStaff(staffUserId: string, orgId?: string) {
  await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("delete_staff", {
    p_staff_user_id: staffUserId,
  });

  if (error) return { success: false, error: "Failed to delete staff" };
  if (data && !data.success) return { success: false, error: data.error };

  if (orgId) reviseSubscriptionQuantity(orgId).catch(() => {});

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
