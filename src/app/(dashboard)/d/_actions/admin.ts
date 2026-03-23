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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function fetchOrganizations(search?: string) {
  await requireAuth();
  const adminCheck = await isPlatformAdmin();
  if (!adminCheck) return { success: false, error: "Not authorized" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_organizations", {
    p_search: search || null,
  });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function setEnterprisePlan(params: {
  orgId: string;
  creditsTotal: number;
  action: "activate" | "adjust_credits" | "revoke";
  paypalSubscriptionId?: string;
}) {
  await requireAuth();
  const adminCheck = await isPlatformAdmin();
  if (!adminCheck) return { success: false, error: "Not authorized" };

  if (!UUID_RE.test(params.orgId))
    return { success: false, error: "Invalid org ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_set_enterprise_plan", {
    p_org_id: params.orgId,
    p_credits_total: params.creditsTotal,
    p_action: params.action,
    p_paypal_subscription_id: params.paypalSubscriptionId || null,
  });
  if (error) return { success: false, error: error.message };
  return data;
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
