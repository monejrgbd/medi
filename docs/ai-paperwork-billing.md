# AI Paperwork Billing

## How It Works

AI paperwork is every `clinical_documents` row drafted by the `generate-document-content` edge function: SOAP notes, referral letters, work and school notes, prior authorization, custom letters. It was free and bundled until this change; it now follows the **same paid model as the AI scribe**.

Trigger to logic to outcome: a doctor (or the scribe pipeline) creates a document via `create_document` (status `drafting`, 20 docs per visit per day spam cap unchanged), then `generate-document-content` runs. That function resolves the clinic's AI tier the same way scribe does, `aiModelToTier(visit.ai_model_override ?? location.ai_model)`, and then does two things: a **preflight** before the expensive AI call, and a **charge** after the document is successfully drafted.

Preflight: for metered plans only (`subscription_plan` not in starter/professional/business/enterprise, mirroring `deduct_scribe_credits` plan partitioning so pay as you go, trials, expired and suspended are all gated), if the org cannot afford one document at its tier rate the document is marked `failed` and the AI is never called. Subscription plans are plan included and skip the preflight.

Charge: after the row is updated to `drafted`, `deduct_document_credits` is called (non fatal, logged on error, never fails the already saved document). Subscription plans return `plan_included` with no ledger row. Pay as you go and trials are metered per finished document by model tier: Standard 0.2, Advanced 0.3, Precision and Premium 0.5 credits per document. Billing is idempotent per `document_id` (regenerating the same document never double charges; a new document is a new charge). Scribe originated SOAP notes are **not** exempt, they incur both the per minute scribe charge and this per document charge by product decision ("charge both").

The only genuinely new infrastructure is **document scoped idempotency**: a single visit can produce many documents and `clinical_documents.visit_id` is nullable, so paperwork cannot key on `(visit_id, credit_type)` like scribe. `credits_log` gained a nullable `document_id` column with its own partial unique index, and the shared metering engine `private.check_and_deduct_feature_budget` gained an optional `p_document_id` path that keys idempotency on the document and forces the ledger row's `visit_id` NULL so it can never collide with the visit unique index.

## Files That Represent It

- `sql/tables/credits_log.core-sql` (appended idempotent ALTER: `document_id` column, FK to `clinical_documents(id)` ON DELETE SET NULL, partial unique index `idx_credits_log_document_type_unique`, plain index `idx_credits_log_document`)
- `sql/check_and_deduct_feature_budget.core-sql` (trailing `p_document_id uuid DEFAULT NULL` on private and public, mutual exclusion guard, document scoped block in the PAYG branch)
- `sql/deduct_document_credits.core-sql` (new thin policy wrapper, mirror of `deduct_scribe_credits`)
- `supabase/functions/generate-document-content/index.ts` (tier resolution via `aiModelToTier`, paperwork preflight before the AI call, non fatal `deduct_document_credits` after status `drafted`)
- `src/app/(marketing)/pricing/page.tsx` (EVERY_PLAN_FEATURES line, AI_METERED rows, AI tiers FAQ sentence)

## Dependencies

Relies on: `private.check_and_deduct_feature_budget` (the one shared metering engine, also used by `deduct_credits` and `deduct_scribe_credits`), `aiModelToTier` (`_ai-providers/types.ts`, re-exported by `index.ts`), the `clinical_documents` lifecycle, `credits_log` and its new partial unique index, the `organizations` credit pool (`credits_total`/`credits_used`). Relied on by: every document drafting path, including the scribe pipeline (`transcribe-encounter` triggers `generate-document-content`).

`check_and_deduct_feature_budget` must be deployed atomically (`psql --single-transaction`): this change drops the live 5 arg signature before creating the 6 arg one, and `deduct_credits` and `deduct_scribe_credits` call it.

## Testing

Server side verified: SQL deployed, `tsc` and `npm run build` green, live rolled back transaction checks — subscription org returns `plan_included` with no ledger row; trial org charged once then idempotent on retry; two documents on one visit both charged (proves visit collision is gone); NULL visit document charged on `document_id`; scribe visit produces two distinct ledger rows (`scribe` keyed on visit, `paperwork` keyed on document); paperwork preflight blocks a short org with no AI call and `status=failed`; existing `deduct_scribe_credits` / `deduct_credits` / marketing paths unchanged.

Needs manual verification: a real document drafted in the browser on a metered org draws exactly one `paperwork` row at the expected tier rate; an org taken to zero credits sees the document fail with `insufficient_credits` and no AI output.

## Accepted Tradeoff

The scribe preflight only guarantees one minute; a recording that clears the floor then runs long completes once and is delivered even though the post recording charge then refuses on `no_credits` (logged, not deducted). Worst case is one recording's AI cost, then the next recording is blocked until top up. The stricter "withhold the cleanup and SOAP if the post charge fails" option was explicitly declined.
