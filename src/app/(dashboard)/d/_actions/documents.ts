"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validUUID(id: string): boolean {
  return UUID_RE.test(id);
}

const VALID_TEMPLATE_KEY = /^[a-z0-9_-]{1,100}$/;
const VALID_PHYSICAL_EXAM_MODES = ["voice", "buttons", "text"] as const;

export async function createDocument(
  visitId: string | null,
  patientId: string,
  locationId: string,
  templateKey: string,
  inputFields?: Record<string, unknown>
) {
  await requireAuth();
  if (visitId !== null && !validUUID(visitId))
    return { success: false, error: "Invalid visit ID" };
  if (!patientId || !validUUID(patientId))
    return { success: false, error: "Invalid patient ID" };
  if (!locationId || !validUUID(locationId))
    return { success: false, error: "Invalid location ID" };
  if (!templateKey || !VALID_TEMPLATE_KEY.test(templateKey))
    return { success: false, error: "Invalid template key" };

  const supabase = await createClient();
  const rpcParams: Record<string, unknown> = {
    p_patient_id: patientId,
    p_location_id: locationId,
    p_template_key: templateKey,
  };
  if (visitId) rpcParams.p_visit_id = visitId;
  if (inputFields) rpcParams.p_input_fields = inputFields;

  const { data, error } = await supabase.rpc("create_document", rpcParams);

  if (error) return { success: false, error: "Failed to create document" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/doctor");
  return { success: true, document_id: data.document_id };
}

export async function draftDocumentContent(documentId: string) {
  await requireAuth();
  if (!documentId || !validUUID(documentId))
    return { success: false, error: "Invalid document ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("draft_document_content", {
    p_document_id: documentId,
  });

  if (error)
    return { success: false, error: "Failed to draft document content" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, data };
}

export async function saveDocumentEdit(
  documentId: string,
  contentBody: string
) {
  await requireAuth();
  if (!documentId || !validUUID(documentId))
    return { success: false, error: "Invalid document ID" };
  if (!contentBody || contentBody.length === 0)
    return { success: false, error: "Content body is required" };
  if (contentBody.length > 100000)
    return { success: false, error: "Content body too long" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_document_edit", {
    p_document_id: documentId,
    p_content_body: contentBody,
  });

  if (error) return { success: false, error: "Failed to save document edit" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true };
}

export async function savePhysicalExam(
  documentId: string,
  physicalExamRaw: string,
  physicalExamMode: "voice" | "buttons" | "text"
) {
  await requireAuth();
  if (!documentId || !validUUID(documentId))
    return { success: false, error: "Invalid document ID" };
  if (!physicalExamRaw || physicalExamRaw.length === 0)
    return { success: false, error: "Physical exam data is required" };
  if (physicalExamRaw.length > 50000)
    return { success: false, error: "Physical exam data too long" };
  if (!VALID_PHYSICAL_EXAM_MODES.includes(physicalExamMode))
    return { success: false, error: "Invalid physical exam mode" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_physical_exam", {
    p_document_id: documentId,
    p_physical_exam_raw: physicalExamRaw,
    p_physical_exam_mode: physicalExamMode,
  });

  if (error) return { success: false, error: "Failed to save physical exam" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true };
}

export async function signAndDeliverDocument(
  documentId: string,
  contentBody: string,
  deliveryChannels?: string[]
) {
  await requireAuth();
  if (!documentId || !validUUID(documentId))
    return { success: false, error: "Invalid document ID" };
  if (!contentBody || contentBody.length === 0)
    return { success: false, error: "Content body is required" };
  if (contentBody.length > 100000)
    return { success: false, error: "Content body too long" };
  if (deliveryChannels) {
    if (deliveryChannels.length > 10)
      return { success: false, error: "Too many delivery channels" };
    if (deliveryChannels.some((c) => typeof c !== "string" || c.length > 50))
      return { success: false, error: "Invalid delivery channel" };
  }

  const supabase = await createClient();
  const rpcParams: Record<string, unknown> = {
    p_document_id: documentId,
    p_content_body: contentBody,
  };
  if (deliveryChannels) rpcParams.p_delivery_channels = deliveryChannels;

  const { data, error } = await supabase.rpc("sign_document", rpcParams);

  if (error)
    return { success: false, error: "Failed to sign and deliver document" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/doctor");
  return { success: true };
}

export async function voidDocument(documentId: string, reason: string) {
  await requireAuth();
  if (!documentId || !validUUID(documentId))
    return { success: false, error: "Invalid document ID" };
  if (!reason || reason.trim().length === 0)
    return { success: false, error: "Reason is required" };
  if (reason.length > 1000)
    return { success: false, error: "Reason too long" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("void_document", {
    p_document_id: documentId,
    p_reason: reason.trim(),
  });

  if (error) return { success: false, error: "Failed to void document" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/doctor");
  return { success: true };
}

export async function fetchDocumentForStaff(documentId: string) {
  await requireAuth();
  if (!documentId || !validUUID(documentId))
    return { success: false, error: "Invalid document ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_document_for_staff", {
    p_document_id: documentId,
  });

  if (error) return { success: false, error: "Failed to fetch document" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, document: data.document ?? data };
}

export async function fetchDocumentsForVisit(visitId: string) {
  await requireAuth();
  if (!visitId || !validUUID(visitId))
    return { success: false, error: "Invalid visit ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_documents_for_visit", {
    p_visit_id: visitId,
  });

  if (error)
    return { success: false, error: "Failed to fetch documents for visit" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, documents: data.documents ?? [] };
}

export async function fetchDocumentsForPatient(patientId: string) {
  await requireAuth();
  if (!patientId || !validUUID(patientId))
    return { success: false, error: "Invalid patient ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_documents_for_patient", {
    p_patient_id: patientId,
  });

  if (error)
    return { success: false, error: "Failed to fetch documents for patient" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, documents: data.documents ?? [] };
}

export async function fetchPendingDocumentApprovals() {
  await requireAuth();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "list_pending_document_approvals"
  );

  if (error)
    return { success: false, error: "Failed to fetch pending approvals" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, approvals: data.approvals ?? [] };
}

export async function requestDocumentAsReceptionist(
  visitId: string,
  patientId: string,
  locationId: string,
  templateKey: string,
  inputFields?: Record<string, unknown>
) {
  await requireAuth();
  if (!visitId || !validUUID(visitId))
    return { success: false, error: "Invalid visit ID" };
  if (!patientId || !validUUID(patientId))
    return { success: false, error: "Invalid patient ID" };
  if (!locationId || !validUUID(locationId))
    return { success: false, error: "Invalid location ID" };
  if (!templateKey || !VALID_TEMPLATE_KEY.test(templateKey))
    return { success: false, error: "Invalid template key" };

  const supabase = await createClient();
  const rpcParams: Record<string, unknown> = {
    p_visit_id: visitId,
    p_patient_id: patientId,
    p_location_id: locationId,
    p_template_key: templateKey,
  };
  if (inputFields) rpcParams.p_input_fields = inputFields;

  const { data, error } = await supabase.rpc(
    "request_document_as_receptionist",
    rpcParams
  );

  if (error) return { success: false, error: "Failed to request document" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/receptionist");
  return { success: true, document_id: data.document_id };
}

export async function fetchDocumentTemplates() {
  await requireAuth();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_templates")
    .select("*")
    .eq("active", true);

  if (error)
    return { success: false, error: "Failed to fetch document templates" };

  return { success: true, templates: data ?? [] };
}
