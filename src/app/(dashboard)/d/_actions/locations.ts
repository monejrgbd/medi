"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { stripHtml } from "@/lib/utils";
import { getMyOrg, requireAuth, isOwner } from "@/lib/auth";

export async function createLocation(formData: {
  orgId: string;
  name: string;
  address?: string;
  specialty?: string;
  operatingHours?: Record<string, unknown>;
  nurseEnabled?: boolean;
  vitalsEnabled?: boolean;
  vaccinesEnabled?: boolean;
  skipAi?: boolean;
  reviewSmsEnabled?: boolean;
  diagnosticEnabled?: boolean;
}) {
  await requireAuth();
  const name = stripHtml(formData.name).slice(0, 100);
  if (!name) {
    return { success: false, error: "Location name is required" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_location", {
    p_org_id: formData.orgId,
    p_name: name,
    p_address: formData.address ? stripHtml(formData.address).slice(0, 200) : null,
    p_specialty: formData.specialty || null,
    p_operating_hours: formData.operatingHours || null,
    p_nurse_enabled: formData.nurseEnabled ?? false,
    p_vitals_enabled: formData.vitalsEnabled ?? true,
    p_vaccines_enabled: formData.vaccinesEnabled ?? false,
    p_skip_ai: formData.skipAi ?? false,
    p_review_sms_enabled: formData.reviewSmsEnabled ?? true,
    p_diagnostic_enabled: formData.diagnosticEnabled ?? true,
  });

  if (error) return { success: false, error: "Failed to create location" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/owner");
  return { success: true, locationId: data?.location_id };
}

export async function updateLocation(formData: {
  locationId: string;
  name?: string;
  address?: string;
  specialty?: string;
  operatingHours?: Record<string, unknown>;
  aiModel?: string;
  displayFormat?: string;
  referralEmail?: string;
  tabletCount?: number;
  timezone?: string;
  logoUrl?: string;
  nurseEnabled?: boolean;
  vaccinesEnabled?: boolean;
  vitalsEnabled?: boolean;
  aiCustomInstructions?: string;
  aiMessageLimit?: number | null;
  skipAi?: boolean;
  reviewSmsEnabled?: boolean;
  diagnosticEnabled?: boolean;
}) {
  await requireAuth();
  const supabase = await createClient();

  const params: Record<string, unknown> = {
    p_location_id: formData.locationId,
  };

  if (formData.name !== undefined) {
    const name = stripHtml(formData.name).slice(0, 100);
    if (!name) return { success: false, error: "Location name cannot be empty" };
    params.p_name = name;
  }
  if (formData.address !== undefined) params.p_address = stripHtml(formData.address).slice(0, 200);
  if (formData.specialty !== undefined) params.p_specialty = formData.specialty;
  if (formData.operatingHours !== undefined) params.p_operating_hours = formData.operatingHours;
  if (formData.aiModel !== undefined) params.p_ai_model = formData.aiModel;
  if (formData.displayFormat !== undefined) params.p_display_format = formData.displayFormat;
  if (formData.referralEmail !== undefined) params.p_referral_email = stripHtml(formData.referralEmail).slice(0, 200);
  if (formData.tabletCount !== undefined) params.p_tablet_count = formData.tabletCount;
  if (formData.timezone !== undefined) params.p_timezone = formData.timezone;
  if (formData.logoUrl !== undefined) params.p_logo_url = formData.logoUrl;
  if (formData.nurseEnabled !== undefined) params.p_nurse_enabled = formData.nurseEnabled;
  if (formData.vaccinesEnabled !== undefined) params.p_vaccines_enabled = formData.vaccinesEnabled;
  if (formData.vitalsEnabled !== undefined) params.p_vitals_enabled = formData.vitalsEnabled;
  if (formData.aiCustomInstructions !== undefined) params.p_ai_custom_instructions = formData.aiCustomInstructions;
  if (formData.aiMessageLimit !== undefined) params.p_ai_message_limit = formData.aiMessageLimit === null ? 0 : formData.aiMessageLimit;
  if (formData.skipAi !== undefined) params.p_skip_ai = formData.skipAi;
  if (formData.reviewSmsEnabled !== undefined) params.p_review_sms_enabled = formData.reviewSmsEnabled;
  if (formData.diagnosticEnabled !== undefined) params.p_diagnostic_enabled = formData.diagnosticEnabled;

  const { data, error } = await supabase.rpc("update_location", params);

  if (error) return { success: false, error: "Failed to update location" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/owner");
  revalidatePath("/d/manager");
  return { success: true };
}

export async function updateOrganization(formData: { name: string; skipAi?: boolean }) {
  await requireAuth();
  const name = stripHtml(formData.name).slice(0, 100);
  if (!name) {
    return { success: false, error: "Organization name is required" };
  }

  const supabase = await createClient();

  const rpcParams: Record<string, unknown> = { p_name: name };
  if (formData.skipAi !== undefined) rpcParams.p_skip_ai = formData.skipAi;

  const { data, error } = await supabase.rpc("update_organization", rpcParams);

  if (error) return { success: false, error: "Failed to update organization" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/owner");
  return { success: true };
}

export async function deactivateAccount(orgId: string) {
  const user = await requireAuth();

  const ownerCheck = await isOwner(user.id);
  if (!ownerCheck) return { success: false, error: "Not authorized" };

  const supabase = await createClient();

  // Cancel PayPal subscription if active
  const { data: org } = await supabase
    .from("organizations")
    .select("paypal_subscription_id")
    .eq("id", orgId)
    .single();

  const PAYPAL_API_BASE =
    process.env.PAYPAL_API_BASE || "https://api-m.paypal.com";

  if (
    org?.paypal_subscription_id &&
    process.env.PAYPAL_CLIENT_ID &&
    process.env.PAYPAL_CLIENT_SECRET
  ) {
    try {
      const auth = Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
      ).toString("base64");
      const tokenRes = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });
      const tokenData = await tokenRes.json();
      await fetch(
        `${PAYPAL_API_BASE}/v1/billing/subscriptions/${org.paypal_subscription_id}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: "Account deactivated" }),
        }
      );
    } catch {
      // Continue — deactivation should proceed even if PayPal fails
    }
  }

  const { data, error } = await supabase.rpc("deactivate_account");
  if (error) return { success: false, error: error.message };
  revalidatePath("/d/owner");
  return data;
}

export async function uploadLocationLogo(locationId: string, formData: FormData) {
  await requireAuth();
  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No file provided" };

  if (!file.type.startsWith("image/")) {
    return { success: false, error: "File must be an image" };
  }

  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: "File must be under 2MB" };
  }

  const org = await getMyOrg();
  if (!org?.id) return { success: false, error: "Organization not found" };

  const supabase = await createClient();
  const path = `${org.id}/${locationId}/logo`;

  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(path, file, { upsert: true });

  if (uploadError) return { success: false, error: "Failed to upload logo" };

  const { data: urlData } = supabase.storage
    .from("logos")
    .getPublicUrl(path);

  const logoUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  const { data, error } = await supabase.rpc("update_location", {
    p_location_id: locationId,
    p_logo_url: logoUrl,
  });

  if (error) return { success: false, error: "Failed to update location logo" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/owner");
  return { success: true, logoUrl: urlData.publicUrl };
}
