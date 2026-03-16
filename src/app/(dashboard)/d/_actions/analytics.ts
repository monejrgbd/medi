"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validateDate(d: string): boolean {
  if (!DATE_RE.test(d)) return false;
  const date = new Date(d);
  if (isNaN(date.getTime())) return false;
  if (date < new Date("2020-01-01")) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date > tomorrow) return false;
  return true;
}

function validateDateRange(start: string, end: string): string | null {
  if (!validateDate(start)) return "Invalid start date";
  if (!validateDate(end)) return "Invalid end date";
  if (end < start) return "End date must be after start date";
  return null;
}

export async function fetchEmployeeStats(
  locationId: string,
  startDate: string,
  endDate: string,
  staffUserId?: string
) {
  await requireAuth();
  if (!UUID_RE.test(locationId))
    return { success: false, error: "Invalid location ID" };
  if (staffUserId && !UUID_RE.test(staffUserId))
    return { success: false, error: "Invalid staff user ID" };

  const rangeErr = validateDateRange(startDate, endDate);
  if (rangeErr) return { success: false, error: rangeErr };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_employee_stats", {
    p_location_id: locationId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_staff_user_id: staffUserId || null,
  });

  if (error) return { success: false, error: error.message };
  return data;
}

export async function fetchPatientStats(
  locationId: string,
  startDate?: string,
  endDate?: string
) {
  await requireAuth();
  if (!UUID_RE.test(locationId))
    return { success: false, error: "Invalid location ID" };

  const today = new Date().toISOString().split("T")[0];
  const start = startDate || today;
  const end = endDate || today;

  const rangeError = validateDateRange(start, end);
  if (rangeError) return { success: false, error: rangeError };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_patient_stats", {
    p_location_id: locationId,
    p_start_date: start,
    p_end_date: end,
  });

  if (error) return { success: false, error: error.message };
  return data;
}

export async function fetchWaitTimeHeatmap(
  locationId: string,
  startDate: string,
  endDate: string
) {
  await requireAuth();
  if (!UUID_RE.test(locationId))
    return { success: false, error: "Invalid location ID" };

  const rangeError = validateDateRange(startDate, endDate);
  if (rangeError) return { success: false, error: rangeError };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_wait_time_heatmap", {
    p_location_id: locationId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) return { success: false, error: error.message };
  return data;
}

export async function fetchPatientReturnRate(
  orgId: string,
  startDate: string,
  endDate: string
) {
  await requireAuth();
  if (!UUID_RE.test(orgId))
    return { success: false, error: "Invalid org ID" };

  const rangeError = validateDateRange(startDate, endDate);
  if (rangeError) return { success: false, error: rangeError };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_patient_return_rate", {
    p_org_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) return { success: false, error: error.message };
  return data;
}

export async function fetchFollowUpCompliance(
  locationId: string,
  startDate: string,
  endDate: string
) {
  await requireAuth();
  if (!UUID_RE.test(locationId))
    return { success: false, error: "Invalid location ID" };

  const rangeError = validateDateRange(startDate, endDate);
  if (rangeError) return { success: false, error: rangeError };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_followup_compliance", {
    p_location_id: locationId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) return { success: false, error: error.message };
  return data;
}
