// Deployed with --no-verify-jwt (internal function, not called by browsers)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INTERNAL_SECRET = Deno.env.get("INTERNAL_EDGE_SECRET");
const SMSMOBILEAPI_KEY = Deno.env.get("SMSMOBILEAPI_KEY");
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "https://hilthealth.com";

// SMS templates
const TEMPLATES: Record<string, (params: Record<string, string>) => string> = {
  summary: (p) =>
    `Hi ${p.first_name}, your visit summary from ${p.org_name} is ready: ${APP_BASE_URL}/summary/${p.token}`,
  review: (p) =>
    `Hi ${p.first_name}, ${p.org_name} would appreciate your feedback: ${APP_BASE_URL}/review/${p.token}`,
  follow_up: (p) =>
    `Hi ${p.first_name}, ${p.org_name} recommends a follow-up visit. Please call the clinic to schedule.`,
};

Deno.serve(async (req) => {
  // Validate internal secret
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== INTERNAL_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await req.json();
    const {
      to,
      org_id,
      location_id,
      visit_id,
      patient_id,
      sms_type,
      sms_log_id,
      template,
      template_params,
    } = payload;

    // Build body: custom_body with variable substitution > built-in template > raw body
    let body: string = "";
    if (payload.custom_body && template_params) {
      // Owner-configured custom template with variable substitution
      body = payload.custom_body;
      for (const [key, val] of Object.entries(template_params)) {
        body = body.replaceAll(`{${key}}`, String(val));
      }
    } else if (template && TEMPLATES[template] && template_params) {
      body = TEMPLATES[template](template_params);
    } else {
      body = payload.body || "";
    }

    if (!to || !body || !org_id || !sms_type) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!SMSMOBILEAPI_KEY) {
      return new Response(
        JSON.stringify({ error: "SMSMobileAPI not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call SMSMobileAPI
    const smaRes = await fetch("https://api.smsmobileapi.com/sendsms/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        apikey: SMSMOBILEAPI_KEY,
        recipients: to,
        message: body,
        sendsms: "1",
      }),
    });

    const smaData = await smaRes.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const success = smaData?.success === true || smaData?.status === "ok" || smaRes.ok;
    const logStatus = success ? "sent" : "failed";
    const providerId = smaData?.id || smaData?.message_id || null;
    const errorMsg = success ? null : smaData?.error || smaData?.message || "Unknown error";

    if (sms_log_id) {
      // Update existing sms_log row (pre-inserted by SQL function)
      await supabase
        .from("sms_log")
        .update({
          status: logStatus,
          provider_sid: providerId,
          error_message: errorMsg,
        })
        .eq("id", sms_log_id);
    } else {
      // Insert new sms_log row (backward compat)
      await supabase.from("sms_log").insert({
        org_id,
        location_id: location_id || null,
        visit_id: visit_id || null,
        patient_id: patient_id || null,
        phone: to,
        sms_type,
        provider_sid: providerId,
        status: logStatus,
        error_message: errorMsg,
      });
    }

    if (!success) {
      return new Response(
        JSON.stringify({ error: "Failed to send SMS" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, provider_sid: providerId }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
