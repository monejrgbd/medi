"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { stripHtml } from "@/lib/utils";

export async function approvePatient(visitId: string) {
  if (!visitId) return { success: false, error: "Visit ID required" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("approve_patient", {
    p_visit_id: visitId,
  });

  if (error) return { success: false, error: "Failed to approve patient" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/receptionist");
  return { success: true };
}

export async function denyPatient(visitId: string) {
  if (!visitId) return { success: false, error: "Visit ID required" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("deny_patient", {
    p_visit_id: visitId,
  });

  if (error) return { success: false, error: "Failed to deny patient" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/receptionist");
  return { success: true };
}

export async function markPatientLeft(visitId: string) {
  if (!visitId) return { success: false, error: "Visit ID required" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("mark_patient_left", {
    p_visit_id: visitId,
  });

  if (error) return { success: false, error: "Failed to mark patient as left" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/receptionist");
  return { success: true };
}

export async function toggleGaveTablet(visitId: string) {
  if (!visitId) return { success: false, error: "Visit ID required" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("toggle_gave_tablet", {
    p_visit_id: visitId,
  });

  if (error) return { success: false, error: "Failed to toggle tablet" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, gave_tablet: data?.gave_tablet };
}

export async function handlePatient(visitId: string) {
  if (!visitId) return { success: false, error: "Visit ID required" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("handle_patient", {
    p_visit_id: visitId,
  });

  if (error) return { success: false, error: "Failed to handle patient" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/receptionist");
  return { success: true };
}

export async function fetchSimilarPatients(
  orgId: string,
  firstName: string,
  lastName: string,
  birthday: string
) {
  const cleanFirst = stripHtml(firstName).slice(0, 100);
  const cleanLast = stripHtml(lastName).slice(0, 100);

  if (!orgId || !cleanFirst || !cleanLast || !birthday) {
    return { success: false, error: "All fields required" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_similar_patients", {
    p_org_id: orgId,
    p_first_name: cleanFirst,
    p_last_name: cleanLast,
    p_birthday: birthday,
  });

  if (error) return { success: false, error: "Failed to fetch similar patients" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, patients: data?.patients ?? [] };
}
