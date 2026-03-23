"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { stripHtml } from "@/lib/utils";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validUUID(id: string): boolean {
  return UUID_RE.test(id);
}

export async function claimPatientAsNurse(visitId: string) {
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

  revalidatePath("/d/nurse");
  return { success: true };
}

export async function releaseToDoctor(visitId: string, nurseNotes: string) {
  await requireAuth();
  if (!visitId || !validUUID(visitId))
    return { success: false, error: "Invalid visit ID" };

  const clean = stripHtml(nurseNotes);
  if (!clean) return { success: false, error: "Nurse notes are required" };
  if (clean.length > 10000)
    return { success: false, error: "Notes exceed maximum length" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("nurse_release_to_doctor", {
    p_visit_id: visitId,
    p_nurse_notes: clean,
  });

  if (error) return { success: false, error: "Failed to release to doctor" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/nurse");
  return { success: true };
}

export async function completeVisitAsNurse(
  visitId: string,
  diagnosis: string,
  followUp?: { ai_instructions?: string },
  showDiagnosis?: boolean,
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
    p_show_diagnosis: showDiagnosis ?? true,
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

  revalidatePath("/d/nurse");
  return { success: true };
}

export async function recordVitals(data: {
  patientId: string;
  visitId: string;
  readings: Array<{ vitalConfigId: string; value: number; notes?: string }>;
}) {
  await requireAuth();
  if (!data.patientId || !validUUID(data.patientId))
    return { success: false, error: "Invalid patient ID" };
  if (!data.visitId || !validUUID(data.visitId))
    return { success: false, error: "Invalid visit ID" };
  if (!data.readings || data.readings.length === 0)
    return { success: false, error: "At least one reading is required" };

  for (const r of data.readings) {
    if (!r.vitalConfigId || !validUUID(r.vitalConfigId))
      return { success: false, error: "Invalid vital config ID" };
    if (typeof r.value !== "number" || isNaN(r.value))
      return { success: false, error: "Invalid reading value" };
  }

  const cleanReadings = data.readings.map((r) => ({
    vital_config_id: r.vitalConfigId,
    value: r.value,
    ...(r.notes ? { notes: stripHtml(r.notes).slice(0, 2000) } : {}),
  }));

  const supabase = await createClient();
  const { data: result, error } = await supabase.rpc("record_vitals", {
    p_patient_id: data.patientId,
    p_visit_id: data.visitId,
    p_readings: cleanReadings,
  });

  if (error) return { success: false, error: "Failed to record vitals" };
  if (result && !result.success) return { success: false, error: result.error };

  revalidatePath("/d/nurse");
  return { success: true };
}

export async function fetchOrgVitalConfigs() {
  await requireAuth();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_org_vital_configs");

  if (error) return { success: false, error: "Failed to fetch vital configs" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, configs: data?.configs ?? [] };
}

export async function configureOrgVitals(
  configs: Array<{
    vital_type_id?: string;
    custom_name?: string;
    custom_unit?: string;
    custom_min?: number;
    custom_max?: number;
    config_id?: string;
    enabled: boolean;
  }>
) {
  await requireAuth();
  if (!configs || configs.length === 0)
    return { success: false, error: "No configurations provided" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("configure_org_vitals", {
    p_configs: configs,
  });

  if (error) return { success: false, error: "Failed to configure vitals" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/vitals-config");
  return { success: true };
}

export async function fetchVitalTypesMasterList() {
  await requireAuth();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_vital_types_master_list");

  if (error) return { success: false, error: "Failed to fetch vital types" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, vital_types: data?.vital_types ?? [] };
}

export async function initializeOrgDefaultVitals() {
  await requireAuth();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("initialize_org_default_vitals");

  if (error) return { success: false, error: "Failed to initialize default vitals" };
  if (data && !data.success) return { success: false, error: data.error };

  revalidatePath("/d/vitals-config");
  return { success: true, count: data?.count };
}

export async function fetchVitalsHistory(patientId: string) {
  await requireAuth();
  if (!patientId || !validUUID(patientId))
    return { success: false, error: "Invalid patient ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_vitals_history", {
    p_patient_id: patientId,
  });

  if (error) return { success: false, error: "Failed to fetch vitals history" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, vitals: data?.vitals ?? [] };
}

export async function recordVaccine(data: {
  patientId: string;
  visitId: string;
  vaccineId: string;
  doseNumber?: number;
  lotNumber?: string;
  manufacturer?: string;
  site?: string;
  refused?: boolean;
  refusalReason?: string;
  notes?: string;
}) {
  await requireAuth();
  if (!data.patientId || !validUUID(data.patientId))
    return { success: false, error: "Invalid patient ID" };
  if (!data.visitId || !validUUID(data.visitId))
    return { success: false, error: "Invalid visit ID" };
  if (!data.vaccineId || !validUUID(data.vaccineId))
    return { success: false, error: "Invalid vaccine ID" };

  const supabase = await createClient();
  const { data: result, error } = await supabase.rpc("record_vaccine", {
    p_patient_id: data.patientId,
    p_visit_id: data.visitId,
    p_vaccine_id: data.vaccineId,
    ...(data.doseNumber !== undefined ? { p_dose_number: data.doseNumber } : {}),
    ...(data.lotNumber ? { p_lot_number: stripHtml(data.lotNumber).slice(0, 100) } : {}),
    ...(data.manufacturer ? { p_manufacturer: stripHtml(data.manufacturer).slice(0, 200) } : {}),
    ...(data.site ? { p_site: data.site } : {}),
    ...(data.refused !== undefined ? { p_refused: data.refused } : {}),
    ...(data.refusalReason ? { p_refusal_reason: stripHtml(data.refusalReason).slice(0, 1000) } : {}),
    ...(data.notes ? { p_notes: stripHtml(data.notes).slice(0, 2000) } : {}),
  });

  if (error) return { success: false, error: "Failed to record vaccine" };
  if (result && !result.success) return { success: false, error: result.error };

  revalidatePath("/d/nurse");
  return { success: true, id: result?.id };
}

export async function fetchVaccineHistory(patientId: string) {
  await requireAuth();
  if (!patientId || !validUUID(patientId))
    return { success: false, error: "Invalid patient ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_vaccine_history", {
    p_patient_id: patientId,
  });

  if (error) return { success: false, error: "Failed to fetch vaccine history" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, vaccines: data?.vaccines ?? [] };
}

export async function fetchVaccineSchedule(patientId: string) {
  await requireAuth();
  if (!patientId || !validUUID(patientId))
    return { success: false, error: "Invalid patient ID" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_vaccine_schedule", {
    p_patient_id: patientId,
  });

  if (error) return { success: false, error: "Failed to fetch vaccine schedule" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, schedule: data?.schedule ?? [] };
}

export async function addVaccineScheduleEntry(data: {
  patientId: string;
  vaccineId: string;
  doseNumber?: number;
  dueDate: string;
}) {
  await requireAuth();
  if (!data.patientId || !validUUID(data.patientId))
    return { success: false, error: "Invalid patient ID" };
  if (!data.vaccineId || !validUUID(data.vaccineId))
    return { success: false, error: "Invalid vaccine ID" };

  const supabase = await createClient();
  const { data: result, error } = await supabase.rpc("add_vaccine_schedule_entry", {
    p_patient_id: data.patientId,
    p_vaccine_id: data.vaccineId,
    ...(data.doseNumber !== undefined ? { p_dose_number: data.doseNumber } : {}),
    p_due_date: data.dueDate,
  });

  if (error) return { success: false, error: "Failed to add schedule entry" };
  if (result && !result.success) return { success: false, error: result.error };

  revalidatePath("/d/nurse");
  return { success: true };
}

export async function fetchVaccinesMasterList() {
  await requireAuth();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_vaccines_master_list");

  if (error) return { success: false, error: "Failed to fetch vaccines list" };
  if (data && !data.success) return { success: false, error: data.error };

  return { success: true, vaccines: data?.vaccines ?? [] };
}
