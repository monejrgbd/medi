"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { stripHtml } from "@/lib/utils";
import { ALLOWED_SPECIALTIES } from "@/lib/constants";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validUUID(id: string): boolean {
  return UUID_RE.test(id);
}

export async function createReferral(
  patientId: string,
  specialty: string,
  referralNote: string,
  includedVisitIds: string[],
  opts?: {
    includedAttachmentIds?: string[];
    toLocationId?: string;
    toEmail?: string;
  }
) {
  await requireAuth();
  if (!patientId || !validUUID(patientId))
    return { success: false, error: "Invalid patient ID" };

  const cleanSpecialty = stripHtml(specialty).slice(0, 50);
  if (!ALLOWED_SPECIALTIES.includes(cleanSpecialty))
    return { success: false, error: "Invalid specialty" };

  const cleanNote = stripHtml(referralNote).slice(0, 5000);
  if (!cleanNote) return { success: false, error: "Referral note is required" };

  if (!includedVisitIds || includedVisitIds.length === 0)
    return { success: false, error: "At least one visit must be included" };
  if (includedVisitIds.length > 50)
    return { success: false, error: "Too many visits included" };
  if (!includedVisitIds.every(validUUID))
    return { success: false, error: "Invalid visit ID" };

  const attachmentIds = opts?.includedAttachmentIds ?? null;
  if (attachmentIds) {
    if (attachmentIds.length > 50)
      return { success: false, error: "Too many attachments" };
    if (!attachmentIds.every(validUUID))
      return { success: false, error: "Invalid attachment ID" };
  }

  if (!opts?.toLocationId && !opts?.toEmail)
    return { success: false, error: "Destination is required" };
  if (opts?.toLocationId && opts?.toEmail)
    return {
      success: false,
      error: "Provide either location or email, not both",
    };

  if (opts?.toLocationId && !validUUID(opts.toLocationId))
    return { success: false, error: "Invalid destination location" };

  if (opts?.toEmail) {
    const email = opts.toEmail.toLowerCase().trim();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return { success: false, error: "Invalid email address" };
  }

  const supabase = await createClient();
  const rpcParams: Record<string, unknown> = {
    p_patient_id: patientId,
    p_specialty: cleanSpecialty,
    p_referral_note: cleanNote,
    p_included_visit_ids: includedVisitIds,
  };
  if (attachmentIds) rpcParams.p_included_attachment_ids = attachmentIds;
  if (opts?.toLocationId) rpcParams.p_to_location_id = opts.toLocationId;
  if (opts?.toEmail)
    rpcParams.p_to_email = opts.toEmail.toLowerCase().trim();

  const { data, error } = await supabase.rpc("create_referral", rpcParams);

  if (error) return { success: false, error: "Failed to create referral" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/doctor");
  return { success: true, referral_id: data.referral_id };
}

export async function fetchReferralInbox(
  locationId: string,
  cursor?: string
) {
  await requireAuth();
  if (!locationId || !validUUID(locationId))
    return { success: false, error: "Invalid location ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_referral_inbox", {
    p_location_id: locationId,
    p_limit: 20,
    ...(cursor ? { p_cursor: cursor } : {}),
  });

  if (error) return { success: false, error: "Failed to fetch referral inbox" };
  if (data && !data.success) return { success: false, error: data.error };

  return {
    success: true,
    referrals: data.referrals ?? [],
    has_more: data.has_more ?? false,
  };
}

export async function fetchReferralDetail(referralId: string) {
  await requireAuth();
  if (!referralId || !validUUID(referralId))
    return { success: false, error: "Invalid referral ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_referral_detail", {
    p_referral_id: referralId,
  });

  if (error)
    return { success: false, error: "Failed to fetch referral detail" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, referral: data.data.referral, visits: data.data.visits };
}

export async function fetchReferralHistory(cursor?: string) {
  await requireAuth();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Get caller's staff_user id to use as doctor_id
  const { data: staff } = await supabase
    .from("staff_users")
    .select("id")
    .eq("auth_uid", user.id)
    .eq("is_active", true)
    .eq("is_deleted", false)
    .single();

  if (!staff) return { success: false, error: "Staff user not found" };

  const { data, error } = await supabase.rpc("get_referral_history", {
    p_doctor_id: staff.id,
    p_limit: 20,
    ...(cursor ? { p_cursor: cursor } : {}),
  });

  if (error)
    return { success: false, error: "Failed to fetch referral history" };
  if (data && !data.success) return { success: false, error: data.error };

  const items = data.referrals ?? [];
  const lastItem = items.length > 0 ? items[items.length - 1] : null;
  return {
    success: true,
    referrals: items,
    has_more: data.has_more ?? false,
    next_cursor: lastItem?.created_at || null,
  };
}

export async function searchReferralInbox(
  locationId: string,
  query: string
) {
  await requireAuth();
  if (!locationId || !validUUID(locationId))
    return { success: false, error: "Invalid location ID" };

  const cleanQuery = query.trim();
  if (cleanQuery.length < 3)
    return { success: false, error: "Query must be at least 3 characters" };
  if (cleanQuery.length > 200)
    return { success: false, error: "Query too long" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_referral_inbox", {
    p_location_id: locationId,
    p_query: cleanQuery,
  });

  if (error)
    return { success: false, error: "Failed to search referral inbox" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, referrals: data.referrals ?? [] };
}

