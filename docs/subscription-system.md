# Subscription and Credit System

## How It Works

Hilt Health uses a credit based billing model. Each AI pre-screening visit consumes credits (1.5 for Standard AI, 4 for Advanced AI). Organizations get credits through their subscription plan or through the recharge system.

### Plans and Credit Allocations

| Plan | Monthly | Annual (20% off) | Credits/Month | $/Credit | Savings vs PAYG |
|------|---------|------------------|--------------|----------|-----------------|
| Starter | $99 | $79/mo | 125 | $0.79 | ~20% |
| Professional | $349 | $279/mo | 600 | $0.58 | ~42% |
| Business | $899 | $719/mo | 1,800 | $0.50 | 50% |
| Enterprise | Custom | Custom | Custom | Negotiated | 60%+ |
| Pay as you go | $1/credit | — | 0 (recharge only) | $1.00 | — |
| Trial (Standard/Premium) | Free | — | 20/200 | — | — |

Overage credits: $1/credit on all plans (same as PAYG rate).

### Enterprise Plan Setup

Enterprise is not self-serve. It exists in the database as `subscription_plan = 'enterprise'` for organizations with negotiated custom deals. Managed entirely through the platform admin panel.

**To set up an enterprise customer:**

1. **Negotiate the deal** — agree on credit allocation, monthly price, and any custom terms
2. **Create the organization** — customer signs up normally through the trial flow
3. **Create a custom PayPal subscription plan** in the PayPal dashboard with the negotiated price
4. **Send the customer the PayPal subscription link** — they subscribe and pay
5. **Activate via admin panel** — go to `/d/admin/enterprise`, search for the org, click "Set Enterprise", enter the credit allocation and the PayPal Subscription ID (starts with `I-`), click "Activate Enterprise"

The admin panel handles all the database updates. The PayPal Subscription ID links the org to PayPal so payment failures and cancellations are handled automatically via webhooks.

**To adjust enterprise credits mid-cycle:** Click "Adjust" on the enterprise customer row in `/d/admin/enterprise`.

**To revoke enterprise:** Click "Revoke" — sets the plan to expired with a 90 day data retention period.

**Important:** `change_subscription_plan` and `activate_subscription` SQL functions do NOT include enterprise in their plan-to-credit mapping. Enterprise is managed exclusively through `admin_set_enterprise_plan`. The `reset_monthly_credits` function preserves the manually set `credits_total` for enterprise orgs on each monthly cycle reset.

### Credit Flow

1. **Check**: `start_ai_conversation` calls `check_credits` to verify capacity before allowing a conversation
2. **Deduct**: `ai-conversation` edge function calls `deduct_credits` on the first patient message (not at visit completion)
3. **Alert**: at 80% of effective capacity (plan + recharge), an email alert is sent to the owner (once per cycle)
4. **Reset**: monthly cron or PayPal webhook resets credits at the billing cycle boundary

### Recharge System

When an organization runs out of plan credits, the recharge system provides automatic overflow capacity at $1 per credit.

**For subscription plans**: recharge acts as overflow beyond the plan allocation. Recharge usage resets at each billing cycle along with plan credits.

**For pay as you go**: recharge is the primary (and only) credit source. A 30 day rolling cycle governs credit expiry, unused credits expire at each cycle reset.

**Configuration**: owners set a `recharge_limit` (1 to 10,000) in the billing dashboard. Setting to null disables recharge, causing screening to pause when credits are exhausted.

**Deduction logic** (inside `FOR UPDATE` lock for race safety):
- If regular credits remain >= cost: deduct from regular
- Else if recharge enabled: exhaust regular remainder, overflow to recharge
- Else: return `no_credits`

### Annual Billing

Annual plans are 20% off. Credits still reset monthly (same allocation per month). The only difference is PayPal charges once per year instead of monthly.

**How it works:**
- `SubscriptionManager` has a monthly/annual toggle that selects different PayPal plan IDs (format: `starter_monthly`, `starter_annual`)
- `custom_id` sent to PayPal includes billing frequency: `orgId:plan:interval` (e.g., `org123:starter:annual`)
- Billing webhook parses the interval, passes it to `activate_subscription` which sets `billing_interval` and `current_period_end` on the org
- `current_period_end` is set to now + 1 year (annual) or now + 1 month (monthly)
- On each `PAYMENT.SALE.COMPLETED` webhook, `current_period_end` is extended by the appropriate interval
- Credits still reset monthly via the cron regardless of billing frequency

**Cancellation with annual billing:** When an owner cancels, `cancel_subscription` uses `current_period_end` (not `billing_cycle_start + 30 days`) to calculate when access ends. Annual subscribers keep access until their paid year ends. The daily cron cleanup expires the org and sets `subscription_plan = 'expired'` once `cancel_at_period_end` passes.

**Database columns:**
- `billing_interval` — 'monthly' or 'annual' (default 'monthly')
- `current_period_end` — when the current paid period ends (extended on each payment)

**PayPal plan IDs env var format:**
```
NEXT_PUBLIC_PAYPAL_PLAN_IDS={"starter_monthly":"P-XXX","starter_annual":"P-YYY","professional_monthly":"P-XXX","professional_annual":"P-YYY","business_monthly":"P-XXX","business_annual":"P-YYY"}
```

### Billing Lifecycle

