"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_PLATFORMS = [
  "google",
  "yelp",
  "healthgrades",
  "zocdoc",
  "vitals",
  "ratemds",
  "facebook",
];

interface ReviewFilters {
  dateStart?: string;
  dateEnd?: string;
  doctorId?: string;
  rating?: number;
  limit?: number;
  cursorTs?: string;
  cursorId?: string;
}

export async function fetchReviewHub(
  locationId: string,
  filters: ReviewFilters = {}
) {
  await requireAuth();
  if (!UUID_RE.test(locationId)) {
    return { success: false, error: "Invalid location ID" };
  }

  if (filters.doctorId && !UUID_RE.test(filters.doctorId)) {
    return { success: false, error: "Invalid doctor ID" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_review_hub", {
    p_location_id: locationId,
    p_date_start: filters.dateStart || null,
    p_date_end: filters.dateEnd || null,
    p_doctor_id: filters.doctorId || null,
    p_rating: filters.rating || null,
    p_limit: filters.limit || 50,
    p_cursor_ts: filters.cursorTs || null,
    p_cursor_id: filters.cursorId || null,
  });

  if (error) return { success: false, error: error.message };
  return data;
}

export async function fetchReviewPlatforms(locationId: string) {
  await requireAuth();
  if (!UUID_RE.test(locationId)) {
    return { success: false, error: "Invalid location ID" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_review_platforms", {
    p_location_id: locationId,
  });

  if (error) return { success: false, error: error.message };
  return data;
}

export async function saveReviewPlatforms(
  locationId: string,
  platforms: { platform_name: string; platform_url: string }[]
) {
  await requireAuth();
  if (!UUID_RE.test(locationId)) {
    return { success: false, error: "Invalid location ID" };
  }

  // Validate each platform
  for (const p of platforms) {
    if (!VALID_PLATFORMS.includes(p.platform_name)) {
      return { success: false, error: `Invalid platform: ${p.platform_name}` };
    }
    if (!p.platform_url || !p.platform_url.startsWith("https://")) {
      return {
        success: false,
        error: "Platform URL must start with https://",
      };
    }
    if (p.platform_url.length > 500) {
      return { success: false, error: "Platform URL must be under 500 characters" };
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("configure_review_platforms", {
    p_location_id: locationId,
    p_platforms: platforms,
  });

  if (error) return { success: false, error: error.message };
  return data;
}

export async function saveReviewCycle(locationId: string, cycleDays: number, redirectMinRating: number = 5) {
  await requireAuth();
  if (!UUID_RE.test(locationId)) {
    return { success: false, error: "Invalid location ID" };
  }

  const clamped = Math.max(1, Math.min(cycleDays, 90));
  const clampedRating = Math.max(1, Math.min(Math.round(redirectMinRating), 5));

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_review_cycle", {
    p_location_id: locationId,
    p_cycle_days: clamped,
    p_redirect_min_rating: clampedRating,
  });

  if (error) return { success: false, error: error.message };
  return data;
}
