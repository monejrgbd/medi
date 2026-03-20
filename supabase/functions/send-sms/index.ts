import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INTERNAL_SECRET = Deno.env.get("INTERNAL_EDGE_SECRET");
const D7_API_TOKEN = Deno.env.get("D7_API_TOKEN");
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

    if (!D7_API_TOKEN) {
      return new Response(
        JSON.stringify({ error: "D7 Networks not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call D7 Networks SMS API
    const d7Res = await fetch("https://api.d7networks.com/messages/v1/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${D7_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{
          recipients: [to],
          content: body,
          msg_type: "text",
          data_coding: "text",
        }],
        message_globals: {
          originator: "HiltHealth",
        },
      }),
    });

    const d7Data = await d7Res.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const logStatus = d7Res.ok ? "sent" : "failed";
    const providerId = d7Data?.request_id || null;

    if (sms_log_id) {
      // Update existing sms_log row (pre-inserted by SQL function)
      await supabase
        .from("sms_log")
        .update({
          status: logStatus,
          provider_sid: providerId,
          error_message: d7Res.ok
            ? null
            : d7Data?.detail?.description || d7Data?.detail || "Unknown error",
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
        error_message: d7Res.ok
          ? null
          : d7Data?.detail?.description || d7Data?.detail || "Unknown error",
      });
    }

    if (!d7Res.ok) {
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
