"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth, isPlatformAdmin } from "@/lib/auth";

export async function fetchPremiumCodes() {
  await requireAuth();
  const adminCheck = await isPlatformAdmin();
  if (!adminCheck) return { success: false, error: "Not authorized" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_premium_codes");
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function createPremiumCode(params: {
  email?: string;
  phone?: string;
  domain?: string;
  sendEmail?: boolean;
}) {
  await requireAuth();
  const adminCheck = await isPlatformAdmin();
  if (!adminCheck) return { success: false, error: "Not authorized" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_create_premium_code", {
    p_email: params.email || null,
    p_phone: params.phone || null,
    p_domain: params.domain || null,
    p_send_email: params.sendEmail ?? false,
  });
  if (error) return { success: false, error: error.message };
  return data;
}
