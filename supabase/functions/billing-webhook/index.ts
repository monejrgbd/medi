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
        // Extract plan + interval from custom_id (format: "orgId:plan:interval") or env-configured plan map
        const planMapJson = Deno.env.get("PAYPAL_PLAN_MAP") || "{}";
        let planMap: Record<string, string> = {};
        try { planMap = JSON.parse(planMapJson); } catch { /* use empty */ }
        const planId = resource.plan_id || "";
        let plan = planMap[planId] || "starter";
        let billingInterval = "monthly";

        // Override from custom_id if plan info embedded (format: "orgId:plan:interval")
        if (customId && customId.includes(":")) {
          const parts = customId.split(":");
          if (parts[1]) plan = parts[1];
          if (parts[2] && (parts[2] === "monthly" || parts[2] === "annual")) {
            billingInterval = parts[2];
          }
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
          p_billing_interval: billingInterval,
        });
        break;
      }

      case "PAYMENT.SALE.COMPLETED": {
        // Only reset credits on actual subscription renewals, not initial activation
        // (initial activation is handled by BILLING.SUBSCRIPTION.ACTIVATED)
        const { data: orgData } = await supabase
          .from("organizations")
          .select("billing_cycle_start, billing_interval")
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

          // Extend current_period_end based on billing interval
          const intervalMs = orgData.billing_interval === "annual"
            ? 365 * 24 * 60 * 60 * 1000
            : 30 * 24 * 60 * 60 * 1000;
          await supabase
            .from("organizations")
            .update({
              current_period_end: new Date(Date.now() + intervalMs).toISOString(),
            })
            .eq("id", orgId);
        }

        // Affiliate commission: only for real subscription payments in USD with non-zero amount
        try {
          const billingAgreementId = resource.billing_agreement_id;
          const currency = resource.amount?.currency;
          const totalStr = resource.amount?.total;
          const totalNum = totalStr ? parseFloat(totalStr) : 0;

          if (billingAgreementId && totalNum > 0) {
            if (currency !== "USD") {
              await supabase.from("audit_trail").insert({
                org_id: orgId,
                actor_type: "system",
                action: "partner_webhook_currency_skip",
                entity_type: "organization",
                entity_id: orgId,
                details: { event_id: eventId, currency, total: totalStr },
              });
            } else {
              const amountCents = Math.round(totalNum * 100);
              const paymentDate = resource.create_time || new Date().toISOString();
              await supabase.rpc("record_partner_commission", {
                p_org_id: orgId,
                p_payment_amount_cents: amountCents,
                p_payment_event_id: resource.id || eventId,
                p_payment_date: paymentDate,
              });
            }
          }
        } catch (err) {
          // Never fail the webhook over commission accounting; log + continue
          await supabase.from("audit_trail").insert({
            org_id: orgId,
            actor_type: "system",
            action: "partner_webhook_error",
            entity_type: "organization",
            entity_id: orgId,
            details: { event_id: eventId, error: String(err) },
          });
        }

        // Google Ads: enqueue the offline Purchase conversion for this org's
        // first real payment. enqueue_ad_conversion is idempotent + first-only
        // and no-ops when the org has no captured gclid or value <= 0. Never
        // fail the webhook over ad attribution.
        try {
          const adCurrency = resource.amount?.currency;
          const adTotal = resource.amount?.total
            ? parseFloat(resource.amount.total)
            : 0;
          if (adTotal > 0) {
            await supabase.rpc("enqueue_ad_conversion", {
              p_org_id: orgId,
              p_order_id: resource.id || eventId,
              p_value: adTotal,
              p_currency: adCurrency || "USD",
            });
          }
        } catch (err) {
          await supabase.from("audit_trail").insert({
            org_id: orgId,
            actor_type: "system",
            action: "ad_conversion_enqueue_error",
            entity_type: "organization",
            entity_id: orgId,
            details: { event_id: eventId, error: String(err) },
          });
        }
        break;
      }

      case "PAYMENT.SALE.REFUNDED":
      case "PAYMENT.SALE.REVERSED": {
        try {
          const parentSaleId = resource.parent_payment || resource.sale_id;
          const totalStr = resource.amount?.total;
          const totalNum = totalStr ? parseFloat(totalStr) : 0;
          if (parentSaleId && totalNum > 0) {
            await supabase.rpc("record_partner_clawback", {
              p_payment_event_id: parentSaleId,
              p_refund_event_id: resource.id || eventId,
              p_refund_amount_cents: Math.round(totalNum * 100),
            });
          }
        } catch (err) {
          await supabase.from("audit_trail").insert({
            org_id: orgId,
            actor_type: "system",
            action: "partner_webhook_error",
            entity_type: "organization",
            entity_id: orgId,
            details: { event_id: eventId, kind: "clawback", error: String(err) },
          });
        }
        break;
      }

      case "CUSTOMER.DISPUTE.CREATED": {
        try {
          const disputedTxn = resource.disputed_transactions?.[0];
          const saleId = disputedTxn?.seller_transaction_id || disputedTxn?.buyer_transaction_id;
          if (saleId) {
            await supabase.rpc("extend_commission_dispute_hold", {
              p_payment_event_id: saleId,
            });
          }
          await supabase.from("audit_trail").insert({
            org_id: orgId,
            actor_type: "system",
            action: "partner_dispute_created",
            entity_type: "organization",
            entity_id: orgId,
            details: { event_id: eventId, sale_id: saleId },
          });
        } catch (err) {
          await supabase.from("audit_trail").insert({
            org_id: orgId,
            actor_type: "system",
            action: "partner_webhook_error",
            entity_type: "organization",
            entity_id: orgId,
            details: { event_id: eventId, kind: "dispute_created", error: String(err) },
          });
        }
        break;
      }

      case "CUSTOMER.DISPUTE.RESOLVED": {
        try {
          const disputedTxn = resource.disputed_transactions?.[0];
          const saleId = disputedTxn?.seller_transaction_id || disputedTxn?.buyer_transaction_id;
          const outcome = resource.dispute_outcome?.outcome_code;
          // Treat anything other than "RESOLVED_BUYER_FAVOUR" as a win for the merchant
          if (saleId) {
            if (outcome === "RESOLVED_BUYER_FAVOUR") {
              // Buyer won — clawback (use the disputed amount)
              const amountStr = resource.dispute_amount?.value;
              const amountNum = amountStr ? parseFloat(amountStr) : 0;
              if (amountNum > 0) {
                await supabase.rpc("record_partner_clawback", {
                  p_payment_event_id: saleId,
                  p_refund_event_id: resource.dispute_id || eventId,
                  p_refund_amount_cents: Math.round(amountNum * 100),
                });
              }
            } else {
              // Merchant won — release the 90-day hold
              await supabase.rpc("reset_commission_hold", {
                p_payment_event_id: saleId,
              });
            }
          }
        } catch (err) {
          await supabase.from("audit_trail").insert({
            org_id: orgId,
            actor_type: "system",
            action: "partner_webhook_error",
            entity_type: "organization",
            entity_id: orgId,
            details: { event_id: eventId, kind: "dispute_resolved", error: String(err) },
          });
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
