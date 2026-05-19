// Internal function (not called by browsers) — deploy with --no-verify-jwt.
//
// Drains public.pending_ad_conversions and uploads each as a Google Ads
// offline click conversion (uploadClickConversions). Invoked by pg_cron.
// Mirrors process-email-queue.
//
// GUARDED: if the Google Ads API secrets are not configured this returns 200
// with skipped>0 and leaves rows `pending` (no crash, no data loss, no cron
// noise) so the rest of the system ships before credentials exist.
//
// Required env (Supabase function secrets):
//   GOOGLE_ADS_DEVELOPER_TOKEN
//   GOOGLE_ADS_CLIENT_ID
//   GOOGLE_ADS_CLIENT_SECRET
//   GOOGLE_ADS_REFRESH_TOKEN
//   GOOGLE_ADS_CUSTOMER_ID                 (digits only, no dashes)
//   GOOGLE_ADS_LOGIN_CUSTOMER_ID           (optional; manager id, digits only)
//   GOOGLE_ADS_PURCHASE_CONVERSION_ACTION  (customers/<cid>/conversionActions/<id>)
//   INTERNAL_EDGE_SECRET                   (auth, same as other internal fns)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const INTERNAL_SECRET = Deno.env.get("INTERNAL_EDGE_SECRET");

const ADS_DEV_TOKEN = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");
const ADS_CLIENT_ID = Deno.env.get("GOOGLE_ADS_CLIENT_ID");
const ADS_CLIENT_SECRET = Deno.env.get("GOOGLE_ADS_CLIENT_SECRET");
const ADS_REFRESH_TOKEN = Deno.env.get("GOOGLE_ADS_REFRESH_TOKEN");
const ADS_CUSTOMER_ID = Deno.env.get("GOOGLE_ADS_CUSTOMER_ID");
const ADS_LOGIN_CUSTOMER_ID =
  Deno.env.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID") || ADS_CUSTOMER_ID;
const ADS_PURCHASE_ACTION = Deno.env.get("GOOGLE_ADS_PURCHASE_CONVERSION_ACTION");

const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 5;

const ADS_CONFIGURED = Boolean(
  ADS_DEV_TOKEN &&
    ADS_CLIENT_ID &&
    ADS_CLIENT_SECRET &&
    ADS_REFRESH_TOKEN &&
    ADS_CUSTOMER_ID &&
    ADS_PURCHASE_ACTION,
);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Google Ads conversionDateTime: "yyyy-mm-dd hh:mm:ss+00:00" (offset required).
function toAdsDateTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ` +
    `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}+00:00`
  );
}

async function sha256(value: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value.trim().toLowerCase()),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: ADS_CLIENT_ID!,
      client_secret: ADS_CLIENT_SECRET!,
      refresh_token: ADS_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`OAuth ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return (await res.json()).access_token as string;
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get("authorization");
  const secretHeader = req.headers.get("x-internal-secret");
  const isAuthorized =
    (secretHeader && secretHeader === INTERNAL_SECRET) ||
    (authHeader && authHeader === `Bearer ${SERVICE_ROLE_KEY}`);
  if (!isAuthorized) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: rows, error: fetchError } = await supabase
    .from("pending_ad_conversions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchError) return json({ error: fetchError.message }, 500);
  if (!rows || rows.length === 0) return json({ processed: 0 });

  // Not configured yet: leave rows pending, do not error (no cron noise).
  if (!ADS_CONFIGURED) {
    return json({ processed: 0, skipped: rows.length, reason: "ads_not_configured" });
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch (err) {
    return json({ error: `oauth_failed: ${String(err)}` }, 502);
  }

  const endpoint =
    `https://googleads.googleapis.com/v18/customers/${ADS_CUSTOMER_ID}:uploadClickConversions`;

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    const conversion: Record<string, unknown> = {
      conversionAction: ADS_PURCHASE_ACTION,
      conversionDateTime: toAdsDateTime(row.conversion_time),
    };
    if (row.gclid) conversion.gclid = row.gclid;
    else if (row.gbraid) conversion.gbraid = row.gbraid;
    else if (row.wbraid) conversion.wbraid = row.wbraid;

    if (row.value != null) conversion.conversionValue = Number(row.value);
    if (row.currency) conversion.currencyCode = row.currency;
    if (row.order_id) conversion.orderId = row.order_id;

    const email = row.user_data?.email;
    if (email) {
      conversion.userIdentifiers = [{ hashedEmail: await sha256(email) }];
    }

    const newAttempt = row.attempt_count + 1;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "developer-token": ADS_DEV_TOKEN!,
          "login-customer-id": ADS_LOGIN_CUSTOMER_ID!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversions: [conversion], partialFailure: true }),
      });

      const body = await res.json().catch(() => ({}));
      const partialErr = body?.partialFailureError;

      if (res.ok && !partialErr) {
        await supabase
          .from("pending_ad_conversions")
          .update({
            status: "sent",
            last_attempt_at: new Date().toISOString(),
            attempt_count: newAttempt,
            metadata: { ...row.metadata, sent_at: new Date().toISOString() },
          })
          .eq("id", row.id);
        sent++;
      } else {
        const msg = partialErr
          ? JSON.stringify(partialErr).slice(0, 500)
          : `HTTP ${res.status}: ${JSON.stringify(body).slice(0, 500)}`;
        await supabase
          .from("pending_ad_conversions")
          .update({
            status: newAttempt >= MAX_ATTEMPTS ? "failed" : "pending",
            last_attempt_at: new Date().toISOString(),
            attempt_count: newAttempt,
            error_message: msg,
          })
          .eq("id", row.id);
        failed++;
      }
    } catch (err) {
      await supabase
        .from("pending_ad_conversions")
        .update({
          status: newAttempt >= MAX_ATTEMPTS ? "failed" : "pending",
          last_attempt_at: new Date().toISOString(),
          attempt_count: newAttempt,
          error_message: err instanceof Error ? err.message : "Unknown error",
        })
        .eq("id", row.id);
      failed++;
    }
  }

  return json({ processed: rows.length, sent, failed });
});
