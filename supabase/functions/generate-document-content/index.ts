// Internal function — deploy with --no-verify-jwt
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadPlanConfig, getAdapter, pickPlanTaskCall, aiModelToTier } from "../_ai-providers/index.ts";

const INTERNAL_SECRET = Deno.env.get("INTERNAL_EDGE_SECRET");

interface DocumentRow {
  id: string;
  org_id: string;
  location_id: string;
  visit_id: string | null;
  patient_id: string;
  template_key: string;
  input_fields: Record<string, unknown>;
  physical_exam_raw: string | null;
  scribe_transcript: string | null;
  status: string;
  created_by: string;
}

interface TemplateRow {
  key: string;
  prompt_template: string;
  render_template: string;
  ai_output_schema: Record<string, unknown>;
  ai_model_override: string | null;
}

/**
 * Replace {placeholder} tokens in a template string with values from a map.
 * Unmatched placeholders are replaced with empty string.
 */
function replacePlaceholders(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key) => {
    return values[key] ?? "";
  });
}

Deno.serve(async (req) => {
  try {
    // Validate internal secret
    const secret = req.headers.get("x-internal-secret");
    if (!secret || secret !== INTERNAL_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { document_id } = await req.json();
    if (!document_id) {
      return new Response(JSON.stringify({ error: "Missing document_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Load the document
    const { data: doc, error: docError } = await supabase
      .from("clinical_documents")
      .select("id, org_id, location_id, visit_id, patient_id, template_key, input_fields, physical_exam_raw, scribe_transcript, status, created_by")
      .eq("id", document_id)
      .single();

    if (docError || !doc) {
      console.error("Document not found:", document_id, docError);
      return new Response(JSON.stringify({ success: false, error: "Document not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const document = doc as DocumentRow;

    // Verify document is in drafting state (set by the SQL function that called us)
    if (document.status !== "drafting") {
      return new Response(JSON.stringify({ success: false, error: "Document is not in drafting state" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Load the template
    const { data: tmpl, error: tmplError } = await supabase
      .from("document_templates")
      .select("key, prompt_template, render_template, ai_output_schema, ai_model_override")
      .eq("key", document.template_key)
      .single();

    if (tmplError || !tmpl) {
      console.error("Template not found:", document.template_key, tmplError);
      await markFailed(supabase, document_id);
      return new Response(JSON.stringify({ success: false, error: "Template not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const template = tmpl as TemplateRow;

    // 3. Load visit context in parallel
    const [
      patientRes,
      visitRes,
      orgRes,
      locationRes,
      creatorRes,
      vitalsRes,
      medicationsRes,
      allergiesRes,
      chronicRes,
      doctorNotesRes,
      followUpsRes,
    ] = await Promise.all([
      // Patient
      supabase
        .from("patients")
        .select("first_name, last_name, birthday, language")
        .eq("id", document.patient_id)
        .single(),
      // Visit (may be null for non-visit documents)
      document.visit_id
        ? supabase
            .from("visits")
            .select("doctor_diagnosis, ai_summary, care_instructions, nurse_notes, claimed_by, created_at, ai_model_override")
            .eq("id", document.visit_id)
            .single()
        : Promise.resolve({ data: null, error: null }),
      // Organization name + plan (plan drives document model selection via ai_plan_config)
      supabase
        .from("organizations")
        .select("name, subscription_plan, credits_total, credits_used")
        .eq("id", document.org_id)
        .single(),
      // Location name
      supabase
        .from("locations")
        .select("name, ai_model")
        .eq("id", document.location_id)
        .single(),
      // Creator (doctor) name
      supabase
        .from("staff_users")
        .select("full_name")
        .eq("id", document.created_by)
        .single(),
      // Vitals: join through org_vital_configs to get vital_type name/unit
      supabase
        .from("patient_vitals")
        .select("value, notes, measured_at, vital_config:org_vital_configs(vital_type:vital_types(name, unit), custom_name, custom_unit)")
        .eq("patient_id", document.patient_id)
        .eq("visit_id", document.visit_id ?? "00000000-0000-0000-0000-000000000000")
        .order("measured_at", { ascending: false })
        .limit(20),
      // Active medications
      supabase
        .from("patient_medications")
        .select("name")
        .eq("patient_id", document.patient_id)
        .eq("active", true),
      // Active allergies
      supabase
        .from("patient_allergies")
        .select("name")
        .eq("patient_id", document.patient_id)
        .eq("active", true),
      // Active chronic conditions
      supabase
        .from("patient_chronic_conditions")
        .select("name")
        .eq("patient_id", document.patient_id)
        .eq("active", true),
      // Doctor notes for the visit
      document.visit_id
        ? supabase
            .from("visit_notes")
            .select("content, is_private, created_at")
            .eq("visit_id", document.visit_id)
            .eq("is_private", false)
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
      // Follow-ups for the visit
      document.visit_id
        ? supabase
            .from("follow_ups")
            .select("timeframe_days, ai_instructions, status")
            .eq("visit_id", document.visit_id)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const patient = patientRes.data;
    const visit = visitRes.data;
    const org = orgRes.data;
    const location = locationRes.data;
    const creator = creatorRes.data;

    // Build formatted strings for placeholders
    const patientName = patient
      ? `${patient.first_name} ${patient.last_name}`
      : "Unknown Patient";
    const patientDob = patient?.birthday || "Unknown";
    const visitDate = visit?.created_at
      ? new Date(visit.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
    const diagnosis = visit?.doctor_diagnosis || "Not yet determined";
    const doctorName = creator?.full_name || "Treating Physician";
    const clinicName = org?.name || "Clinic";

    // Format medications
    const medications = (medicationsRes.data || [])
      .map((m: { name: string }) => m.name)
      .join(", ") || "None reported";

    // Format allergies
    const allergies = (allergiesRes.data || [])
      .map((a: { name: string }) => a.name)
      .join(", ") || "None reported";

    // Format chronic conditions
    const chronicConditions = (chronicRes.data || [])
      .map((c: { name: string }) => c.name)
      .join(", ") || "None reported";

    // Format vitals
    const vitals = (vitalsRes.data || [])
      .map((v: { value: number; vital_config: { vital_type: { name: string; unit: string } | null; custom_name: string | null; custom_unit: string | null } | null }) => {
        const name = v.vital_config?.custom_name || v.vital_config?.vital_type?.name || "Unknown";
        const unit = v.vital_config?.custom_unit || v.vital_config?.vital_type?.unit || "";
        return `${name}: ${v.value}${unit ? " " + unit : ""}`;
      })
      .join(", ") || "Not recorded";

    // Format doctor notes
    const doctorNotes = (doctorNotesRes.data || [])
      .map((n: { content: string }) => n.content)
      .join("\n") || "None";

    // Format follow-up instructions
    const followUpInstructions = (followUpsRes.data || [])
      .map((f: { timeframe_days: number | null; ai_instructions: string | null }) => {
        const days = f.timeframe_days ? `Follow up in ${f.timeframe_days} days` : "Follow up as needed";
        return f.ai_instructions ? `${days}: ${f.ai_instructions}` : days;
      })
      .join("\n") || "None";

    // Load transcript (visit messages) if there is a visit
    let transcriptSummary = "No conversation transcript available";
    let chiefComplaint = "Not specified";

    if (document.visit_id) {
      const { data: messagesData } = await supabase
        .from("visit_messages")
        .select("role, content")
        .eq("visit_id", document.visit_id)
        .neq("role", "system")
        .order("created_at", { ascending: true })
        .limit(50);

      if (messagesData && messagesData.length > 0) {
        const transcript = messagesData
          .map((m: { role: string; content: string }) =>
            `${m.role === "patient" ? "Patient" : "AI"}: ${m.content}`
          )
          .join("\n\n");
        transcriptSummary = transcript.substring(0, 3000);

        // Chief complaint: first patient message
        const firstPatient = messagesData.find(
          (m: { role: string }) => m.role === "patient"
        );
        if (firstPatient) {
          chiefComplaint = (firstPatient as { content: string }).content.substring(0, 500);
        }
      }
    }

    // Resolve doctor name from claimed_by if visit has a claiming doctor
    let visitDoctorName = doctorName;
    if (visit?.claimed_by) {
      const { data: claimDoc } = await supabase
        .from("staff_users")
        .select("full_name")
        .eq("id", visit.claimed_by)
        .single();
      if (claimDoc?.full_name) {
        visitDoctorName = claimDoc.full_name;
      }
    }

    // 5. Build the system prompt from template, replacing placeholders
    const placeholders: Record<string, string> = {
      patient_name: patientName,
      patient_dob: patientDob,
      visit_date: visitDate,
      diagnosis: diagnosis,
      doctor_name: visitDoctorName,
      clinic_name: clinicName,
      current_medications: medications,
      allergies: allergies,
      chronic_conditions: chronicConditions,
      vitals: vitals,
      transcript_summary: transcriptSummary,
      care_instructions: visit?.care_instructions || "None specified",
      doctor_notes: doctorNotes,
      follow_up_instructions: followUpInstructions,
      physical_exam_raw: document.physical_exam_raw || "Not performed",
      encounter_transcript: document.scribe_transcript || "No ambient encounter recording",
      chief_complaint: chiefComplaint,
    };

    // Merge input_fields into placeholders (e.g. days_off, include_diagnosis, etc.)
    if (document.input_fields && typeof document.input_fields === "object") {
      for (const [key, value] of Object.entries(document.input_fields)) {
        placeholders[key] = String(value ?? "");
      }
    }

    const systemPrompt = replacePlaceholders(template.prompt_template, placeholders);

    // 6. Load plan-based AI config and call adapter
    const subscriptionPlan = orgRes.data?.subscription_plan || "pay_as_you_go";

    // Paperwork billing tier = the clinic's configured AI tier (same lever as
    // scribe), resolved from the visit override then the location default.
    const tier = aiModelToTier(visit?.ai_model_override ?? location?.ai_model);
    const docRate =
      tier === "advanced" ? 0.3 : tier === "precision" || tier === "premium" ? 0.5 : 0.2;

    // Preflight (metered plans only): refuse BEFORE the expensive AI call if
    // the org cannot afford one document. Subscription plans are plan_included
    // and skip this. Mirrors deduct_scribe_credits / deduct_document_credits
    // plan partitioning. The actual deduction is still the idempotent
    // post-success call below.
    const meteredPlan = !["starter", "professional", "business", "enterprise"].includes(
      subscriptionPlan
    );
    if (meteredPlan) {
      const remaining =
        (orgRes.data?.credits_total ?? 0) - (orgRes.data?.credits_used ?? 0);
      if (remaining < docRate) {
        await markFailed(supabase, document_id);
        return new Response(
          JSON.stringify({ success: false, error: "insufficient_credits" }),
          { status: 402, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const planConfig = await loadPlanConfig(supabase, subscriptionPlan);
    const docCall = pickPlanTaskCall(planConfig, "document");
    const adapter = getAdapter(docCall.provider, supabase);

    const userMessage =
      "Generate the document content following the output schema strictly. Return valid JSON only.";

    let parsed: Record<string, unknown>;
    let aiInputTokens = 0;
    let aiOutputTokens = 0;
    try {
      const result = await adapter.structuredOutput({
        call: docCall,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });
      parsed = result.json as Record<string, unknown>;
      aiInputTokens = result.usage?.input_tokens ?? 0;
      aiOutputTokens = result.usage?.output_tokens ?? 0;
    } catch (err) {
      console.error("AI call failed for document:", document_id, err);
      await markFailed(supabase, document_id);
      return new Response(
        JSON.stringify({ success: false, error: `AI generation failed: ${(err as Error).message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 7. Render content_body from render_template by substituting AI output fields
    // Flatten the AI JSON so BOTH flat templates (letters: top-level
    // {letter_body}) and nested templates (SOAP: {hpi}, {physical_exam},
    // {primary_dx} live under subjective/objective/assessment) resolve.
    // Backward compatible: flat string values are assigned unchanged; nested
    // objects are expanded into their leaf keys; arrays are joined.
    const renderValues: Record<string, string> = { ...placeholders };
    const assignValue = (key: string, value: unknown): void => {
      if (value === null || value === undefined) {
        renderValues[key] = "";
      } else if (typeof value === "string") {
        renderValues[key] = value;
      } else if (typeof value === "number" || typeof value === "boolean") {
        renderValues[key] = String(value);
      } else if (Array.isArray(value)) {
        renderValues[key] = value
          .map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
          .join(", ");
      } else if (typeof value === "object") {
        // Keep the stringified object under its own key as a fallback, then
        // expand each leaf so nested placeholders resolve.
        renderValues[key] = JSON.stringify(value);
        for (const [childKey, childVal] of Object.entries(
          value as Record<string, unknown>
        )) {
          assignValue(childKey, childVal);
        }
      } else {
        renderValues[key] = String(value);
      }
    };
    for (const [key, value] of Object.entries(parsed)) {
      assignValue(key, value);
    }
    const contentBody = replacePlaceholders(template.render_template, renderValues);

    // 8. Update the document with AI results
    const { error: updateError } = await supabase
      .from("clinical_documents")
      .update({
        ai_draft: parsed,
        content_body: contentBody,
        status: "drafted",
        ai_model: docCall.model,
        ai_input_tokens: aiInputTokens,
        ai_output_tokens: aiOutputTokens,
        updated_at: new Date().toISOString(),
      })
      .eq("id", document_id);

    if (updateError) {
      console.error("Failed to update document:", document_id, updateError);
      await markFailed(supabase, document_id);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save AI draft" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 9b. Bill the finalized document. Non-fatal: the document is already
    // saved, so a billing hiccup must never fail the response (mirrors
    // scribe's non-fatal billError). Idempotent per document_id in the shared
    // primitive; subscription plans return plan_included (0); scribe-origin
    // SOAP notes are intentionally charged too ("charge both").
    try {
      await supabase.rpc("deduct_document_credits", {
        p_org_id: document.org_id,
        p_document_id: document_id,
        p_tier: tier,
      });
    } catch (e) {
      console.error("paperwork billing failed (non-fatal):", document_id, e);
    }

    // 10. Return success
    return new Response(
      JSON.stringify({ success: true, document_id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-document-content unhandled error:", err);

    // Best-effort: mark document as failed if we have the id
    try {
      const body = await req.clone().json().catch(() => null);
      if (body?.document_id) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await markFailed(supabase, body.document_id);
      }
    } catch { /* best effort */ }

    return new Response(
      JSON.stringify({ success: false, error: "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

/** Mark a document as failed so the UI can show an error state. */
async function markFailed(
  supabase: ReturnType<typeof createClient>,
  documentId: string
): Promise<void> {
  try {
    await supabase
      .from("clinical_documents")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);
  } catch (err) {
    console.error("Failed to mark document as failed:", documentId, err);
  }
}
