"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth, isOwner } from "@/lib/auth";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_PLANS = [
  "starter",
  "standard",
  "plus",
  "enterprise",
  "pay_as_you_go",
];
const PAYPAL_API_BASE =
  process.env.PAYPAL_API_BASE || "https://api-m.paypal.com";
const VALID_ADDONS = ["review_sms", "followup_sms", "diagnostic"];

export async function fetchCreditDashboard() {
  await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_credit_dashboard");
  if (error) return { success: false, error: error.message };
  return data;
}

export async function purchaseOverageCredits(amount: number) {
  await requireAuth();

  if (!Number.isInteger(amount) || amount < 1 || amount > 1000) {
    return { success: false, error: "Amount must be an integer between 1 and 1000" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("purchase_overage_credits", {
    p_amount: amount,
  });
  if (error) return { success: false, error: error.message };
  return data;
}

export async function toggleLocationAddon(
  locationId: string,
  addonType: string,
  enabled: boolean
) {
  await requireAuth();

  if (!UUID_RE.test(locationId))
    return { success: false, error: "Invalid location ID" };
  if (!VALID_ADDONS.includes(addonType))
    return { success: false, error: "Invalid addon type" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("toggle_location_addon", {
    p_location_id: locationId,
    p_addon_type: addonType,
    p_enabled: enabled,
  });
  if (error) return { success: false, error: error.message };
  return data;
}

export async function cancelSubscription(orgId: string) {
  const user = await requireAuth();

  if (!UUID_RE.test(orgId))
    return { success: false, error: "Invalid org ID" };

  const ownerCheck = await isOwner(user.id);
  if (!ownerCheck) return { success: false, error: "Not authorized" };

  // Cancel PayPal subscription if exists
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("paypal_subscription_id")
    .eq("id", orgId)
    .single();

  if (
    org?.paypal_subscription_id &&
    process.env.PAYPAL_CLIENT_ID &&
    process.env.PAYPAL_CLIENT_SECRET
  ) {
    try {
      const auth = Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
      ).toString("base64");

      const tokenRes = await fetch(
        `${PAYPAL_API_BASE}/v1/oauth2/token`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: "grant_type=client_credentials",
        }
      );
      const tokenData = await tokenRes.json();

      const cancelRes = await fetch(
        `${PAYPAL_API_BASE}/v1/billing/subscriptions/${org.paypal_subscription_id}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: "Subscription cancelled by owner" }),
        }
      );
      // 204 = success, 422 = already cancelled — both are fine
      if (!cancelRes.ok && cancelRes.status !== 422) {
        return { success: false, error: "Failed to cancel PayPal subscription. Please try again." };
      }
    } catch {
      return { success: false, error: "Could not reach PayPal. Please try again." };
    }
  }

  const { data, error } = await supabase.rpc("cancel_subscription");
  if (error) return { success: false, error: error.message };
  return data;
}

export async function setRechargeLimit(limit: number | null) {
  await requireAuth();

  if (limit !== null && (!Number.isInteger(limit) || limit < 0 || limit > 10000)) {
    return { success: false, error: "Limit must be an integer between 1 and 10000" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_recharge_limit", {
    p_limit: limit === 0 ? null : limit,
  });
  if (error) return { success: false, error: error.message };
  return data;
}

export async function searchPatients(
  query: string,
  birthday?: string,
  limit?: number
) {
  await requireAuth();

  if (!query || query.length < 1 || query.length > 100)
    return { success: false, error: "Query must be between 1 and 100 characters" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_patients", {
    p_query: query,
    p_birthday: birthday || null,
    p_limit: limit || 25,
  });
  if (error) return { success: false, error: error.message };
  return data;
}

export async function fetchPatientFullProfile(patientId: string) {
  await requireAuth();

  if (!UUID_RE.test(patientId))
    return { success: false, error: "Invalid patient ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_patient_full_profile", {
    p_patient_id: patientId,
  });
  if (error) return { success: false, error: error.message };

  supabase.rpc("log_phi_access", { p_entity_type: "patient", p_entity_id: patientId }).then(() => {}, () => {});
  return data;
}

export async function fetchFollowUpSmsConfig(orgId: string) {
  await requireAuth();

  if (!UUID_RE.test(orgId))
    return { success: false, error: "Invalid org ID" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("followup_sms_config")
    .select("*")
    .eq("org_id", orgId);
  if (error) return { success: false, error: error.message };
  return { success: true, configs: data };
}

export async function saveFollowUpSmsConfig(
  orgId: string,
  config: {
    max_reminders: number;
    first_reminder_days: number;
    second_reminder_days: number;
    template?: string;
  }
) {
  await requireAuth();

  if (!UUID_RE.test(orgId))
    return { success: false, error: "Invalid org ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_followup_sms_config", {
    p_org_id: orgId,
    p_max_reminders: config.max_reminders,
    p_first_reminder_days: config.first_reminder_days,
    p_second_reminder_days: config.second_reminder_days,
    p_template: config.template || null,
  });
  if (error) return { success: false, error: error.message };
  return data;
}
