# Affiliate Program

## How It Works

Hilt Health pays partners 30% lifetime commission on every payment from clinics they refer. The program lives at `/affiliate` and reuses the existing `approval_codes` + `request_premium_code` + `create_organization` infrastructure with a thin attribution layer on top.

A partner is an entry in `public.partners`, tied to a Supabase auth user. Once registered, they get one **affiliate code** they can share publicly (multi-use, lifetime), and can generate as many **premium-trial codes** as they want (single-use, targeted at a specific clinic, capped at 20 per 24 hours per partner). Both code types attribute the partner when the clinic signs up. The premium-trial code additionally grants the clinic a 30-day, 200-credit trial (same benefit as the existing organic premium-trial flow); the affiliate code does not change the clinic's trial.

Attribution happens inside `public.create_organization` when the clinic enters a code at signup. The function looks the code up first in `approval_codes` (premium trial), then in `affiliate_codes` (multi-use), captures the partner_id, and writes a `partner_referrals` row keyed UNIQUE on org_id (first-touch wins, race-safe via `ON CONFLICT DO NOTHING`). Self-referral is blocked (auth.uid match, email match, non-generic-domain match) and a velocity guard auto-suspends partners who push 5+ referrals in 24h.

Commissions are recorded by the PayPal `billing-webhook` on every `PAYMENT.SALE.COMPLETED` for a referred org. The webhook filters to USD subscription payments only (skips one-off addons, non-USD, $0 trial activations), then calls `record_partner_commission(org_id, amount_cents, event_id, payment_date)`. The function is idempotent (`payment_event_id` UNIQUE), serialized per partner via `FOR UPDATE`, and sets `eligible_for_payout_at` to payment_date + 30 days (60 days for the partner's first commission ever, 90 days while a PayPal dispute is open, or `partners.hold_days_override` if admin set one). Refunds and reversals call `record_partner_clawback` which either flips the original commission to `clawed_back` (if not yet paid) or inserts a negative-amount offset row (if already paid) that nets out at the next payout.

Payouts are manual via PayPal for v1. The platform admin opens `/d/admin/affiliate`, sees partners with ≥ $50 net eligible balance and tax requirements satisfied, sends PayPal manually, and clicks "Mark paid" with a transaction reference. The function locks all eligible commission rows (positive + negative offsets), nets them, inserts a `partner_payouts` row with the net amount, and updates only the locked rows to `status='paid'` (race-safe — concurrent commission INSERTs are not silently included). US partners crossing $600 lifetime earnings are blocked from payout until they email a W-9 to `partners@hilthealth.com` and the admin marks `tax_form_status='verified'`.

Partners share their code as either the raw 8-character string or a link `https://hilthealth.com/signup?code=ABCD1234`. Middleware drops a non-security `hh_ref` cookie when `?ref=CODE` is in any URL on the marketing site, purely as a textbox-prefill memo for the signup form. The cookie is `HttpOnly=false`, last-touch overwrite, 90-day TTL — the user can edit or clear the field freely. Real attribution validation is server-side inside `create_organization`. The signup form looks up the partner via `lookup_partner_by_code` (anon-callable RPC) and shows a "Referred by [Display name]" or "Premium trial code applied" badge.

## Files That Represent It

### Database
- `sql/tables/partners.core-sql` — partner profile, FK to auth.users(id) ON DELETE NO ACTION
- `sql/tables/affiliate_codes.core-sql` — multi-use codes, UNIQUE partial `(partner_id) WHERE is_active=true`
- `sql/tables/partner_referrals.core-sql` — org → partner mapping, UNIQUE on org_id
- `sql/tables/partner_commissions.core-sql` — per-payment ledger, UNIQUE on payment_event_id
- `sql/tables/partner_payouts.core-sql` — manual payout records (PayPal txn references)
- `sql/tables/partner_tos_versions.core-sql` — versioned TOS content
- `sql/tables/approval_codes.core-sql` — added `partner_id` column
- `sql/tables/organizations.core-sql` — added `signup_ip_hash` and `updated_at` columns

### SQL functions
- `sql/requesting_partner_id.core-sql` — JWT helper, mirrors `requesting_org_id()`
- `sql/hash_signup_ip.core-sql` — HMAC-SHA256 over IP using vault secret `partner_ip_pepper`
- `sql/register_partner.core-sql` — anonymous-flow signup (post-OTP)
- `sql/register_partner_for_existing_user.core-sql` — clinic owner adopting a partner role
- `sql/update_partner_profile.core-sql` — partner-callable profile editor
- `sql/partner_create_affiliate_code.core-sql` — idempotent code generator with optional force-replace
- `sql/partner_create_premium_trial_code.core-sql` — wraps `request_premium_code` with consent + rate limit
- `sql/get_partner_dashboard.core-sql` — top-level dashboard read
- `sql/get_partner_referrals.core-sql`, `sql/get_partner_commissions.core-sql`, `sql/get_partner_payouts.core-sql`
- `sql/lookup_partner_by_code.core-sql` — anon banner lookup
- `sql/record_partner_commission.core-sql` — service-role only, idempotent
- `sql/record_partner_clawback.core-sql` — service-role only, handles paid vs unpaid commissions
- `sql/extend_commission_dispute_hold.core-sql`, `sql/reset_commission_hold.core-sql` — dispute lifecycle
- `sql/admin_list_partners.core-sql`, `sql/admin_get_pending_payouts.core-sql`, `sql/admin_create_payout.core-sql`, `sql/admin_adjust_partner_status.core-sql`, `sql/admin_attach_tax_form.core-sql`
- `sql/create_organization.core-sql` — extended with code lookup, attribution, self-referral guard, velocity guard, slug retry
- `sql/request_premium_code.core-sql` — added `p_partner_id` and claim-or-create logic
- `sql/process_premium_approvals.core-sql` — forks email body when code is partner-attributed
- `sql/expire_stale_sessions.core-sql` — added partner-trial-code 30-day expiry block

### Edge function
- `supabase/functions/billing-webhook/index.ts` — added commission recording, clawback on REFUNDED/REVERSED, dispute hold extend/reset, USD/billing-agreement filtering

### Frontend
- `src/app/(marketing)/affiliate/page.tsx` — public landing with hero, how-it-works, earnings calculator, FAQ
- `src/app/(marketing)/affiliate/terms/page.tsx` — renders latest TOS version from DB
- `src/app/(auth)/affiliate/signup/page.tsx`, `…/affiliate/connect/page.tsx`, `…/affiliate/verify/page.tsx`
- `src/app/(affiliate)/layout.tsx` + `…/affiliate/dashboard|codes|referrals|earnings|profile|terms` pages
- `src/app/(dashboard)/d/admin/affiliate/page.tsx` — platform admin payouts + partners
- `src/components/affiliate/*` — PartnerSignupForm, PartnerConnectForm, PartnerShell, StatsCards, RecentReferrals, RecentCommissions, CodesPanel, ProfileForm
- `src/components/admin/AffiliateAdminPanel.tsx`
- `src/components/Navbar.tsx` — added "Affiliate" link
- `src/components/OwnerSignUpForm.tsx` — added collapsible code field, ?ref/?code/cookie prefill, banner via `lookup_partner_by_code`, cookie cleared after attribution
- `src/lib/auth.ts` — added `getPartnerByAuthUid`
- `src/app/(dashboard)/d/select-role/page.tsx` — partner-only redirect to `/affiliate/dashboard`, dual-role banner
- `src/components/dashboard/AdminSidebar.tsx` — added Affiliate nav entry

### Config
- `src/lib/constants.ts` — `PARTNER_COMMISSION_RATE`, hold days, payout threshold, tax thresholds, cookie name + TTL, `PARTNER_TOS_VERSION`
- `middleware.ts` — `hh_ref` cookie set on `?ref=` query, route protection for `/affiliate/dashboard|codes|referrals|earnings|profile`
- Vault secret: `partner_ip_pepper` (HMAC pepper for IP hashing)

## Dependencies

**Relies on:**
- `pending_emails` queue + `process-email-queue` edge function (welcome-on-first-commission, partner-trial approvals, admin alerts)
- `process_premium_approvals` cron (sends partner-template approval emails on partner-generated codes)
- `expire_stale_sessions` daily cron (expires partner trial codes after 30 days unused)
- `billing-webhook` edge function and `processed_webhook_events` table (PayPal event ingestion + idempotency)
- Supabase auth + JWT app_metadata (writes `partner_id` to enable `requesting_partner_id()`)
- Supabase Vault (`partner_ip_pepper` secret)
- The existing `is_platform_admin` JWT claim convention (used by all `admin_*` functions)
- `audit_trail` (write target for partner_referral_attributed and partner_velocity_suspend events)

**Relies on it:**
- `/d/admin/affiliate` admin page reads `admin_list_partners` and `admin_get_pending_payouts`
- The Navbar Affiliate link drives marketing traffic to `/affiliate`
- `/d/select-role` checks for a partners row to route partner-only users to `/affiliate/dashboard`

## Testing

### Covered by smoke tests run during build
- Partner registration → JWT app_metadata write → `partners` row created
- Affiliate-code attribution → `partner_referrals` row created, `uses_count++`, `partner_attributed: true`
- Commission recording with correct hold (30 days, 60 for first commission)
- Idempotency on duplicate `payment_event_id`
- Clawback flips pending commissions to `clawed_back` and decrements totals
- Negative-offset commissions net out at next payout
- `admin_create_payout` settles only the locked-and-summed eligible rows (race-safe against concurrent INSERTs)
- All four JSON-building functions (`get_partner_dashboard`, `get_partner_referrals`, `admin_list_partners`, `admin_get_pending_payouts`) return non-null `rows` and `total`
- Slug-collision retry up to 5 attempts in `create_organization`

### Needs manual verification
- Real PayPal webhook integration (test via PayPal sandbox: `BILLING.SUBSCRIPTION.ACTIVATED` → `PAYMENT.SALE.COMPLETED` → `PAYMENT.SALE.REFUNDED` → `CUSTOMER.DISPUTE.CREATED`/`RESOLVED`)
- Cookie pre-fill across browse-then-signup (`/?ref=CODE` → navigate → `/signup` → field pre-filled)
- Sign-up flow including OTP for both partner and clinic owner paths
- Email content rendering for partner-template trial code
- Tax form gate at the $600 threshold (banner appears on dashboard, payouts blocked)
- Velocity guard auto-suspending a partner after 5 signups in 24h (alert email queued, partner.status flipped, attribution skipped on the triggering signup)
- Partner status state machine: active → suspended → active, active → banned (verifies pending commissions get clawed_back on ban)
