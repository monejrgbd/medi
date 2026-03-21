"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Auth: owner OR marketer (SQL functions handle role check)

export async function createCampaign(
  structuredFilters: Record<string, unknown>,
  aiCriteria?: string,
  locationId?: string
) {
  await requireAuth();
  if (locationId && !UUID_RE.test(locationId))
    return { success: false, error: "Invalid location" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_sms_campaign", {
    p_structured_filters: structuredFilters,
    p_ai_criteria: aiCriteria || null,
    p_location_id: locationId || null,
  });
  if (error) return { success: false, error: error.message };
  return data;
}

export async function getCampaignList(offset = 0) {
  await requireAuth();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_campaign_list", {
    p_offset: offset,
    p_limit: 20,
  });
  if (error) return { success: false, error: error.message };
  return data;
}

export async function getCampaignDetail(campaignId: string) {
  await requireAuth();
  if (!UUID_RE.test(campaignId))
    return { success: false, error: "Invalid campaign ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_campaign_detail", {
    p_campaign_id: campaignId,
  });
  if (error) return { success: false, error: error.message };
  return data;
}

export async function updateCampaignMessage(
  campaignId: string,
  messageBody: string
) {
  await requireAuth();
  if (!UUID_RE.test(campaignId))
    return { success: false, error: "Invalid campaign ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_campaign_message", {
    p_campaign_id: campaignId,
    p_message_body: messageBody,
  });
  if (error) return { success: false, error: error.message };
  return data;
}

export async function excludeRecipient(
  campaignId: string,
  recipientId: string,
  excluded: boolean
) {
  await requireAuth();
  if (!UUID_RE.test(campaignId) || !UUID_RE.test(recipientId))
    return { success: false, error: "Invalid ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("exclude_campaign_recipient", {
    p_campaign_id: campaignId,
    p_recipient_id: recipientId,
    p_excluded: excluded,
  });
  if (error) return { success: false, error: error.message };
  return data;
}

export async function sendCampaign(campaignId: string) {
  await requireAuth();
  if (!UUID_RE.test(campaignId))
    return { success: false, error: "Invalid campaign ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("send_campaign", {
    p_campaign_id: campaignId,
  });
  if (error) return { success: false, error: error.message };
  return data;
}

export async function cancelCampaign(campaignId: string) {
  await requireAuth();
  if (!UUID_RE.test(campaignId))
    return { success: false, error: "Invalid campaign ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_campaign", {
    p_campaign_id: campaignId,
  });
  if (error) return { success: false, error: error.message };
  return data;
}
