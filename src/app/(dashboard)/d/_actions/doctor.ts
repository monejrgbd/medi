"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { stripHtml } from "@/lib/utils";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validUUID(id: string): boolean {
  return UUID_RE.test(id);
}

export async function claimPatient(visitId: string) {
  await requireAuth();
  if (!visitId || !validUUID(visitId))
    return { success: false, error: "Invalid visit ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_patient", {
    p_visit_id: visitId,
  });

  if (error) return { success: false, error: "Failed to claim patient" };
  if (data && !data.success)
    return {
      success: false,
      error: data.error,
      already_claimed: data.already_claimed,
      claimed_by_name: data.claimed_by_name,
    };

  revalidatePath("/d/doctor");
  return { success: true };
}

export async function cancelClaim(visitId: string) {
  await requireAuth();
  if (!visitId || !validUUID(visitId))
    return { success: false, error: "Invalid visit ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_claim", {
    p_visit_id: visitId,
  });

  if (error) return { success: false, error: "Failed to cancel claim" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/doctor");
  return { success: true };
}

export async function completeVisit(
  visitId: string,
  diagnosis: string,
  followUp?: { ai_instructions?: string },
  showDiagnosis: boolean = true,
  careInstructions?: string
) {
  await requireAuth();
  if (!visitId || !validUUID(visitId))
    return { success: false, error: "Invalid visit ID" };

  const clean = stripHtml(diagnosis);
  if (!clean) return { success: false, error: "Diagnosis is required" };
  if (clean.length > 10000)
    return { success: false, error: "Diagnosis exceeds maximum length" };

  const supabase = await createClient();

  const rpcParams: Record<string, unknown> = {
    p_visit_id: visitId,
    p_diagnosis: clean,
    p_show_diagnosis: showDiagnosis,
  };
  if (followUp) {
    rpcParams.p_follow_up = {
      ai_instructions: followUp.ai_instructions
        ? stripHtml(followUp.ai_instructions).slice(0, 2000)
        : undefined,
    };
  }
  if (careInstructions) {
    const cleanCare = stripHtml(careInstructions).slice(0, 10000);
    if (cleanCare) rpcParams.p_care_instructions = cleanCare;
  }

  const { data, error } = await supabase.rpc("complete_visit", rpcParams);

  if (error) return { success: false, error: "Failed to complete visit" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/doctor");
  return { success: true };
}

export async function fetchVisitDetail(visitId: string) {
  await requireAuth();
  if (!visitId || !validUUID(visitId))
    return { success: false, error: "Invalid visit ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_visit_detail", {
    p_visit_id: visitId,
  });

  if (error) return { success: false, error: "Failed to fetch visit detail" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, data: data.data };
}

export async function fetchPatientProfile(patientId: string) {
  await requireAuth();
  if (!patientId || !validUUID(patientId))
    return { success: false, error: "Invalid patient ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_patient_profile", {
    p_patient_id: patientId,
  });

  if (error)
    return { success: false, error: "Failed to fetch patient profile" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, patient: data.patient };
}

export async function fetchPatientHistory(
  patientId: string,
  cursor?: string
) {
  await requireAuth();
  if (!patientId || !validUUID(patientId))
    return { success: false, error: "Invalid patient ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_patient_visit_history", {
    p_patient_id: patientId,
    p_limit: 20,
    ...(cursor ? { p_cursor: cursor } : {}),
  });

  if (error)
    return { success: false, error: "Failed to fetch patient history" };
  if (data && !data.success) return { success: false, error: data.error };

  return {
    success: true,
    visits: data.visits,
    has_more: data.has_more,
    next_cursor: data.next_cursor,
  };
}

export async function addVisitNote(
  visitId: string,
  content: string,
  isPrivate?: boolean
) {
  await requireAuth();
  if (!visitId || !validUUID(visitId))
    return { success: false, error: "Invalid visit ID" };

  const clean = stripHtml(content);
  if (!clean || clean.length === 0)
    return { success: false, error: "Note content is required" };
  if (clean.length > 10000)
    return { success: false, error: "Note exceeds maximum length" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_visit_note", {
    p_visit_id: visitId,
    p_content: clean,
    ...(isPrivate !== undefined ? { p_is_private: isPrivate } : {}),
  });

  if (error) return { success: false, error: "Failed to add visit note" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, note_id: data.note_id, is_private: data.is_private };
}

export async function addPatientNote(
  patientId: string,
  content: string,
  isPrivate?: boolean
) {
  await requireAuth();
  if (!patientId || !validUUID(patientId))
    return { success: false, error: "Invalid patient ID" };

  const clean = stripHtml(content);
  if (!clean || clean.length === 0)
    return { success: false, error: "Note content is required" };
  if (clean.length > 10000)
    return { success: false, error: "Note exceeds maximum length" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_patient_note", {
    p_patient_id: patientId,
    p_content: clean,
    ...(isPrivate !== undefined ? { p_is_private: isPrivate } : {}),
  });

  if (error) return { success: false, error: "Failed to add patient note" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, note_id: data.note_id, is_private: data.is_private };
}

