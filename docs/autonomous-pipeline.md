# Autonomous Pipelines

Chains that run without a human in the loop after a trigger: a SQL function fires
an edge function fire and forget (via `net.http_post`, vault secrets
`edge_function_url` + `internal_edge_secret` + `supabase_anon_key`), the edge
function does the work as service role, and a pg_cron job is the safety net for
anything that stalls. Internal edge functions are deployed `--no-verify-jwt` and
gated on the `x-internal-secret` header matching the `INTERNAL_EDGE_SECRET` env.

## AI Scribe (added May 2026)

Trigger: doctor presses Stop in the scribe panel.

```
finalize_scribe_recording (SQL, doctor-authed)
  creates the clinical_note_soap document (private.create_document)
  scribe_recordings.status = 'transcribing'
  net.http_post  ->  transcribe-encounter (edge, service role)
                        list scribe-audio segments
                        Google STT latest_long + 2-speaker diarization, sequential
                        write clinical_documents.scribe_transcript
                        deduct_scribe_credits  (PAYG metered / plans unlimited)
                        clinical_documents.status: draft -> drafting
                        fetch -> generate-document-content (edge)
                                   render SOAP -> status 'drafted'
```

Safety net: `scribe_timeout_check` (pg_cron, every minute) re-fires
`transcribe-encounter` for `scribe_recordings` stuck in `transcribing` for 10 to
30 minutes (the edge function is idempotent and resumes from the
`transcribed_segments` cursor), and hard-fails rows past 30 minutes, marking the
linked document `failed`.

Idempotency and resumability:
- Re-fire is safe: `transcribe-encounter` early-returns unless
  `scribe_recordings.status = 'transcribing'`.
- Long encounters: a 90 second wall-clock budget per invocation persists the
  partial transcript plus `transcribed_segments`, then returns; the cron resumes.
- Billing: one charge per visit, guarded by the `credits_log`
  `(visit_id, credit_type)` unique index, so retries never double-charge.

Terminal states: `scribe_recordings.status` ends `transcribed` (success),
`failed` (no audio, no segments, STT total failure, or timeout), `mic_denied`,
or `canceled`. On any failure path the linked document is left `draft` or set
`failed`; no orphan draft is created because the document is created at finalize
only, never at consent.

Human-in-the-loop boundary: the autonomous part ends at `drafted`. The doctor
then reviews, edits, and signs in `SoapNoteEditor`; signing, PDF, and delivery
are the existing (non-autonomous) document actions.

Full architecture: see `docs/ai-scribe-flow.md`.

## Existing autonomous pipelines (for reference)

- **AI intake -> summary/diagnostic**: `ai-conversation` emits
  `[CONVERSATION_COMPLETE]`, which triggers `generate-summary`; `claim_patient`
  is the fallback trigger; `ai_timeout_check` cron routes stale chats. See
  `docs/ai-conversation-flow.md`.
- **Clinical document drafting**: `draft_document_content` (SQL) fires
  `generate-document-content` (edge). The scribe reuses this exact stage; the
  render path was fixed (deep flatten of nested AI output) so SOAP notes render.
- **Email queue**: `pending_emails` rows are drained by the
  `process-email-queue` edge function on a cron.
- **Campaign SMS**: `process-campaign-sms` cron drains queued campaign messages.

## Operational notes

`docs/MAINTENANCE.md` carries the daily/weekly checks for the scribe (stuck
`transcribing` rows, `scribe-audio` storage growth). A rising count of
`scribe_recordings.status='failed'` with `error='transcription_timeout'` means
Google STT or the edge runtime is degraded.
