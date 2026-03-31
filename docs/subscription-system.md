# Subscription and Credit System

## How It Works

Hilt Health uses per-provider subscription pricing with AI model differentiation. All plans include every feature. The only differentiators are AI conversation quality, included marketing budget, message limits, and embeddable widget access.

**User-facing language:** Subscription plans use "marketing budget" instead of "credits" to avoid confusion with PAyG. The backend still uses the credit system internally. PAyG is the only plan type that says "credits" to users.

### Plans

| | Starter | Professional | Business |
|---|---|---|---|
| **Price** | $79/provider/mo ($63 annual) | $149/provider/mo ($119 annual) | $249/provider/mo ($199 annual) |
| **AI Conversations** | Haiku (unlimited) + 1 Opus taste | Sonnet (unlimited) + 5 Opus taste | Sonnet (unlimited) + 25 Opus included |
| **Summaries** | Sonnet | Sonnet | Sonnet (or Opus if location set to advanced) |
| **Diagnostics** | Sonnet (free) | Opus (free) | Opus (free) |
| **Marketing Budget** | 20/month (~200 SMS or ~20K scans) | 100/month (~1K SMS or ~100K scans) | 300/month (~1K SMS or ~100K scans + 25 Premium AI convos) |
| **Message Limit** | 20/conversation | 35/conversation | 50/conversation |
| **Embeddable Widget** | — | — | ✓ |
| **All Other Features** | ✓ | ✓ | ✓ |

**Other plan types:**
- **Enterprise**: custom pricing, managed via admin panel at /d/admin/enterprise
- **Pay as you go**: $1/credit, credit-based for everything (Sonnet AI, default 30 messages, max 50 per location override)
- **Trials**: three paths on signup form:
  - PAyG trial: standard_trial (20 credits, 14 days) or premium_trial (200 credits, 30 days with code). Credit-based.
  - Starter subscription trial: card required, 14 days free via PayPal trial period, then $79/provider/mo. Org starts as standard_trial, webhook upgrades to starter.
  - Professional subscription trial: code + card required, 14 days free, then $149/provider/mo. Org starts as premium_trial, webhook upgrades to professional.
  - Subscription trials: 5 provider limit during trial (enforced in create_staff_user via trial_end_date). Lifts after PayPal charges.
  - If user skips PayPal checkout, they keep their PAyG trial. No dead state.

Providers = doctors + nurses (paid seats). Admin staff (receptionists, managers, marketers, reviews) = free.

**Marketing budget (internally "credits")** is used for: Opus conversations (4 credits, Business only), Marketing SMS (0.1 credits, all plans), Marketing AI scans (1 credit per 1K, all plans). Overage at $1 each via purchase or recharge system. Subscription plans never show the word "credits" to users — they see "marketing budget" and what it buys (SMS count, scan count). PAyG users see "credits."

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

### Per-Feature Budget System (Subscription Plans)

Subscription plans use per-feature budget enforcement. Each feature (Marketing SMS, AI Scans, Premium AI) has its own cap. One feature cannot consume another's allocation.

**Per-feature caps (computed from plan, stored nowhere):**

| Plan | Marketing SMS | AI Scans | Premium AI |
|---|---|---|---|
| Starter | 10 cr (100 SMS) | 10 cr (10K scans) | 3.5 cr (1 convo at $3.50) |
| Professional | 50 cr (500 SMS) | 50 cr (50K scans) | 15 cr (5 convos at $3.00) |
| Business | 100 cr (1K SMS) | 100 cr (100K scans) | 62.5 cr (25 convos at $2.50) |

**Deduction flow** (via `check_and_deduct_feature_budget`, org row locked with FOR UPDATE):
1. Compute included cap for this feature from plan
2. Count net feature usage this cycle from `credits_log` (SUM includes refunds)
3. If under cap → deduct (insert into credits_log, do NOT update credits_used)
4. If over cap → check `budget_topups` table (feature-specific first, then general, FIFO)
5. If top-up available → deduct from top-up
6. All exhausted → blocked

**Per-visit Premium AI override:** Receptionists can set individual visits to use Premium AI via `set_visit_ai_override`. Budget is checked before allowing. The `visits.ai_model_override` column overrides the location's default AI model for that visit only. This is the recommended way for Starter/Professional to use their Premium AI taste allocation — one patient at a time, not by setting the entire location to advanced.

**Premium AI taste:** Starter gets 1 free Opus conversation per month, Professional gets 5. If the LOCATION is set to advanced on these plans, all conversations at that location use Opus, which exhausts the taste allocation quickly. The per-visit override is better UX.

**Idempotency:** `deduct_credits` checks `credits_log` for existing entries with `credit_type IN ('conversation', 'premium_ai')` before deducting. The unique index `(visit_id, credit_type)` provides defense-in-depth. Subscription plans tag entries as `'premium_ai'`, PAyG as `'conversation'`.

**No 80% alerts for subscription plans:** The alert code in `deduct_credits` only runs for PAyG/trials. Subscription plans use per-feature usage bars in the dashboard as visual feedback instead.