export async function updateNotePreference(
  patientId: string,
  defaultPrivate: boolean
) {
  await requireAuth();
  if (!patientId || !validUUID(patientId))
    return { success: false, error: "Invalid patient ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_note_preference", {
    p_patient_id: patientId,
    p_default_private: defaultPrivate,
  });

  if (error)
    return { success: false, error: "Failed to update note preference" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true };
}

export async function uploadAttachment(visitId: string, formData: FormData) {
  await requireAuth();
  if (!visitId || !validUUID(visitId))
    return { success: false, error: "Invalid visit ID" };

  const file = formData.get("file") as File;
  if (!file) return { success: false, error: "No file provided" };
  if (file.size === 0) return { success: false, error: "File is empty" };
  if (file.size > 10485760)
    return { success: false, error: "File exceeds 10MB limit" };

  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowedMimeTypes.includes(file.type))
    return { success: false, error: "File type not allowed" };

  const sanitizedFilename = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 255);

  const supabase = await createClient();

  const { data: visitData, error: visitError } = await supabase
    .from("visits")
    .select("org_id")
    .eq("id", visitId)
    .single();

  if (visitError || !visitData)
    return { success: false, error: "Visit not found" };

  const orgId = visitData.org_id;
  const path = `${orgId}/${visitId}/${crypto.randomUUID()}-${sanitizedFilename}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(path, file);

  if (uploadError)
    return { success: false, error: "Failed to upload file" };

  const { data, error } = await supabase.rpc("upload_attachment", {
    p_visit_id: visitId,
    p_file_url: path,
    p_file_name: sanitizedFilename,
    p_mime_type: file.type,
    p_file_size: file.size,
  });

  if (error) {
    await supabase.storage.from("attachments").remove([path]);
    return { success: false, error: "Failed to record attachment" };
  }
  if (data && !data.success) {
    await supabase.storage.from("attachments").remove([path]);
    return { success: false, error: data.error };
  }

  // Generate signed URL for immediate use
  const { data: signedData } = await supabase.storage
    .from("attachments")
    .createSignedUrl(path, 3600);

  return {
    success: true,
    attachment_id: data.attachment_id,
    file_url: path,
    signed_url: signedData?.signedUrl || null,
  };
}

export async function fetchVisitNotes(visitId: string) {
  await requireAuth();
  if (!visitId || !validUUID(visitId))
    return { success: false, error: "Invalid visit ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_notes_for_visit", {
    p_visit_id: visitId,
  });

  if (error)
    return { success: false, error: "Failed to fetch visit notes" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, notes: data.notes };
}

export async function fetchPatientNotes(
  patientId: string,
  cursor?: string
) {
  await requireAuth();
  if (!patientId || !validUUID(patientId))
    return { success: false, error: "Invalid patient ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_notes_for_patient", {
    p_patient_id: patientId,
    p_limit: 30,
    ...(cursor ? { p_cursor: cursor } : {}),
  });

  if (error)
    return { success: false, error: "Failed to fetch patient notes" };
  if (data && !data.success) return { success: false, error: data.error };

  return {
    success: true,
    notes: data.notes,
    has_more: data.has_more,
    next_cursor: data.next_cursor,
  };
}

export async function fetchVisitAttachments(visitId: string) {
  await requireAuth();
  if (!visitId || !validUUID(visitId))
    return { success: false, error: "Invalid visit ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_visit_attachments", {
    p_visit_id: visitId,
  });

  if (error)
    return { success: false, error: "Failed to fetch attachments" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, attachments: data.attachments };
}

const ATTACHMENT_PATH_RE = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[a-zA-Z0-9._-]+$/;

export async function fetchAttachmentUrl(filePath: string) {
  await requireAuth();
  if (!filePath) return { success: false, error: "No file path" };
  if (!ATTACHMENT_PATH_RE.test(filePath))
    return { success: false, error: "Invalid file path format" };

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUrl(filePath, 3600);

  if (error || !data?.signedUrl)
    return { success: false, error: "Failed to generate download URL" };

  return { success: true, url: data.signedUrl };
}

export async function fetchPatientMedicalRecords(patientId: string) {
  await requireAuth();
  if (!patientId || !validUUID(patientId))
    return { success: false, error: "Invalid patient ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_patient_medical_records", {
    p_patient_id: patientId,
  });

  if (error)
    return { success: false, error: "Failed to fetch medical records" };
  if (data && !data.success) return { success: false, error: data.error };

  supabase.rpc("log_phi_access", { p_entity_type: "patient", p_entity_id: patientId }).then(() => {}, () => {});
  return {
    success: true,
    medications: data.medications,
    allergies: data.allergies,
    chronic_conditions: data.chronic_conditions,
  };
}

export async function fetchQueue(locationId: string) {
  await requireAuth();
  if (!locationId || !validUUID(locationId))
    return { success: false, error: "Invalid location ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_queue", {
    p_location_id: locationId,
  });

  if (error) return { success: false, error: "Failed to fetch queue" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, queue: data.queue || [] };
}
