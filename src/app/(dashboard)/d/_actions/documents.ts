"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth, isOwner, getMyOrg } from "@/lib/auth";
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

/* ── Owner: Clinician & Letterhead Settings ──────────── */

function sanitizeText(val: string, maxLen: number): string {
  return val.replace(/<[^>]*>/g, "").trim().slice(0, maxLen);
}

export async function updateClinicianInfo(formData: {
  licenseNumber: string;
  npi: string;
  credentials: string;
}) {
  const user = await requireAuth();
  const ownerCheck = await isOwner(user.id);
  if (!ownerCheck) return { success: false, error: "Not authorized" };

  const org = await getMyOrg();
  if (!org?.id) return { success: false, error: "Organization not found" };

  const licenseNumber = sanitizeText(formData.licenseNumber, 50);
  const npi = sanitizeText(formData.npi, 20);
  const credentials = sanitizeText(formData.credentials, 30);

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      clinician_license_number: licenseNumber || null,
      clinician_npi: npi || null,
      clinician_credentials: credentials || null,
    })
    .eq("id", org.id);

  if (error) return { success: false, error: "Failed to update clinician info" };

  revalidatePath("/d/owner/templates");
  return { success: true };
}

export async function uploadClinicianSignature(formData: FormData) {
  const user = await requireAuth();
  const ownerCheck = await isOwner(user.id);
  if (!ownerCheck) return { success: false, error: "Not authorized" };

  const file = formData.get("file") as File | null;
  if (!file) return { success: false, error: "No file provided" };

  if (file.type !== "image/png") {
    return { success: false, error: "File must be a PNG image" };
  }

  if (file.size > 500 * 1024) {
    return { success: false, error: "File must be under 500KB" };
  }

  const org = await getMyOrg();
  if (!org?.id) return { success: false, error: "Organization not found" };

  const supabase = await createClient();
  const path = `${org.id}/clinician-signature.png`;

  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(path, file, { upsert: true });

  if (uploadError) return { success: false, error: "Failed to upload signature" };

  const { data: urlData } = supabase.storage
    .from("logos")
    .getPublicUrl(path);

  const signatureUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  const { error } = await supabase
    .from("organizations")
    .update({ clinician_signature_url: signatureUrl })
    .eq("id", org.id);

  if (error) return { success: false, error: "Failed to save signature URL" };

  revalidatePath("/d/owner/templates");
  return { success: true, signatureUrl };
}

export async function updateLetterhead(formData: {
  disclaimer: string;
}) {
  const user = await requireAuth();
  const ownerCheck = await isOwner(user.id);
  if (!ownerCheck) return { success: false, error: "Not authorized" };

  const org = await getMyOrg();
  if (!org?.id) return { success: false, error: "Organization not found" };

  const disclaimer = sanitizeText(formData.disclaimer, 500);

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      letterhead_disclaimer: disclaimer || null,
    })
    .eq("id", org.id);

  if (error) return { success: false, error: "Failed to update letterhead" };

  revalidatePath("/d/owner/templates");
  return { success: true };
}

export async function uploadLetterheadLogo(formData: FormData) {
  const user = await requireAuth();
  const ownerCheck = await isOwner(user.id);
  if (!ownerCheck) return { success: false, error: "Not authorized" };

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
  const path = `${org.id}/letterhead-logo`;

  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(path, file, { upsert: true });

  if (uploadError) return { success: false, error: "Failed to upload logo" };

  const { data: urlData } = supabase.storage
    .from("logos")
    .getPublicUrl(path);

  const logoUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  const { error } = await supabase
    .from("organizations")
    .update({ letterhead_logo_url: logoUrl })
    .eq("id", org.id);

  if (error) return { success: false, error: "Failed to save letterhead logo" };

  revalidatePath("/d/owner/templates");
  return { success: true, logoUrl };
}