| Event | Trigger | SQL Function | Recharge Impact |
|-------|---------|-------------|----------------|
| New subscription | PayPal webhook `BILLING.SUBSCRIPTION.ACTIVATED` | `activate_subscription` | recharge_used reset to 0 |
| Monthly renewal | PayPal webhook `PAYMENT.SALE.COMPLETED` | `reset_monthly_credits` | recharge_used reset to 0 |
| Payment failure | PayPal webhook `PAYMENT.SALE.DENIED` | `handle_payment_failure` | No change (gates block) |
| Escalation (3 failures/7d) | handle_payment_failure | Sets plan to `read_only` | Recharge irrelevant |
| Escalation (30d) | handle_payment_failure | Sets plan to `suspended` | Recharge irrelevant |
| Owner cancels | Dashboard action | `cancel_subscription` | Active until current_period_end |
| External cancel | PayPal webhook `BILLING.SUBSCRIPTION.CANCELLED` | Direct update to `expired` | Gates block |
| Plan change | Dashboard action | `change_subscription_plan` | recharge_used reset, PAyG billing_cycle_start managed |
| PAyG enable recharge | Dashboard action | `set_recharge_limit` | billing_cycle_start = now(), recharge_used = 0 |
| PAyG disable recharge | Dashboard action | `set_recharge_limit` | billing_cycle_start = NULL |
| PAyG 30 day reset | Daily cron | `reset_monthly_credits` | Everything zeroed |
| Manual credit purchase | Dashboard action | `purchase_overage_credits` | Adds to regular pool, independent of recharge |

### Cron Jobs

- **credit_reset** (daily midnight): resets credits for subscription plans (after 1 month) and PAyG with recharge (after 30 days)
- **cron_cleanup** (daily 6 AM): expires stale sessions, follow ups, referrals, phone verifications, expires orgs past cancel_at_period_end (sets plan to expired + 90 day data retention), sends owner alerts

## Files That Represent It

### SQL Functions (in `sql/`)
- `check_credits.core-sql` — returns remaining capacity (regular + recharge)
- `deduct_credits.core-sql` — atomic credit deduction with recharge fallback and 80% alert
- `reset_monthly_credits.core-sql` — cycle reset (subscription and PAyG)
- `credit_reset_cron.core-sql` — daily cron scheduling
- `set_recharge_limit.core-sql` — owner configures recharge
- `activate_subscription.core-sql` — PayPal activation handler (sets billing_interval + current_period_end)
- `admin_set_enterprise_plan.core-sql` — platform admin activates/adjusts/revokes enterprise plans
- `admin_list_organizations.core-sql` — platform admin org search
- `change_subscription_plan.core-sql` — plan change with recharge state management
- `cancel_subscription.core-sql` — schedule cancellation at period end
- `handle_payment_failure.core-sql` — payment failure escalation
- `purchase_overage_credits.core-sql` — manual one time credit purchase
- `get_credit_dashboard.core-sql` — dashboard data with recharge fields

### Edge Functions (in `supabase/functions/`)
- `billing-webhook/` — PayPal webhook handler (signature verification, idempotency, event routing)
- `ai-conversation/` — calls `deduct_credits` on first patient message (line 188)

### UI Components
- `src/components/billing/CreditDashboard.tsx` — gauge + daily usage chart + recharge bar
- `src/components/billing/RechargeConfig.tsx` — toggle + limit presets + usage bar
- `src/components/billing/OveragePurchase.tsx` — manual credit purchase
- `src/components/billing/SubscriptionManager.tsx` — plan cards with monthly/annual toggle, PayPal checkout
- `src/components/billing/CancelSubscription.tsx` — cancellation flow
- `src/app/(dashboard)/d/owner/billing/page.tsx` — billing dashboard page
- `src/components/admin/AdminEnterprise.tsx` — enterprise plan management (admin only)
- `src/app/(dashboard)/d/admin/enterprise/page.tsx` — enterprise admin page

### Server Actions
- `src/app/(dashboard)/d/_actions/billing.ts` — all billing RPC wrappers
- `src/app/(dashboard)/d/_actions/admin.ts` — platform admin actions (premium codes, enterprise management)

### Database
- `sql/tables/organizations.core-sql` — credit columns: credits_total, credits_used, recharge_limit, recharge_used, billing_cycle_start, billing_interval, current_period_end
- `sql/tables/credits_log.core-sql` — per visit deduction log (UNIQUE on visit_id)
- `sql/tables/processed_webhook_events.core-sql` — PayPal webhook idempotency

## Dependencies

**Relies on:**
- Supabase Auth (auth.uid, auth.role for service_role gates)
- PayPal Subscriptions API (webhook events)
- pg_cron extension (daily reset scheduling)
- Supabase Vault (edge_function_url, unsubscribe_secret for alert emails)
- pending_emails table + process-email-queue edge function (alert delivery)

**What relies on it:**
- `start_ai_conversation` (gates on credit availability)
- `ai-conversation` edge function (deducts credits)
- `CheckinFlow` + `ChatInterface` (handles `no_credits` error state)
- `SubscriptionWarningBanner` (shows plan status warnings)

## Testing

### Automated verification
- Set recharge limit on subscription plan, verify org column updates
- Exhaust plan credits, verify recharge deduction path works
- Exhaust recharge limit, verify `no_credits` returned
- Run `reset_monthly_credits`, verify recharge_used resets to 0
- Change plan from subscription to PAyG, verify billing_cycle_start set correctly
- Enable/disable recharge on PAyG, verify billing_cycle_start lifecycle

### Manual verification
- Billing dashboard displays recharge bar when limit is set
- RechargeConfig toggle enables/disables correctly
- CreditDashboard gauge reflects effective capacity
- FAQ on pricing page shows updated recharge text
- PayPal webhook activation resets recharge_used
- SubscriptionManager monthly/annual toggle renders correct prices and PayPal buttons
- Annual subscriber cancel uses current_period_end (not 30 days)
- Cron cleanup expires orgs past cancel_at_period_end (sets plan to expired)
- Admin panel: /d/admin/enterprise lists enterprise customers, activate/adjust/revoke works
- Admin panel: PayPal Subscription ID field links enterprise org to PayPal for auto cancellation
