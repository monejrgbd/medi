import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function getStaffUser(_authUid: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_my_staff_user");
  return data as { id: string; org_id: string; auth_uid: string; full_name: string; username: string } | null;
}

export async function isOwner(authUid: string) {
  const org = await getMyOrg();
  return !!org?.owner_id && org.owner_id === authUid;
}

export async function requireRole(locationId: string, role: string) {
  const user = await requireAuth();
  const ownerCheck = await isOwner(user.id);
  if (ownerCheck) return user;

  const supabase = await createClient();
  const { data } = await supabase
    .from("staff_roles")
    .select("id, staff_users!inner(auth_uid)")
    .eq("location_id", locationId)
    .eq("role", role)
    .eq("staff_users.auth_uid", user.id)
    .eq("staff_users.is_active", true)
    .eq("staff_users.is_deleted", false)
    .single();

  if (!data) {
    redirect("/d/select-role");
  }
  return user;
}

export async function getMyRoles() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_my_roles");
  return data ?? [];
}

export async function getMyOrg() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_my_org");
  return data ?? {};
}
