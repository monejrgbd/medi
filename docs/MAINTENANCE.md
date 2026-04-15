# Maintenance Checklist

## Daily
- **[email]** Verify `process-email-queue` edge function is running (check pending_emails for stuck rows)
- **[ai]** Monitor AI conversation edge function errors in Supabase logs
- **[ai-flow]** Spot-check `generate-summary` edge function logs for the expected mode pattern: nurse-enabled visits should show two invocations per visit (`mode: summary_only` then `mode: diagnostic_only`); non-nurse should show one (`mode: full`). Repeated `mode: full` fallback fires from `claim_patient` indicate the AI is failing to emit `[CONVERSATION_COMPLETE]` — review and re-strengthen the system prompt in `start_ai_conversation.core-sql` if frequency is non-trivial.
- **[credits]** Verify `credit_reset` cron runs successfully (check audit_trail for `monthly_credit_reset` entries)

## Weekly
- **[credits]** Review recharge usage across orgs (query `recharge_used > 0` on organizations for active recharge consumption)
- **[demo]** Check demo org credit balance (should be ~99999, each demo uses ~1.5 credits)
- **[demo]** Review `demo_access` table for unusual patterns (spam, abuse)
- **[reviews]** Verify review platform rotation is working (`review_rotation` cron)

## Monthly
- **[demo]** Verify demo staff user checkins are still active (`staff_checkins` table)
- **[demo]** Verify demo org subscription hasn't been modified (should be enterprise, trial_end 2099)
- **[billing]** Review credit usage across all orgs
- **[security]** Review audit trail for suspicious activity
