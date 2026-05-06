# Maintenance Checklist

## Daily
- **[email]** Verify `process-email-queue` edge function is running (check pending_emails for stuck rows)
- **[ai]** Monitor AI conversation edge function errors in Supabase logs
- **[ai-flow]** Spot-check `generate-summary` edge function logs for the expected mode pattern: nurse-enabled visits should show two invocations per visit (`mode: summary_only` then `mode: diagnostic_only`); non-nurse should show one (`mode: full`). Repeated `mode: full` fallback fires from `claim_patient` indicate the AI is failing to emit `[CONVERSATION_COMPLETE]` — review and re-strengthen the system prompt in `start_ai_conversation.core-sql` if frequency is non-trivial.
- **[credits]** Verify `credit_reset` cron runs successfully (check audit_trail for `monthly_credit_reset` entries)
- **[affiliate]** Watch for `partner_velocity_suspend` audit_trail entries. Each one means a partner hit 5+ referrals in 24h and was auto-suspended; review their referrals for fraud signals (matching IP hashes, similar emails) and decide whether to ban, restore, or leave suspended.

## Weekly
- **[credits]** Review recharge usage across orgs (query `recharge_used > 0` on organizations for active recharge consumption)
- **[demo]** Check demo org credit balance (should be ~99999, each demo uses ~1.5 credits)
- **[demo]** Review `demo_access` table for unusual patterns (spam, abuse)
- **[reviews]** Verify review platform rotation is working (`review_rotation` cron)
- **[affiliate]** Process pending payouts at `/d/admin/affiliate` → Pending Payouts tab. For each partner listed, send PayPal manually to their `payout_email` and click "Mark paid" with the transaction reference. Partners with US country and `total_earned_cents >= 60000` are auto-excluded until their `tax_form_status='verified'` — chase those for a W-9.

## Monthly
- **[demo]** Verify demo staff user checkins are still active (`staff_checkins` table)
- **[demo]** Verify demo org subscription hasn't been modified (should be enterprise, trial_end 2099)
- **[billing]** Review credit usage across all orgs
- **[security]** Review audit trail for suspicious activity
- **[affiliate]** Reconcile commissions vs PayPal: `SELECT SUM(amount_cents) FROM partner_payouts WHERE created_at > current_date - 31` should match the total of PayPal manual transfers logged for partners that month. Spot-check 2-3 partners' totals on their `/affiliate/dashboard` view against the admin row in `/d/admin/affiliate`.
- **[affiliate]** Year-end (January): for each US partner with `total_earned_cents >= 60000` over the prior calendar year, prepare and mail a 1099-NEC. Tax form status field is informational only — actual mailing is manual.
