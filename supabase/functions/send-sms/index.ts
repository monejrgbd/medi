import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INTERNAL_SECRET = Deno.env.get("INTERNAL_EDGE_SECRET");
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "https://hilthealth.com";

// SMS templates
const TEMPLATES: Record<string, (params: Record<string, string>) => string> = {
  summary: (p) =>
    `Hi ${p.first_name}, your visit summary from ${p.org_name} is ready: ${APP_BASE_URL}/summary/${p.token}`,
  review: (p) =>
    `Hi ${p.first_name}, ${p.org_name} would appreciate your feedback: ${APP_BASE_URL}/review/${p.token}`,
  follow_up: (p) =>
    `Hi ${p.first_name}, ${p.org_name} recommends a follow-up visit. Please call to schedule: ${p.phone}`,
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

    // Build body from template or use directly
    let body: string = payload.body || "";
    if (template && TEMPLATES[template] && template_params) {
      body = TEMPLATES[template](template_params);
    }

    if (!to || !body || !org_id || !sms_type) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return new Response(
        JSON.stringify({ error: "Twilio not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call Twilio REST API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const authHeader = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const formData = new URLSearchParams();
    formData.append("To", to);
    formData.append("From", TWILIO_PHONE_NUMBER);
    formData.append("Body", body);

    const twilioRes = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const twilioData = await twilioRes.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const logStatus = twilioRes.ok ? "sent" : "failed";

    if (sms_log_id) {
      // Update existing sms_log row (pre-inserted by SQL function)
      await supabase
        .from("sms_log")
        .update({
          status: logStatus,
          twilio_sid: twilioData.sid || null,
          error_message: twilioRes.ok
            ? null
            : twilioData.message || "Unknown error",
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
        twilio_sid: twilioData.sid || null,
        status: logStatus,
        error_message: twilioRes.ok
          ? null
          : twilioData.message || "Unknown error",
      });
    }

    if (!twilioRes.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to send SMS" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, twilio_sid: twilioData.sid }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
