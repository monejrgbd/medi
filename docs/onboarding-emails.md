# Onboarding Email Pipeline

## How It Works

Hilt Health sends a 10-email behavior-triggered sequence to clinic owners from signup through full activation (10 completed visits), plus a recurring retention check-in for activated clinics that go quiet, plus a one-time pre-signup nurture for prospects who submitted their email but never created an account. Emails are not on a fixed Day-N calendar; instead each one fires when the owner's clinic (or prospect's email) enters a specific state (some immediately via SQL function triggers, some via daily crons that check per-org / per-email state). Sender is always "Mike at Hilt Health" via `mike@hilthealth.com`, plain-text founder voice, one CTA per email, every reply lands in Mike's actual inbox.

The 10 emails split into two categories. **Event-triggered (3)**: `first_completion` (fires from inside `complete_visit` when an org's completed-visit count crosses 0→1), `graduation` (fires from inside `complete_visit` when the count reaches 10), and `first_credit_low` (fires from inside `deduct_credits` the first time an org on PAYG or trial hits 80% credit usage, pitches monthly plans vs PAYG). **State-checked (7)** run from two crons. The `onboarding_welcome` cron runs every minute and queues `welcome` for any org that has lived 2+ minutes without a welcome log entry — the 2 minute delay lets the owner push through the rest of the setup wizard before the welcome lands in their inbox instead of arriving mid-wizard. The `onboarding_stuckness` cron runs at 14:00 UTC daily and handles `setup_incomplete`, `distribution_help`, `visit_abandoned`, `scale_to_ten`, `activated_dropoff`, `silent_dropoff`. Each cron-checked email has its own predicate (e.g. distribution_help fires 2+ days after wizard finished with zero visits). All states are evaluated independently per cron run so escalations work — an org can get `scale_to_ten` at day 7 and then `activated_dropoff` at day 21 if rhythm never recovers.

Single-fire idempotency comes from the `onboarding_email_log` table — primary key on `(org_id, email_key)` plus an `INSERT ... ON CONFLICT DO NOTHING` claim inside the helper guarantees each email key sends at most once per org, even under concurrent transactions (`complete_visit` race). The multi-fire `silent_dropoff` (10+ completed clinic that has gone silent for 21+ days) bypasses the log via the `p_skip_log` helper parameter and tracks its own cooldown via `organizations.last_silent_dropoff_at`, updated atomically with the queue INSERT so a failed queue does not falsely advance the timestamp. A backfill guard (`organizations.created_at >= '2026-05-23'::date`) in the cron prevents pre-deploy orgs from getting blasted on the first run. Unsubscribe is split across two prefs on `notification_preferences`: `email_onboarding` (for the transient onboarding sequence) and `email_retention_checkins` (for `silent_dropoff` only) so a power user who unsubscribed during the trial can still get retention check-ins later. Owners click an `Unsubscribe from {category}` link in the HTML footer of every email; the existing `unsubscribe` edge function flips the right pref column based on the HMAC-signed token's `pref_type` claim.

### Pre-signup nurture

Separate from the post-signup onboarding sequence, the `capture_nurture` cron sends a one-time nurture email to anyone who submitted their email to `email_captures` but did not create an account within 7 days. Idempotency lives on the `email_captures.nurture_email_sent_at` column (timestamp updated atomically with the queue INSERT). The cron predicate excludes captures older than 30 days (avoids ancient-list blast), already-nurtured rows (per-email, case insensitive), captures whose email matched a real `auth.users` row (they signed up after all), and emails that have already unsubscribed via `email_onboarding = false`. Reuses the `email_onboarding` pref because a person who said "stop emailing me from Hilt" should be silenced across both pre-signup and post-signup contexts. Cron runs at `15 14 * * *` UTC, 15 minutes after the onboarding cron, to keep the nurture wave from colliding with the main cron load.

## Files That Represent It

### Database
- `sql/tables/onboarding_email_log.core-sql` — single-fire idempotency, PK on `(org_id, email_key)`, ON DELETE CASCADE to organizations
- `sql/tables/notification_preferences.core-sql` — added `email_onboarding` and `email_retention_checkins` boolean columns (default true)
- `sql/tables/organizations.core-sql` — added `onboarding_completed_at` (was missing from canonical schema despite existing in prod) and new `last_silent_dropoff_at` (multi-fire cooldown for `silent_dropoff`)
- `sql/tables/pending_emails.core-sql` — added `from_email` column so each email can specify its own actual From address (defaults to `notifications@hilthealth.com` if unset, regex-validated against `*@hilthealth.com` in the edge function)
- `sql/tables/email_captures.core-sql` — added `nurture_email_sent_at` (per-email idempotency for pre-signup nurture)

### SQL functions
- `sql/send_onboarding_email.core-sql` — single helper, all 10 email subject/body templates in a CASE on `p_email_key`. Looks up owner via `staff_users WHERE username='owner'` → `auth.users.email`. First-name extraction: split_part(full_name) → fallback to email local part if name is empty or the wizard-default literal "Owner". HTML escapes interpolated values, wraps text in `<pre>` for plain-text inbox render, appends unsubscribe footer with the correct pref_key (`retention_checkins` for silent_dropoff, `onboarding` for everything else). Optional `p_skip_log` parameter for multi-fire emails. For `silent_dropoff` only, updates `last_silent_dropoff_at = now()` atomically with the queue INSERT.
- `sql/send_onboarding_stuckness_check.core-sql` — cron processor. Independent IF blocks per state (no IF/ELSIF chain) so multiple emails can fire across cron runs as time advances. Backfill guard in the outer WHERE.
- `sql/onboarding_stuckness_cron.core-sql` — registers `onboarding_stuckness` job at `0 14 * * *` (14:00 UTC). Unschedules before scheduling so redeploys do not duplicate.
- `sql/send_onboarding_welcome_check.core-sql` — minute-cadence processor that queues welcome for orgs 2+ minutes old without a welcome log row. Helper's log PK enforces send-once even if cron fires twice. At deploy time, every existing org was backfilled with a `(org_id, 'welcome')` log row so they cannot get a duplicate welcome.
- `sql/onboarding_welcome_cron.core-sql` — registers `onboarding_welcome` job at `* * * * *` (every minute). Unschedules before scheduling.
- `sql/send_capture_nurture.core-sql` — builds and queues the pre-signup nurture email for a given email address, atomically stamps `email_captures.nurture_email_sent_at` for all rows of that email
- `sql/send_capture_nurture_check.core-sql` — cron processor; iterates eligible distinct emails per the predicate above
- `sql/capture_nurture_cron.core-sql` — registers `capture_nurture` job at `15 14 * * *` (14:15 UTC), unschedules before scheduling
- `sql/create_organization.core-sql` — does NOT fire welcome inline. Welcome is queued by the `onboarding_welcome` minute cron 2+ minutes after org creation
- `sql/complete_visit.core-sql` — milestone PERFORM after status update, `count >= 10` for graduation and `count >= 1` for first_completion (with `NOT EXISTS log` guard since equality-on-count would lose under concurrent commits)
- `sql/deduct_credits.core-sql` — `first_credit_low` PERFORM inside the existing 80% threshold check, gated on `subscription_plan IN ('standard_trial', 'premium_trial', 'pay_as_you_go')`. Runs before the existing recurring `Credits Running Low` transactional alert (which is per-cycle, not one-time, and uses a separate `email_credit_alerts` pref).

### Edge function
- `supabase/functions/process-email-queue/index.ts` — updated to use `email.from_email` as the From address when set (regex-validated to `*@hilthealth.com` to prevent spoofing), falling back to `notifications@hilthealth.com`. Deployed with `--no-verify-jwt` (internal function, auth via `x-internal-secret` header). Comment at top documents this.

### Frontend
- None. This is a backend-only system.

## Dependencies

**Relies on:**
- `pending_emails` queue and `trg_process_email_on_insert` trigger (every helper INSERT auto-fires `process-email-queue`)
- `process-email-queue` edge function (Resend send, retry up to 5, status updates, pref check via `metadata.pref_key`)
- `unsubscribe` edge function (dynamic `email_{pref_type}` column flip — auto-supports `email_onboarding` and `email_retention_checkins` without changes)
- `private.generate_unsubscribe_token(email, pref_type)` (HMAC token gen for the unsubscribe footer)
- `pg_cron` extension for the daily `onboarding_stuckness` job
- Vault secrets `edge_function_url` and `unsubscribe_secret`
- `staff_users` row convention (`username = 'owner'` identifies the org owner)
- `auth.users.email` (where the owner's real email lives)
- `cal.com/102937474/hilt-health-meeting` (booking link, hardcoded in helper, used by 4 of the 10 emails)

**Relies on it:**
- Nothing else reads from `onboarding_email_log` or `last_silent_dropoff_at` — these are private to this system

## Testing

### Verified working end-to-end (post-deploy live test)
- Welcome email auto-queued and sent via Resend within 60s of a real organic signup (clinic best org, 2026-05-23)
- Helper correctly handles the wizard-default "Owner" full_name by falling back to email local part (verified by resending welcome to jameskezos)
- Manual welcome resend to a specific pre-deploy org (Spa) works via `PERFORM private.send_onboarding_email(org_id, 'welcome')`
- `from_email = 'mike@hilthealth.com'` properly routes through edge function regex check and shows up as From: `Mike at Hilt Health <mike@hilthealth.com>` in inbox
- `onboarding_stuckness_check` cron function runs without errors against full production org table
- Backfill guard correctly excludes pre-deploy orgs from cron-checked state emails

### Needs manual verification on real signups over time
- Each of the 6 state-checked emails firing at the right predicate (cron runs daily, expect within 24h of state entry)
- `first_completion` event firing on the right visit, not duplicating
- `graduation` event firing on the 10th completion, exiting the sequence
- Race protection on concurrent `complete_visit` calls (PK + ON CONFLICT in helper)
- `first_credit_low` firing at exactly the right moment in `deduct_credits` for PAYG/trial orgs hitting 80%
- `silent_dropoff` multi-fire cooldown (21 days between sends for the same activated-then-quiet clinic)
- Unsubscribe per pref: onboarding unsubscribe does NOT block retention check-ins, and vice versa
- Plain text rendering across Gmail, Apple Mail, Outlook (the `<pre>` wrapper preserves line breaks without monospace font)
- Reply routing: replies to `mike@hilthealth.com` actually reach Mike's inbox

### Out of scope for v1 (deferred)
- Sales Safari research to refine subject lines with real clinic-owner vocabulary
- Multi-sender ("Tune In Tomorrow") pattern with founder + CS lead + designer
- Retrofitting OTHER transactional emails (failed payment, daily digest, payouts) with onboarding/retention content
- Per-plan-tier customization and cancelled-account reactivation sequences
- Timezone-aware send windows
- A/B testing subject lines