**Premium AI tiered pricing:** Opus conversations cost different amounts per plan:
- Starter: $3.50/conversation (3.5 credits)
- Professional: $3.00/conversation (3 credits)
- Business: $2.50/conversation (2.5 credits)
- PAyG/trials: $4.00/conversation (4 credits)

The price override happens inside `check_and_deduct_feature_budget` when `p_feature = 'premium_ai'`. PAyG/trials use the original 4-credit amount via the old `credits_total/credits_used` path.

**Top-ups** (`budget_topups` table): owners purchase additional budget per feature (SMS, scans, Premium AI) or general (works for any feature). Top-ups never expire and persist across billing cycles until fully consumed (FIFO). This is intentionally different from PAyG, where purchased overage credits expire at cycle reset when `credits_total` is overwritten.

**Two separate systems:**
- **PAyG/Trials:** `credits_total` / `credits_used` on organizations. `reset_monthly_credits` resets both. Purchased overage adds to `credits_total` and expires at cycle reset.
- **Subscription plans:** Per-feature caps computed in `check_and_deduct_feature_budget`. Usage tracked via `credits_log` SUM filtered by `billing_cycle_start`. `credits_total = 0` (unused). Purchased top-ups in `budget_topups` table, persist until consumed.

### Credit Flow (PAyG and Trials)

PAyG and trials use the original credit system unchanged:
1. **Check**: `start_ai_conversation` calls `check_credits` (credits_total - credits_used + recharge)
2. **Deduct**: `deduct_credits` updates `credits_used` on first patient message
3. **Alert**: at 80% of effective capacity, email alert sent to owner
4. **Reset**: monthly cron or PayPal webhook resets credits

### Recharge System

For PAyG: recharge is the primary credit source. 30 day rolling cycle. Unused credits expire.
For subscription plans: recharge is NOT used for per-feature budgets. Top-ups handle overflow instead.

**Configuration**: owners set a `recharge_limit` (1 to 10,000). Setting to null disables it.

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
- `deduct_credits.core-sql` — routes to per-feature budget for subscription plans, credits_total for PAyG/trials. Idempotency via visit_id + credit_type check.
- `check_and_deduct_feature_budget.core-sql` — per-feature budget enforcement (included cap → top-ups → blocked). Accepts visit_id for tracking.
- `purchase_feature_topup.core-sql` — owner buys feature-specific or general top-ups
- `set_visit_ai_override.core-sql` — receptionist sets per-visit Premium AI override (checks budget before allowing)
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
- `count_active_providers.core-sql` — counts doctors + nurses for PayPal quantity
- `start_ai_conversation.core-sql` — conditional credit check (PAyG/trials only), returns subscription_plan + ai_model (with visit override)
- `trigger_review_sms.core-sql` — SMS free for subscription plans, credits only for PAyG

### Edge Functions (in `supabase/functions/`)
- `billing-webhook/` — PayPal webhook handler (signature verification, idempotency, event routing)
- `ai-conversation/` — plan-based model selection (Standard/Advanced/Premium AI), per-visit override support, conditional credit deduction via check_and_deduct_feature_budget
- `generate-summary/` — summary Sonnet (Opus for Business+advanced). Diagnostic Opus for Professional+. All diagnostics free.

### UI Components
- `src/components/billing/CreditDashboard.tsx` — subscription plans: plan overview + per-feature usage bars. PAyG: credit gauge + daily chart.
- `src/components/billing/RechargeConfig.tsx` — auto recharge toggle (PAyG only, subscription plans use top-ups)
- `src/components/billing/OveragePurchase.tsx` — subscription plans: feature-specific top-ups. PAyG: credit purchase.
- `src/components/billing/SubscriptionManager.tsx` — plan cards with monthly/annual toggle, PayPal checkout
- `src/components/billing/CancelSubscription.tsx` — cancellation flow
- `src/app/(dashboard)/d/owner/billing/page.tsx` — billing dashboard page
- `src/components/admin/AdminEnterprise.tsx` — enterprise plan management (admin only)
- `src/app/(dashboard)/d/admin/enterprise/page.tsx` — enterprise admin page

### Server Actions
- `src/app/(dashboard)/d/_actions/billing.ts` — all billing RPC wrappers
- `src/app/(dashboard)/d/_actions/admin.ts` — platform admin actions (premium codes, enterprise management)

### Database
- `sql/tables/organizations.core-sql` — credits_total, credits_used (PAyG only), recharge_limit, recharge_used, billing_cycle_start, billing_interval, current_period_end
- `sql/tables/credits_log.core-sql` — per deduction log. credit_type tags feature (conversation, premium_ai, marketing_sms, marketing_scan, diagnostic). UNIQUE on (visit_id, credit_type).
- `sql/tables/budget_topups.core-sql` — feature-specific and general top-ups for subscription plans. Never expire. FIFO consumption.
- `sql/tables/processed_webhook_events.core-sql` — PayPal webhook idempotency
- `visits.ai_model_override` — per-visit Premium AI override set by receptionist

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
