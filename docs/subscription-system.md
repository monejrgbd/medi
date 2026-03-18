# Subscription and Credit System

## How It Works

Hilt Health uses a credit based billing model. Each AI pre-screening visit consumes credits (1.5 for Standard AI, 4 for Advanced AI). Organizations get credits through their subscription plan or through the recharge system.

### Plans and Credit Allocations

| Plan | Credits/Month | Billing |
|------|--------------|---------|
| Starter | 125 | PayPal subscription |
| Standard | 500 | PayPal subscription |
| Plus | 1,500 | PayPal subscription |
| Enterprise | 5,000 | PayPal subscription |
| Pay as you go | 0 (recharge only) | Per credit used |
| Trial (Standard/Premium) | 20 (default) | Free |

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

### Billing Lifecycle

| Event | Trigger | SQL Function | Recharge Impact |
|-------|---------|-------------|----------------|
| New subscription | PayPal webhook `BILLING.SUBSCRIPTION.ACTIVATED` | `activate_subscription` | recharge_used reset to 0 |
| Monthly renewal | PayPal webhook `PAYMENT.SALE.COMPLETED` | `reset_monthly_credits` | recharge_used reset to 0 |
| Payment failure | PayPal webhook `PAYMENT.SALE.DENIED` | `handle_payment_failure` | No change (gates block) |
| Escalation (3 failures/7d) | handle_payment_failure | Sets plan to `read_only` | Recharge irrelevant |
| Escalation (30d) | handle_payment_failure | Sets plan to `suspended` | Recharge irrelevant |
| Owner cancels | Dashboard action | `cancel_subscription` | Active until period end |
| External cancel | PayPal webhook `BILLING.SUBSCRIPTION.CANCELLED` | Direct update to `expired` | Gates block |
| Plan change | Dashboard action | `change_subscription_plan` | recharge_used reset, PAyG billing_cycle_start managed |
| PAyG enable recharge | Dashboard action | `set_recharge_limit` | billing_cycle_start = now(), recharge_used = 0 |
| PAyG disable recharge | Dashboard action | `set_recharge_limit` | billing_cycle_start = NULL |
| PAyG 30 day reset | Daily cron | `reset_monthly_credits` | Everything zeroed |
| Manual credit purchase | Dashboard action | `purchase_overage_credits` | Adds to regular pool, independent of recharge |

### Cron Jobs

- **credit_reset** (daily midnight): resets credits for subscription plans (after 1 month) and PAyG with recharge (after 30 days)
- **cron_cleanup** (daily 6 AM): expires stale sessions, follow ups, referrals, phone verifications, sends owner alerts

## Files That Represent It

### SQL Functions (in `sql/`)
- `check_credits.core-sql` — returns remaining capacity (regular + recharge)
- `deduct_credits.core-sql` — atomic credit deduction with recharge fallback and 80% alert
- `reset_monthly_credits.core-sql` — cycle reset (subscription and PAyG)
- `credit_reset_cron.core-sql` — daily cron scheduling
- `set_recharge_limit.core-sql` — owner configures recharge
- `activate_subscription.core-sql` — PayPal activation handler
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
- `src/components/billing/SubscriptionManager.tsx` — plan cards
- `src/components/billing/CancelSubscription.tsx` — cancellation flow
- `src/app/(dashboard)/d/owner/billing/page.tsx` — billing dashboard page

### Server Actions
- `src/app/(dashboard)/d/_actions/billing.ts` — all billing RPC wrappers

### Database
- `sql/tables/organizations.core-sql` — credit columns: credits_total, credits_used, recharge_limit, recharge_used, billing_cycle_start
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
