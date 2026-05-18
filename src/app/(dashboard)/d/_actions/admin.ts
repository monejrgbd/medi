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

/** Load all 4 AI tier combos from ai_model_config (platform admin only). */
export async function fetchAiModelConfig() {
  await requireAuth();
  const adminCheck = await isPlatformAdmin();
  if (!adminCheck) return { success: false, error: "Not authorized" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_model_config")
    .select("*")
    .order("tier");
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

const ALLOWED_PROVIDERS = ["anthropic", "google_vertex", "openai"] as const;
const ALLOWED_TIERS = ["standard", "advanced", "precision", "premium"] as const;

export interface AiComboInput {
  tier: string;
  display_name: string;
  credit_cost: number;
  intake_provider: string;
  intake_model: string;
  intake_model_display: string;
  intake_max_tokens: number;
  intake_temperature: number;
  summary_provider: string;
  summary_model: string;
  summary_model_display: string;
  summary_max_tokens: number;
  summary_temperature: number;
  diagnostic_provider: string;
  diagnostic_model: string;
  diagnostic_model_display: string;
  diagnostic_max_tokens: number;
  diagnostic_temperature: number;
  scribe_provider: string;
  scribe_model: string;
  scribe_model_display: string;
  scribe_max_tokens: number;
  scribe_temperature: number;
  notes?: string | null;
}

function validateCombo(input: AiComboInput): string | null {
  if (!ALLOWED_TIERS.includes(input.tier as typeof ALLOWED_TIERS[number])) return "Invalid tier";
  for (const task of ["intake", "summary", "diagnostic", "scribe"] as const) {
    const provider = input[`${task}_provider` as keyof AiComboInput] as string;
    const model = input[`${task}_model` as keyof AiComboInput] as string;
    const display = input[`${task}_model_display` as keyof AiComboInput] as string;
    if (!ALLOWED_PROVIDERS.includes(provider as typeof ALLOWED_PROVIDERS[number]))
      return `Invalid ${task} provider`;
    if (!model || typeof model !== "string" || model.length > 200) return `Invalid ${task} model`;
    if (!display || typeof display !== "string" || display.length > 200) return `Invalid ${task} display name`;
  }
  if (typeof input.credit_cost !== "number" || input.credit_cost < 0 || input.credit_cost > 100)
    return "Invalid credit cost";
  return null;
}

/** Update one tier's full combo atomically (platform admin only). */
export async function updateAiModelConfig(combo: AiComboInput) {
  await requireAuth();
  const adminCheck = await isPlatformAdmin();
  if (!adminCheck) return { success: false, error: "Not authorized" };

  const validationError = validateCombo(combo);
  if (validationError) return { success: false, error: validationError };

  const supabase = await createClient();
  const { tier, ...fields } = combo;
  const { data, error } = await supabase.rpc("update_ai_model_config", {
    p_tier: tier,
    p_combo: fields,
  });
  if (error) return { success: false, error: error.message };
  return data;
}

// ─── Plan-Level AI Config (document + scan per plan) ────────────────

/** Load all 7 plan rows from ai_plan_config (platform admin only). */
export async function fetchAiPlanConfig() {
  await requireAuth();
  const adminCheck = await isPlatformAdmin();
  if (!adminCheck) return { success: false, error: "Not authorized" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_plan_config")
    .select("*")
    .order("plan");
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export interface AiPlanComboInput {
  plan: string;
  document_provider: string;
  document_model: string;
  document_model_display: string;
  document_max_tokens: number;
  document_temperature: number;
  scan_provider: string;
  scan_model: string;
  scan_model_display: string;
  scan_max_tokens: number;
  scan_temperature: number;
}

/** Update one plan's document + scan config (platform admin only). */
export async function updateAiPlanConfig(combo: AiPlanComboInput) {
  await requireAuth();
  const adminCheck = await isPlatformAdmin();
  if (!adminCheck) return { success: false, error: "Not authorized" };

  for (const task of ["document", "scan"] as const) {
    const provider = combo[`${task}_provider` as keyof AiPlanComboInput] as string;
    const model = combo[`${task}_model` as keyof AiPlanComboInput] as string;
    if (!ALLOWED_PROVIDERS.includes(provider as typeof ALLOWED_PROVIDERS[number]))
      return { success: false, error: `Invalid ${task} provider` };
    if (!model || typeof model !== "string" || model.length > 200)
      return { success: false, error: `Invalid ${task} model` };
  }

  const supabase = await createClient();
  const { plan, ...fields } = combo;
  const { data, error } = await supabase.rpc("update_ai_plan_config", {
    p_plan: plan,
    p_combo: fields,
  });
  if (error) return { success: false, error: error.message };
  return data;
}
