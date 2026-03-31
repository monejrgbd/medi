"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { stripHtml } from "@/lib/utils";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validUUID(id: string): boolean {
  return UUID_RE.test(id);
}

export async function approvePatient(
  visitId: string,
  followUpInfo?: { followUpOfVisitId: string; followUpId: string }
) {
  await requireAuth();
  if (!visitId || !validUUID(visitId))
    return { success: false, error: "Invalid visit ID" };
  if (followUpInfo) {
    if (!validUUID(followUpInfo.followUpOfVisitId) || !validUUID(followUpInfo.followUpId))
      return { success: false, error: "Invalid follow-up IDs" };
  }

  const supabase = await createClient();
  const rpcParams: Record<string, unknown> = { p_visit_id: visitId };
  if (followUpInfo) {
    rpcParams.p_is_follow_up = true;
    rpcParams.p_follow_up_of_visit_id = followUpInfo.followUpOfVisitId;
    rpcParams.p_follow_up_id = followUpInfo.followUpId;
  }
  const { data, error } = await supabase.rpc("approve_patient", rpcParams);

  if (error) return { success: false, error: "Failed to approve patient" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/receptionist");
  return { success: true };
}

export async function denyPatient(visitId: string) {
  await requireAuth();
  if (!visitId || !validUUID(visitId)) return { success: false, error: "Invalid visit ID" };

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
  await requireAuth();
  if (!visitId || !validUUID(visitId)) return { success: false, error: "Invalid visit ID" };

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
  await requireAuth();
  if (!visitId || !validUUID(visitId)) return { success: false, error: "Invalid visit ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("toggle_gave_tablet", {
    p_visit_id: visitId,
  });

  if (error) return { success: false, error: "Failed to toggle tablet" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, gave_tablet: data?.gave_tablet };
}

export async function handlePatient(visitId: string) {
  await requireAuth();
  if (!visitId || !validUUID(visitId)) return { success: false, error: "Invalid visit ID" };

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
  await requireAuth();
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

export async function skipAiToQueue(visitId: string) {
  await requireAuth();
  if (!visitId || !validUUID(visitId))
    return { success: false, error: "Invalid visit ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("skip_ai_to_queue", {
    p_visit_id: visitId,
  });

  if (error) return { success: false, error: "Failed to skip AI" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/receptionist");
  return { success: true };
}

export async function editPatientRecord(
  patientId: string,
  firstName?: string,
  lastName?: string,
  birthday?: string,
  sex?: string
) {
  await requireAuth();
  if (!patientId || !validUUID(patientId)) return { success: false, error: "Invalid patient ID" };

  const supabase = await createClient();
  const params: Record<string, unknown> = { p_patient_id: patientId };
  if (firstName !== undefined) params.p_first_name = stripHtml(firstName).slice(0, 100);
  if (lastName !== undefined) params.p_last_name = stripHtml(lastName).slice(0, 100);
  if (birthday !== undefined) params.p_birthday = birthday;
  if (sex !== undefined) params.p_sex = sex;

  const { data, error } = await supabase.rpc("edit_patient_record", params);

  if (error) return { success: false, error: "Failed to edit patient record" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/receptionist");
  return { success: true };
}

// --- Phase 7: Follow-ups & audit trail ---

export async function fetchActiveFollowUps(patientId: string) {
  await requireAuth();
  if (!patientId || !validUUID(patientId))
    return { success: false, error: "Invalid patient ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_active_follow_ups", {
    p_patient_id: patientId,
  });

  if (error) return { success: false, error: "Failed to fetch follow-ups" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, follow_ups: data.follow_ups };
}

export async function markFollowUpCompleted(followUpId: string) {
  await requireAuth();
  if (!followUpId || !validUUID(followUpId))
    return { success: false, error: "Invalid follow-up ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("mark_follow_up_completed", {
    p_follow_up_id: followUpId,
  });

  if (error) return { success: false, error: "Failed to mark follow-up completed" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/receptionist");
  return { success: true };
}


export async function fetchAuditTrail(
  orgId: string,
  filters?: {
    entityType?: string;
    entityId?: string;
    actorId?: string;
    startDate?: string;
    endDate?: string;
    cursorCreatedAt?: string;
    cursorId?: string;
  }
) {
  await requireAuth();
  if (!orgId || !validUUID(orgId))
    return { success: false, error: "Invalid organization ID" };

  const supabase = await createClient();
  const rpcParams: Record<string, unknown> = { p_org_id: orgId };
  if (filters?.entityType) rpcParams.p_entity_type = filters.entityType;
  if (filters?.entityId) rpcParams.p_entity_id = filters.entityId;
  if (filters?.actorId) rpcParams.p_actor_id = filters.actorId;
  if (filters?.startDate) rpcParams.p_start_date = filters.startDate;
  if (filters?.endDate) rpcParams.p_end_date = filters.endDate;
  if (filters?.cursorCreatedAt) rpcParams.p_cursor_created_at = filters.cursorCreatedAt;
  if (filters?.cursorId) rpcParams.p_cursor_id = filters.cursorId;

  const { data, error } = await supabase.rpc("get_audit_trail", rpcParams);

  if (error) return { success: false, error: "Failed to fetch audit trail" };
  if (data && !data.success) return { success: false, error: data.error };

  return {
    success: true,
    entries: data.entries,
    has_more: data.has_more,
    next_cursor_created_at: data.next_cursor_created_at,
    next_cursor_id: data.next_cursor_id,
  };
}

export async function setVisitAiOverride(visitId: string, aiModel: string | null) {
  await requireAuth();
  if (!validUUID(visitId)) return { success: false, error: "Invalid visit ID" };
  if (aiModel !== null && aiModel !== "standard" && aiModel !== "advanced")
    return { success: false, error: "Invalid AI model" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_visit_ai_override", {
    p_visit_id: visitId,
    p_ai_model: aiModel,
  });
  if (error) return { success: false, error: error.message };
  return data;
}
