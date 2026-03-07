import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function getStaffUser(authUid: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff_users")
    .select("*")
    .eq("auth_uid", authUid)
    .eq("is_deleted", false)
    .single();
  return data;
}

export async function isOwner(authUid: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizations")
    .select("owner_id")
    .eq("owner_id", authUid)
    .single();
  return !!data;
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
