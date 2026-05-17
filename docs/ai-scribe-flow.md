# AI Medical Scribe

## How It Works

The scribe lets a doctor ambiently record the in person encounter and turn it into a signed SOAP note. It sits on top of the existing clinical documents pipeline and works whether or not AI intake was run for the visit (walk ins, `skip_ai` locations, any claimed patient).

Trigger: the doctor opens a claimed patient in FocusMode or PatientDetailView and clicks "Activate Scribe" (or "Scribe" in FocusMode). A consent modal requires a one tap attestation that the patient was informed and consented; that attestation is logged to `audit_trail` (`scribe_consent_attested`) before any audio is captured.

Logic: `start_scribe_recording` creates a `scribe_recordings` lifecycle row only (no document yet, so a cancel leaves no orphan). The browser records the encounter as a continuous stream, stopping and restarting the `MediaRecorder` every 45 seconds so each segment is a complete, decodable WebM. Segments upload to the private `scribe-audio` bucket under `{org}/{visit}/scribe/{recording}/NNNN.webm` (org scoped RLS, cloned from the attachments bucket). On Stop, `finalize_scribe_recording` creates the `clinical_note_soap` document (reusing `private.create_document`), flips the row to `transcribing`, and fires the `transcribe-encounter` edge function fire and forget.

`transcribe-encounter` lists the segments, runs Google Speech to Text (`latest_long` with 2 speaker diarization) sequentially, assembles a Speaker A / Speaker B transcript with an "approximate labels" disclaimer, and writes it to `clinical_documents.scribe_transcript`. It then meters billing via `deduct_scribe_credits` (subscription plans: unlimited no op; PAYG and trials: metered per audio minute, idempotent per visit), sets the document to `drafting`, and calls the existing `generate-document-content` which produces the SOAP draft. The doctor reviews, edits, and signs in the existing `SoapNoteEditor` (opened with the scribe `documentId`), then the existing `generate-document-pdf` and delivery apply unchanged.

Outcome: a doctor reviewed, signed SOAP note generated primarily from the spoken encounter. The intake transcript, if any, is supplementary context.

Independence from intake is structural: `generate-document-content` null guards every visit query and the SOAP template defaults gracefully, so the scribe only needs to supply the `encounter_transcript` placeholder.

A blocking pre existing defect was fixed as part of this work: the SOAP `render_template` references nested leaves (`{hpi}`, `{physical_exam}`, `{primary_dx}`) but the render loop only flattened top level AI JSON keys, so SOAP `content_body` rendered empty (no SOAP note had ever been generated in production). `generate-document-content` now deep flattens nested objects and joins arrays, backward compatible with flat letter templates.

## Files That Represent It

SQL (`sql/`): `tables/scribe_recordings.core-sql`, `tables/clinical_documents.core-sql` (added `scribe_transcript`), `start_scribe_recording.core-sql`, `finalize_scribe_recording.core-sql`, `get_scribe_recording.core-sql`, `cancel_scribe_recording.core-sql`, `deduct_scribe_credits.core-sql`, `scribe_audio_bucket.core-sql`, `scribe_timeout_cron.core-sql`, `get_document_for_staff.core-sql` (returns `scribe_transcript`), `purge_expired_orgs.core-sql` (ordered scribe_recordings + clinical_documents deletes), `seed_document_templates.core-sql` (`clinical_note_soap` prompt; live row was updated surgically).

Edge functions: `supabase/functions/transcribe-encounter/index.ts` (new, internal, `--no-verify-jwt`), `supabase/functions/generate-document-content/index.ts` (render fix + `encounter_transcript` input).

Frontend: `src/app/(dashboard)/d/_actions/scribe.ts`, `src/components/doctor/ScribeRecorder.tsx`, `src/components/doctor/ScribePanel.tsx`, `src/components/doctor/SoapNoteEditor.tsx` (optional `documentId` prop), `src/components/doctor/FocusMode.tsx` and `src/app/(dashboard)/d/doctor/patient/[visitId]/PatientDetailView.tsx` (Activate Scribe button + mounts).

## Dependencies

Relies on: `private.create_document`, `generate-document-content`, `generate-document-pdf`, `SoapNoteEditor`, the `clinical_documents` lifecycle, vault secrets (`edge_function_url`, `internal_edge_secret`, `supabase_anon_key`), `GOOGLE_CLOUD_API_KEY`, `INTERNAL_EDGE_SECRET`, `credits_log` unique `(visit_id, credit_type)` index, `audit_trail`, pg_cron, pg_net. Relied on by: the doctor SOAP documentation workflow.

## Testing

Verified server side: all SQL objects deployed (5 functions, table, column, bucket private, `scribe_timeout_check` cron), template carries the encounter block, both edge functions ACTIVE with `verify_jwt=false`, `tsc` clean. `database.types.ts` is an unused artifact (no importers, clients untyped) so it was intentionally not regenerated.

Needs a browser smoke test by staff (cannot be done without a mic): open a claimed patient, Activate Scribe, attest, speak two roles for ~2 minutes, Stop. Confirm `scribe_recordings` goes `consented -> transcribing -> transcribed`, segments land in `scribe-audio`, `scribe_transcript` populates with Speaker A/B, the document goes `drafting -> drafted`, the SOAP editor shows non empty HPI / Physical Exam / Assessment / Plan with no literal `{...}` tokens, and signing produces a PDF. Also test the zero intake path (a visit with no `visit_messages`) and a metered PAYG org (exactly one `credits_log` row `credit_type='scribe_transcription'`, none for subscription plans). Regression: generate one letter document and confirm its `content_body` still renders (deep flatten backward compatibility).

## Demo

The scribe is enabled in the live demo at `/demo`. The demo is a real
authenticated staff session in the enterprise demo org, so the full pipeline
runs for real (real Google STT, real `clinical_documents`); billing is a no op
because the demo org is enterprise (`deduct_scribe_credits` returns
`plan_unlimited`). This is also the easiest way to run the browser smoke test
above. The only demo specific change was extending `cleanup_demo_data` to delete
`scribe_recordings` before its three `clinical_documents` deletes (the hourly
demo cleanup cron would otherwise FK block once a demo recording exists);
in-flight recordings are preserved because that cleanup keeps its existing
2 hour / visit / orphan-patient scoping. Demo `scribe-audio` segments are not
pruned by SQL (Supabase blocks direct `storage.objects` delete), matching the
existing demo PDF/logo behavior.