export async function linkReferralToVisit(
  referralId: string,
  visitId: string
) {
  await requireAuth();
  if (!referralId || !validUUID(referralId))
    return { success: false, error: "Invalid referral ID" };
  if (!visitId || !validUUID(visitId))
    return { success: false, error: "Invalid visit ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("link_referral_to_visit", {
    p_referral_id: referralId,
    p_visit_id: visitId,
  });

  if (error)
    return { success: false, error: "Failed to link referral to visit" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/receptionist");
  return { success: true };
}

export async function completeReferral(referralId: string) {
  await requireAuth();
  if (!referralId || !validUUID(referralId))
    return { success: false, error: "Invalid referral ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_referral", {
    p_referral_id: referralId,
  });

  if (error)
    return { success: false, error: "Failed to complete referral" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true };
}

export async function reactivateReferral(referralId: string) {
  await requireAuth();
  if (!referralId || !validUUID(referralId))
    return { success: false, error: "Invalid referral ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reactivate_referral", {
    p_referral_id: referralId,
  });

  if (error)
    return { success: false, error: "Failed to reactivate referral" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true };
}

export async function fetchReferralAnalytics(
  startDate: string,
  endDate: string
) {
  await requireAuth();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Get org id
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!org) return { success: false, error: "Organization not found" };

  // Validate date range
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0)
    return { success: false, error: "End date must be after start date" };
  if (diffDays > 90)
    return { success: false, error: "Date range cannot exceed 90 days" };

  const { data, error } = await supabase.rpc("get_referral_analytics", {
    p_org_id: org.id,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error)
    return { success: false, error: "Failed to fetch analytics" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, analytics: data.analytics };
}

export async function searchLocations(query: string) {
  await requireAuth();
  const cleanQuery = query.trim();
  if (cleanQuery.length < 2)
    return { success: false, error: "Query must be at least 2 characters" };
  if (cleanQuery.length > 200)
    return { success: false, error: "Query too long" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Get caller's org to exclude
  const { data: staff } = await supabase
    .from("staff_users")
    .select("org_id")
    .eq("auth_uid", user.id)
    .eq("is_active", true)
    .eq("is_deleted", false)
    .single();

  const excludeOrgId = staff?.org_id;
  if (!excludeOrgId) {
    // Try owner fallback
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .single();
    if (!org) return { success: false, error: "Organization not found" };

    const { data, error } = await supabase.rpc("search_locations_public", {
      p_query: cleanQuery,
      p_exclude_org_id: org.id,
    });
    if (error) return { success: false, error: "Failed to search locations" };
    if (data && !data.success) return { success: false, error: data.error };
    return { success: true, locations: data.locations ?? [] };
  }

  const { data, error } = await supabase.rpc("search_locations_public", {
    p_query: cleanQuery,
    p_exclude_org_id: excludeOrgId,
  });

  if (error) return { success: false, error: "Failed to search locations" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, locations: data.locations ?? [] };
}

export async function checkIncomingReferral(
  locationId: string,
  firstName: string,
  lastName: string,
  birthday: string
) {
  await requireAuth();
  if (!locationId || !validUUID(locationId))
    return { success: false, error: "Invalid location ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_incoming_referral", {
    p_location_id: locationId,
    p_first_name: firstName,
    p_last_name: lastName,
    p_birthday: birthday,
  });

  if (error) return { success: false, error: "Failed to check referral" };
  if (data && !data.success) return { success: false, error: data.error };

  return {
    success: true,
    has_match: data.has_match ?? false,
    referral_id: data.referral_id,
    specialty: data.specialty,
    from_org_name: data.from_org_name,
    from_doctor_name: data.from_doctor_name,
  };
}
