// Deploy with: --no-verify-jwt (called by unauthenticated patients, auth via session token)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const INTERNAL_SECRET = Deno.env.get("INTERNAL_EDGE_SECRET");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const E164_REGEX = /^\+[1-9]\d{1,14}$/;

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "send_code") {
      return await handleSendCode(req, body, supabase);
    } else if (action === "verify_code") {
      return await handleVerifyCode(body, supabase);
    } else {
      return jsonResponse({ error: "Invalid action" }, 400);
    }
  } catch (err) {
    return jsonResponse({ error: "Internal error" }, 500);
  }
});

async function handleSendCode(
  req: Request,
  body: Record<string, string>,
  supabase: ReturnType<typeof createClient>
) {
  const { phone, session_token, visit_id, location_id } = body;

  // Validate E.164
  if (!phone || !E164_REGEX.test(phone)) {
    return jsonResponse({ error: "Invalid phone number format" }, 400);
  }

  if (!session_token || !visit_id || !location_id) {
    return jsonResponse({ error: "Missing required fields" }, 400);
  }

  // Validate session
  const { data: sessionData } = await supabase.rpc("get_patient_session", {
    p_session_token: session_token,
  });

  if (!sessionData?.success) {
    return jsonResponse({ error: "Invalid session" }, 401);
  }

  if (sessionData.visit_id !== visit_id) {
    return jsonResponse({ error: "Session mismatch" }, 401);
  }

  // Get client IP for rate limiting
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";

  // Rate-limit checks
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Phone rate limit: 3 per hour
  const { count: phoneCount } = await supabase
    .from("phone_verifications")
    .select("*", { count: "exact", head: true })
    .eq("phone", phone)
    .gte("created_at", oneHourAgo)
    ;

  if ((phoneCount ?? 0) >= 3) {
    return jsonResponse({ error: "Too many verification attempts for this phone number. Please try again later." }, 429);
  }

  // IP rate limit: 5 per hour
  const { count: ipCount } = await supabase
    .from("phone_verifications")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", clientIp)
    .gte("created_at", oneHourAgo)
    ;

  if ((ipCount ?? 0) >= 5) {
    return jsonResponse({ error: "Too many verification attempts. Please try again later." }, 429);
  }

  // Location rate limit: 100 per hour
  const { count: locationCount } = await supabase
    .from("phone_verifications")
    .select("*", { count: "exact", head: true })
    .eq("location_id", location_id)
    .gte("created_at", oneHourAgo)
    ;

  if ((locationCount ?? 0) >= 100) {
    return jsonResponse({ error: "Too many verification attempts at this location. Please try again later." }, 429);
  }

  // Generate 6-digit code
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const code = String(100000 + (array[0] % 900000));

  // Hash with bcrypt
  const codeHash = await bcrypt.hash(code);

  // Get org_id and patient_id from visit
  const { data: visitData } = await supabase
    .from("visits")
    .select("org_id, patient_id")
    .eq("id", visit_id)
    .single();

  // Insert verification record (10 minute expiry)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { data: verification, error: insertError } = await supabase
    .from("phone_verifications")
    .insert({
      phone,
      code_hash: codeHash,
      location_id,
      visit_id,
      patient_id: visitData?.patient_id || null,
      ip_address: clientIp,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (insertError) {
    return jsonResponse({ error: "Failed to create verification" }, 500);
  }

  // Send SMS via send-sms edge function
  const edgeFunctionUrl = Deno.env.get("SUPABASE_URL") + "/functions/v1/send-sms";
  const smsRes = await fetch(edgeFunctionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": INTERNAL_SECRET || "",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify({
      to: phone,
      body: `Your Hilt Health verification code is: ${code}. It expires in 10 minutes.`,
      org_id: visitData?.org_id,
      location_id,
      visit_id,
      patient_id: visitData?.patient_id,
      sms_type: "verification",
    }),
  });

  if (!smsRes.ok) {
    return jsonResponse({ error: "Failed to send verification SMS. Please try again." }, 500);
  }

  return jsonResponse({ success: true, verification_id: verification.id });
}

async function handleVerifyCode(
  body: Record<string, string>,
  supabase: ReturnType<typeof createClient>
) {
  const { phone, code, verification_id, session_token, visit_id } = body;

  if (!phone || !code || !verification_id || !session_token || !visit_id) {
    return jsonResponse({ error: "Missing required fields" }, 400);
  }

  // Validate session and confirm it matches the visit
  const { data: sessionData } = await supabase.rpc("get_patient_session", {
    p_session_token: session_token,
  });

  if (!sessionData?.success) {
    return jsonResponse({ error: "Invalid session" }, 401);
  }

  if (sessionData.visit_id !== visit_id) {
    return jsonResponse({ error: "Session mismatch" }, 401);
  }

  // Look up verification record
  const { data: verification } = await supabase
    .from("phone_verifications")
    .select("*")
    .eq("id", verification_id)
    .is("verified_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!verification) {
    return jsonResponse({ success: false, error: "Code expired or not found. Please request a new code." });
  }

  // Atomic server-side increment — prevents TOCTOU race from parallel requests
  const { data: newAttempts } = await supabase.rpc("increment_verification_attempt", {
    p_verification_id: verification_id,
  });

  if (newAttempts === null) {
    return jsonResponse({ success: false, error: "Too many attempts. Please request a new code." });
  }

  // Compare code against hash
  const isValid = await bcrypt.compare(code, verification.code_hash);

  if (!isValid) {
    const remaining = 3 - newAttempts;
    return jsonResponse({
      success: false,
      error: "Invalid code",
      attempts_remaining: Math.max(remaining, 0),
    });
  }

  // Mark as verified
  await supabase
    .from("phone_verifications")
    .update({ verified_at: new Date().toISOString() })
    .eq("id", verification_id);

  // Call verify_phone_and_link RPC — use phone from verification record, not request body (prevents substitution)
  await supabase.rpc("verify_phone_and_link", {
    p_visit_id: visit_id,
    p_session_token: session_token,
    p_phone: verification.phone,
  });

  // Broadcast phone_verified event — subscribe before sending
  const channel = supabase.channel(`patient:${session_token}`);
  await channel.subscribe();
  await channel.send({
    type: "broadcast",
    event: "phone_verified",
    payload: { visit_id },
  });
  supabase.removeChannel(channel);

  return jsonResponse({ success: true });
}
