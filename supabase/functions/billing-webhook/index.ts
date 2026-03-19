// Deploy with: --no-verify-jwt (external webhook, auth via PayPal signature verification)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET");
const PAYPAL_WEBHOOK_ID = Deno.env.get("PAYPAL_WEBHOOK_ID");
const PAYPAL_API_BASE = Deno.env.get("PAYPAL_API_BASE") || "https://api-m.paypal.com";

// In-memory rate limiting: 100 req/min per IP
const ipCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // Evict stale entries periodically (every 50 checks)
  if (ipCounts.size > 50) {
    for (const [key, val] of ipCounts) {
      if (now >= val.resetAt) ipCounts.delete(key);
    }
  }

  const entry = ipCounts.get(ip);
  if (!entry || now >= entry.resetAt) {
    ipCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

async function getPayPalAccessToken(): Promise<string> {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return data.access_token;
}

async function verifyWebhookSignature(
  req: Request,
  body: string
): Promise<boolean> {
  if (!PAYPAL_WEBHOOK_ID) return false;

  const accessToken = await getPayPalAccessToken();
  const res = await fetch(
    `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: req.headers.get("paypal-auth-algo"),
        cert_url: req.headers.get("paypal-cert-url"),
        transmission_id: req.headers.get("paypal-transmission-id"),
        transmission_sig: req.headers.get("paypal-transmission-sig"),
        transmission_time: req.headers.get("paypal-transmission-time"),
        webhook_id: PAYPAL_WEBHOOK_ID,
        webhook_event: JSON.parse(body),
      }),
    }
  );

  const result = await res.json();
  return result.verification_status === "SUCCESS";
}

Deno.serve(async (req) => {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: "Rate limited" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.text();

    // Verify PayPal signature (fail closed — reject if env vars missing)
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET || !PAYPAL_WEBHOOK_ID) {
      return new Response(
        JSON.stringify({ error: "Webhook verification not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const verified = await verifyWebhookSignature(req, body);
    if (!verified) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(body);
    const eventId = event.id;
    const eventType = event.event_type;

    if (!eventId || !eventType) {
      return new Response(JSON.stringify({ error: "Missing event data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Idempotency check
    const { data: existing } = await supabase
      .from("processed_webhook_events")
      .select("id")
      .eq("event_id", eventId)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ success: true, duplicate: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Map event to org
    const resource = event.resource || {};
    const customId = resource.custom_id;
    const subscriptionId =
      resource.billing_agreement_id ||
      resource.id ||
      resource.subscription_id;

    let orgId: string | null = null;

    // Try custom_id first (org_id embedded in subscription creation)
    // Supports both plain UUID and "orgId:plan" format
    if (customId) {
      const orgUuid = customId.includes(":") ? customId.split(":")[0] : customId;
      const { data: orgByCustom } = await supabase
        .from("organizations")
        .select("id")
        .eq("id", orgUuid)
        .maybeSingle();
      if (orgByCustom) orgId = orgByCustom.id;
    }

    // Fallback: lookup by PayPal subscription ID
    if (!orgId && subscriptionId) {
      const { data: orgBySub } = await supabase
        .from("organizations")
        .select("id")
        .eq("paypal_subscription_id", subscriptionId)
        .maybeSingle();
      if (orgBySub) orgId = orgBySub.id;
    }

    if (!orgId) {
      // Log unmatched event and return 200 (don't retry)
      await supabase.from("processed_webhook_events").insert({
        event_id: eventId,
        event_type: eventType,
        org_id: null,
        payload: event,
      });
      return new Response(
        JSON.stringify({ success: true, note: "No matching org" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Route by event type
    switch (eventType) {
      case "BILLING.SUBSCRIPTION.ACTIVATED": {
        // Extract plan from custom_id (format: "orgId:plan") or env-configured plan map
        const planMapJson = Deno.env.get("PAYPAL_PLAN_MAP") || "{}";
        let planMap: Record<string, string> = {};
        try { planMap = JSON.parse(planMapJson); } catch { /* use empty */ }
        const planId = resource.plan_id || "";
        let plan = planMap[planId] || "standard";

        // Override from custom_id if plan info embedded (format: "orgId:plan")
        if (customId && customId.includes(":")) {
          const parts = customId.split(":");
          if (parts[1]) plan = parts[1];
        }

        // Cancel old PayPal subscription if switching plans
        const { data: currentOrg } = await supabase
          .from("organizations")
          .select("paypal_subscription_id")
          .eq("id", orgId)
          .single();

        if (
          currentOrg?.paypal_subscription_id &&
          currentOrg.paypal_subscription_id !== subscriptionId
        ) {
          try {
            const accessToken = await getPayPalAccessToken();
            await fetch(
              `${PAYPAL_API_BASE}/v1/billing/subscriptions/${currentOrg.paypal_subscription_id}/cancel`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ reason: "Replaced by new subscription" }),
              }
            );
          } catch {
            // Log but don't fail — new subscription is already active
          }
        }

        await supabase.rpc("activate_subscription", {
          p_org_id: orgId,
          p_paypal_subscription_id: subscriptionId || "",
          p_plan: plan,
        });
        break;
      }

      case "PAYMENT.SALE.COMPLETED": {
        // Only reset credits on actual subscription renewals, not initial activation
        // (initial activation is handled by BILLING.SUBSCRIPTION.ACTIVATED)
        const { data: orgData } = await supabase
          .from("organizations")
          .select("billing_cycle_start")
          .eq("id", orgId)
          .single();

        if (orgData?.billing_cycle_start) {
          const cycleStart = new Date(orgData.billing_cycle_start);
          const daysSinceCycleStart = (Date.now() - cycleStart.getTime()) / (1000 * 60 * 60 * 24);
          // Only reset if at least 28 days have passed since last cycle start
          // (allows 2-day buffer for PayPal timing variations)
          if (daysSinceCycleStart >= 28) {
            await supabase.rpc("reset_monthly_credits", {
              p_org_id: orgId,
            });
          }
        }
        break;
      }

      case "PAYMENT.SALE.DENIED":
      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED": {
        await supabase.rpc("handle_payment_failure", {
          p_org_id: orgId,
        });
        break;
      }

      case "BILLING.SUBSCRIPTION.CANCELLED": {
        // If cancel_at_period_end is set, we're managing the timing — skip expire
        const { data: cancelOrg } = await supabase
          .from("organizations")
          .select("cancel_at_period_end")
          .eq("id", orgId)
          .single();

        if (!cancelOrg?.cancel_at_period_end) {
          // External/admin cancel — expire immediately
          await supabase
            .from("organizations")
            .update({
              subscription_plan: "expired",
              cancelled_at: new Date().toISOString(),
              data_retention_until: new Date(
                Date.now() + 90 * 24 * 60 * 60 * 1000
              ).toISOString(),
            })
            .eq("id", orgId)
            .neq("subscription_plan", "suspended");
        }
        await supabase.from("audit_trail").insert({
          org_id: orgId,
          actor_type: "system",
          action: "subscription_cancelled_webhook",
          entity_type: "organization",
          entity_id: orgId,
          details: { event_id: eventId, managed: !!cancelOrg?.cancel_at_period_end },
        });
        break;
      }

      case "BILLING.SUBSCRIPTION.SUSPENDED": {
        await supabase
          .from("organizations")
          .update({ subscription_plan: "suspended" })
          .eq("id", orgId);
        await supabase.from("audit_trail").insert({
          org_id: orgId,
          actor_type: "system",
          action: "subscription_suspended_webhook",
          entity_type: "organization",
          entity_id: orgId,
          details: { event_id: eventId },
        });
        break;
      }

      default:
        // Unknown event type — log and return 200
        break;
    }

    // Record processed event
    await supabase.from("processed_webhook_events").insert({
      event_id: eventId,
      event_type: eventType,
      org_id: orgId,
      payload: event,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (_err) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
