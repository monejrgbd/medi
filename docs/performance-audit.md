# Performance Audit — v1.0 Development Plan

Deep analysis of performance risks across all 11 phases. Each recommendation has been double-checked for correctness and potential harm. Severity: CRITICAL / HIGH / MEDIUM / LOW.

---

## 1. N+1 Query Patterns

### CRITICAL: Referral package building (`create_referral`, `get_referral_detail`) — Phase 8

`create_referral` accepts `included_visit_ids uuid[]` and for each visit must fetch: transcript (visit_messages), summary, diagnosis, AI diagnostic, public doctor notes, and selected attachments. Naive implementation = 6 queries x N visits. `get_referral_detail` has the same read-side equivalent.

**Fix:** Use `unnest(included_visit_ids)` joined to each related table in a single query with `jsonb_agg` grouped by visit_id. One round-trip, assemble in-memory.

```sql
-- Pattern for referral data assembly
WITH target_visits AS (
  SELECT unnest(p_visit_ids) AS visit_id
),
visit_data AS (
  SELECT v.id, v.ai_summary, v.diagnosis, v.ai_diagnostic
  FROM visits v JOIN target_visits tv ON v.id = tv.visit_id
),
messages AS (
  SELECT vm.visit_id, jsonb_agg(jsonb_build_object(
    'role', vm.role, 'content', vm.content, 'created_at', vm.created_at
  ) ORDER BY vm.created_at) AS transcript
  FROM visit_messages vm JOIN target_visits tv ON vm.visit_id = tv.visit_id
  GROUP BY vm.visit_id
),
notes AS (
  SELECT vn.visit_id, jsonb_agg(jsonb_build_object(
    'content', vn.content, 'created_at', vn.created_at
  )) AS doctor_notes
  FROM visit_notes vn JOIN target_visits tv ON vn.visit_id = tv.visit_id
  WHERE vn.is_public = true
  GROUP BY vn.visit_id
),
attachments AS (
  SELECT va.visit_id, jsonb_agg(jsonb_build_object(
    'file_name', va.file_name, 'storage_path', va.storage_path
  )) AS files
  FROM visit_attachments va JOIN target_visits tv ON va.visit_id = tv.visit_id
  WHERE va.id = ANY(p_attachment_ids)
  GROUP BY va.visit_id
)
SELECT jsonb_agg(jsonb_build_object(
  'visit_id', vd.id,
  'summary', vd.ai_summary,
  'diagnosis', vd.diagnosis,
  'diagnostic', vd.ai_diagnostic,
  'transcript', COALESCE(m.transcript, '[]'::jsonb),
  'notes', COALESCE(n.doctor_notes, '[]'::jsonb),
  'attachments', COALESCE(a.files, '[]'::jsonb)
))
FROM visit_data vd
LEFT JOIN messages m ON m.visit_id = vd.id
LEFT JOIN notes n ON n.visit_id = vd.id
LEFT JOIN attachments a ON a.visit_id = vd.id;
```

### HIGH: `get_pending_approvals` + similar patients check — Phase 3

For each pending approval, the plan calls `get_similar_patients(org_id, first_name, last_name, birthday)` with trigram/Levenshtein matching. 10 pending patients = 10 expensive fuzzy searches. (Each call already has `LIMIT 5` per the plan, so per-call result size is bounded — the issue is the N calls, not per-call cost.)

**Fix:** Return pending approvals first. Run similar-patient lookup only on-demand when receptionist expands a card, not pre-fetched for every card.

### HIGH: `get_visit_detail` (Phase 5) — multi-entity fetch

Returns transcript + summary + diagnostic + patient profile + addendums + attachments + referral status. If each is a separate query, that's 7 round-trips.

**Fix:** Single function using CTEs. Transcript and addendums can be UNIONed. Attachments and referral status are separate CTEs in one query.

```sql
-- Pattern for get_visit_detail
WITH transcript AS (
  SELECT jsonb_agg(jsonb_build_object(
    'role', role, 'content', content, 'created_at', created_at
  ) ORDER BY created_at) AS messages
  FROM visit_messages WHERE visit_id = p_visit_id
),
addendums AS (
  SELECT jsonb_agg(jsonb_build_object(
    'content', content, 'author', author_name, 'created_at', created_at
  ) ORDER BY created_at) AS items
  FROM visit_addendums WHERE visit_id = p_visit_id
),
attachments AS (
  SELECT jsonb_agg(jsonb_build_object(
    'id', id, 'file_name', file_name, 'file_type', file_type, 'storage_path', storage_path
  )) AS files
  FROM visit_attachments WHERE visit_id = p_visit_id
),
referral AS (
  SELECT jsonb_build_object('id', id, 'status', status, 'created_at', created_at) AS info
  FROM referrals WHERE visit_id = p_visit_id LIMIT 1
)
SELECT jsonb_build_object(
  'visit', jsonb_build_object(
    'id', v.id, 'status', v.status, 'ai_summary', v.ai_summary,
    'diagnosis', v.diagnosis, 'ai_diagnostic', v.ai_diagnostic,
    'created_at', v.created_at, 'completed_at', v.completed_at
  ),
  'patient', jsonb_build_object(
    'id', p.id, 'first_name', p.first_name, 'last_name', p.last_name,
    'birthday', p.birthday
  ),
  'transcript', COALESCE(t.messages, '[]'::jsonb),
  'addendums', COALESCE(a.items, '[]'::jsonb),
  'attachments', COALESCE(att.files, '[]'::jsonb),
  'referral', ref.info
)
FROM visits v
JOIN patients p ON p.id = v.patient_id
CROSS JOIN transcript t
CROSS JOIN addendums a
CROSS JOIN attachments att
LEFT JOIN referral ref ON true
WHERE v.id = p_visit_id;
```

### HIGH: `get_locations(org_id)` — "with staff counts, checked-in counts" — Phase 2

Per-location staff count + checked-in count. Correlated subqueries per location = N+1.

**Fix:** LEFT JOIN `staff_roles` and `staff_checkins` with GROUP BY `location_id` in one query.

```sql
SELECT l.*,
  COALESCE(sc.staff_count, 0) AS staff_count,
  COALESCE(ci.checked_in_count, 0) AS checked_in_count
FROM locations l
LEFT JOIN (
  SELECT location_id, count(DISTINCT staff_user_id) AS staff_count
  FROM staff_roles GROUP BY location_id
) sc ON sc.location_id = l.id
LEFT JOIN (
  SELECT location_id, count(*) AS checked_in_count
  FROM staff_checkins WHERE checked_out_at IS NULL
  GROUP BY location_id
) ci ON ci.location_id = l.id
WHERE l.org_id = p_org_id;
```

### HIGH: Follow-up SMS cron — per-follow-up lookups — Phase 11

Daily 10 AM cron sends overdue reminders. For each follow-up, needs patient phone + org SMS config. Naive = one query per follow-up.

**Fix:** Single query joining `follow_ups` + `patients` + `organizations` + `followup_sms_config`. Batch the SMS sends.

```sql
SELECT f.id, f.visit_id, p.phone, p.first_name, o.name AS org_name,
  fsc.reminder_template, fsc.max_reminders
FROM follow_ups f
JOIN visits v ON v.id = f.visit_id
JOIN patients p ON p.id = v.patient_id
JOIN organizations o ON o.id = v.org_id
JOIN followup_sms_config fsc ON fsc.org_id = o.id
WHERE f.status = 'overdue'
  AND f.reminder_count < fsc.max_reminders
  AND p.phone IS NOT NULL;
```

### MEDIUM: Receptionist header counts — Phase 3

6 status counts shown in header. If 6 separate COUNT queries, that's 6 table scans per refresh.

**Fix:** Single query with conditional aggregation:

```sql
SELECT
  count(*) FILTER (WHERE status = 'pending_approval') AS awaiting,
  count(*) FILTER (WHERE status = 'still_answering_ai') AS with_ai,
  count(*) FILTER (WHERE status = 'waiting_doctor_claim') AS in_queue,
  count(*) FILTER (WHERE status = 'claimed_by_doctor') AS with_doctor,
  count(*) FILTER (WHERE gave_tablet AND status NOT IN ('completed','left')) AS tablets_out
FROM visits WHERE location_id = $1 AND created_at >= current_date;
```

Doctor count from a separate `staff_checkins` query (different table, unavoidable).

### MEDIUM: `get_organization_overview` (existing) — FIXED

Three separate `COUNT(*)` subqueries on `staff_users`. Two scanned the same table.

**Fix applied:** Single scan via `CROSS JOIN LATERAL` with `count(*) FILTER (WHERE ...)`. Deployed.

### MEDIUM: `get_employee_stats` without staff_user_id — Phase 10

Per-employee stats (hours, patients, throughput, handling time) for all employees at a location. If computed in a loop, N+1.

**Fix:** CTEs grouped by `staff_user_id`. One CTE for checkin hours, one for visit counts, joined together.

### MEDIUM: Bulk med/allergy/condition upserts — Phase 4

`update_medications(patient_id, medications[])`, `update_allergies`, `update_chronic_conditions` accept arrays from AI extraction. If implemented as row-by-row INSERT/UPDATE loops, that's N+1 (20+ meds = 20+ queries).

**Fix:** Use `unnest()` for bulk operations:

```sql
-- Mark removed items inactive in one UPDATE
UPDATE patient_medications SET active = false
WHERE patient_id = p_patient_id AND active = true
  AND name NOT IN (SELECT unnest(p_medication_names));

-- Upsert new/existing items in one INSERT
INSERT INTO patient_medications (patient_id, name, active, updated_at)
SELECT p_patient_id, unnest(p_medication_names), true, now()
ON CONFLICT (patient_id, name) DO UPDATE SET active = true, updated_at = now();
```

### MEDIUM: `get_patient_return_rate(org_id, date_range)` — Phase 10

Cross-references all patients with visit history to calculate return rate percentages. Full org scan without date bounds.

**Fix:** Require `date_range` parameter, cap at 90 days (same pattern as `get_referral_analytics`).

### LOW: `get_staff_list` (existing) — FIXED

Correlated subquery `jsonb_agg(...)` per staff member for roles. Degrades at 100+ staff.

**Fix applied:** CTE aggregates all roles in one pass, then LEFT JOIN. Deployed.

---

## 2. Missing Indexes

> **Note:** The plan's Key Indexes section (lines 913-986) already defines most common indexes. This section lists only indexes NOT covered by the plan.

### HIGH: Analytics queries need composite indexes — Phase 10

Analytics functions query `(location_id, date_range)` heavily. `completed_at` is not indexed. `staff_checkins` lacks date-range indexes. The plan's `idx_visits_org` covers org-level queries but not location-level analytics with `completed_at`.

**Create when visits/checkins tables exist:**

```sql
CREATE INDEX idx_visits_completed ON visits(location_id, completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_checkins_analytics ON staff_checkins(location_id, checked_in_at);
CREATE INDEX idx_checkins_staff ON staff_checkins(staff_user_id, checked_in_at DESC);
```

### HIGH: RLS on child tables without `org_id` — Schema design

`visit_notes`, `patient_notes`, `visit_attachments`, `visit_addendums` have no `org_id` column. If RLS uses a JOIN-based policy like `USING (visit_id IN (SELECT id FROM visits WHERE org_id = ...))`, every row check runs a subquery.

**Important nuance:** This only fires on direct table queries, NOT through SECURITY DEFINER functions (which bypass RLS). Since the plan already uses SECURITY DEFINER for mutations, the fix is: use SECURITY DEFINER for reads on these tables too (`get_notes_for_visit`, `get_visit_attachments`, etc.). Keep a restrictive default-deny RLS policy (`USING (false)`) as a safety net so direct queries return nothing rather than running expensive JOINs.

### MEDIUM: Indexes not covered by the plan

The plan already covers `idx_visit_notes_visit`, `idx_patient_notes_patient`, `idx_visit_attachments_visit`, `idx_visit_addendums_visit`, `idx_reviews_location`, `idx_credits_log_org`, `idx_phone_verifications_lookup`, `idx_visits_ai_timeout`, `idx_visits_stale_queue`, `idx_patients_name_trgm` (with `pg_trgm`), and `idx_audit_org`. These genuinely missing indexes should be added:

```sql
-- Referrals (plan has idx_referrals_to, idx_referrals_from_doctor, idx_referrals_match — but not patient or org-level)
CREATE INDEX idx_referrals_patient ON referrals(patient_id);
CREATE INDEX idx_referrals_from_org ON referrals(from_org_id, created_at DESC);

-- Follow-ups (plan has idx_followups_patient, idx_followups_due — but not doctor or visit-level)
CREATE INDEX idx_followups_doctor ON follow_ups(doctor_id, status);
CREATE INDEX idx_followups_visit ON follow_ups(visit_id);

-- SMS (plan has idx_sms_log_org — but not visit-level)
CREATE INDEX idx_sms_log_visit ON sms_log(visit_id, type);
```

### LOW: `org_id` on `reviews` and `referrals` for RLS

The RLS subquery `SELECT org_id FROM staff_users WHERE auth_uid = auth.uid()` is evaluated once per query (PostgreSQL caches as single-execution subplan). Most queries already filter by `location_id` first. Still worth adding where org-scoped scans are more common:

```sql
CREATE INDEX idx_reviews_org ON reviews(org_id);
CREATE INDEX idx_referrals_org ON referrals(from_org_id);
```

---

## 3. Unbounded Queries (Missing Pagination / LIMIT)

### CRITICAL: `get_audit_trail(org_id, entity_type?, entity_id?, date_range?)` — Phase 7

Audit trail grows indefinitely (6+ rows per visit for status changes, plus every record edit). An owner querying full history could return tens of thousands of rows.

**Growth accelerator:** The plan's §10 compliance section requires `get_visit_detail`, `get_patient_profile`, `get_patient_visit_history`, and `get_patient_medical_records` to log every PHI read to `audit_trail`. A doctor reviewing 30 patients/day generates ~120 audit rows/day just from reads, on top of status changes. This makes pagination even more critical.

**Fix:** Mandatory cursor-based pagination (keyset on `(created_at, id)`), default LIMIT 50, max 200.

```sql
-- Cursor pagination pattern for audit trail
CREATE FUNCTION get_audit_trail(
  p_org_id uuid,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_cursor_created_at timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL,
  p_limit int DEFAULT 50
) ...
-- In the query:
WHERE org_id = p_org_id
  AND (p_entity_type IS NULL OR entity_type = p_entity_type)
  AND (p_entity_id IS NULL OR entity_id = p_entity_id)
  AND (p_cursor_created_at IS NULL OR
    (created_at, id) < (p_cursor_created_at, p_cursor_id))
ORDER BY created_at DESC, id DESC
LIMIT LEAST(p_limit, 200);
```

### CRITICAL: `get_patient_visit_history(patient_id)` — Phase 5

"All past visits" with summaries. Weekly visitor for 2 years = 100+ rows. UI is an accordion — loading all at once is wasteful.

**Fix:** Paginate (LIMIT 20, cursor-based). Full transcript loads on expand via `get_visit_detail`.

### HIGH: `search_patients(org_id, query, birthday?)` — Phase 11

No LIMIT. Broad search like "John" on a 10K+ patient org returns hundreds.

**Fix:** LIMIT 25, require minimum 3 characters. Use `ILIKE` with the trigram GIN index.

### HIGH: `get_referral_inbox(location_id)` and `get_referral_history(doctor_id)` — Phase 8

No pagination. Hundreds of referrals accumulate over months.

**Fix:** Paginate LIMIT 20 + cursor-based. Default filter to active statuses.

### HIGH: `get_notes_for_patient(patient_id, requesting_doctor_id)` — Phase 7

Cross-visit patient notes accumulate over years. 2+ years of multi-doctor notes = 300+ rows.

**Fix:** Paginate (LIMIT 30, cursor-based, newest first). Per-visit notes are naturally bounded.

### HIGH: `get_referral_analytics(org_id)` — Phase 8

"Volume over time" with no mandatory date range — aggregates over entire history.

**Fix:** Require `date_range`, cap at 90 days, default to last 30 days.

### MEDIUM: `get_review_hub(location_id, date_range?, doctor_id?)` — Phase 9

All reviews, no pagination.

**Fix:** Paginate, default date range to last 30 days.

### MEDIUM: `get_patient_full_profile(patient_id)` — Phase 11

Kitchen-sink query — all visits, notes, meds, allergies, referrals. Could return megabytes for long-term patients.

**Fix:** Return summary counts + latest 10 visits. Lazy-load full history on demand.

### LOW: `get_conversation(visit_id)` — Phase 4

All messages for a visit. Naturally bounded by 30-minute timeout (~50 messages max). Add a safety LIMIT of 500.

### LOW: `get_active_follow_ups(patient_id)` — Phase 7

Naturally bounded (0-5 active per patient typically). Add safety cap of 100.

### LOW: `get_visit_attachments(visit_id)` — Phase 7

Naturally bounded (0-5 per visit typically). Add safety cap of 50.

### LOW: `get_staff_list` (existing)

No LIMIT. Bounded by org size (most clinics <50 staff). Add a safety cap of 500.

---

## 4. Real-Time Subscription Scoping

### HIGH: RLS-based Postgres Changes filter at org level, not location level

The plan says "per-location channel subscriptions" but RLS grants SELECT to all rows where `org_id` matches. Supabase Realtime Postgres Changes uses RLS for visibility — it cannot push down `location_id` filters server-side.

**Impact:** A receptionist at Location A in a 5-location org receives Postgres Changes for ALL visits across ALL 5 locations. Client filters by `location_id`, discarding ~80% of events.

**Recommendation:** Accept for v1.0 — most orgs are 1-2 locations, so the firehose is tiny. If multi-location orgs report issues, migrate to Broadcast-based approach (trigger -> Edge Function -> broadcast to `location:{id}` channel) for precise control.

### HIGH: Trigger -> Edge Function -> Broadcast chain — Phase 3+

Every visit status change fires trigger -> invokes Edge Function -> broadcasts to patient channel.

**Concerns:**
- Edge Function cold starts: 200-500ms (negligible vs. Claude's 2-10s, but noticeable for approval/denial notifications)
- If Edge Function fails, patient doesn't get update until polling fallback (5s)
- No retry mechanism mentioned

**Fix:** The 5-second polling fallback already covers failures (good). Ensure the Edge Function is idempotent so that if the patient polls and also gets the broadcast, there's no double-action. No other changes needed — the trigger-based approach is correct and should NOT be replaced with client-side broadcasts (that would let malicious clients send fake status updates to patient channels).

### MEDIUM: Queue position updates — Phase 5

When a patient is claimed/leaves, other patients' queue positions change. The plan doesn't specify who recalculates positions for the remaining patients.

At v1.0 scale (5-15 patients in queue), the simplest approach is: each patient's 5-second polling via `get_patient_session(session_token)` also computes their queue position. 15 patients x 12 polls/min = 180 queries/min, each an indexed scan taking <1ms. PostgreSQL handles this trivially.

**Note for scaling:** If queue size regularly exceeds 30+ patients, consider having the status-change Edge Function compute all positions in one query and broadcast to each patient's channel. But don't pre-build this.

### MEDIUM: No subscription cleanup mentioned

The plan doesn't describe unsubscribe logic for staff switching locations, logout, visit completion, or browser tab close.

**Fix:** Standard React cleanup: `useEffect` return functions unsubscribe from channels. On visit terminal state (completed/left), unsubscribe. On logout, remove all channels. Supabase automatically cleans up on WebSocket disconnect (tab close).

---

## 5. Expensive Operations That Should Be Background Jobs

### CRITICAL: `generate-summary` — up to 3 serial Claude API calls — Phase 4

After conversation completes:
1. Generate `ai_summary` (always) — 1 Claude call (2-10s)
2. Generate `ai_structured_card` (if structured_card mode) — potential 2nd call
3. Generate `ai_diagnostic` (if advanced AI) — potential 3rd call
4. Extract meds/allergies/chronic — could be part of call 1

Worst case: 30 seconds of patient staring at a loading screen.

**Fix:** Combine ALL outputs into a single Claude call with structured output (JSON schema with summary, structured_card, diagnostic, extracted_meds, extracted_allergies, extracted_conditions). Omit fields that don't apply (e.g., no diagnostic for standard AI). One call instead of three. This alone cuts worst-case from 30s to 10s.

**Cost note:** This also reduces API cost — the full conversation transcript is sent as input tokens once instead of three times. The plan's `Promise.all()` parallelization (line 1253) achieves similar latency (~5s) but sends the transcript to Claude 3x. For a 3000-token conversation, that's ~6000 wasted input tokens per visit.

### HIGH: `ai-conversation` re-queries static context on every message — Phase 4

The edge function loads conversation history on every invocation (unavoidable — Claude API is stateless). But it may also re-query `patients` (meds, allergies, chronic), past visit summaries, and follow-up context each time. These are **static for the duration of a conversation**.

**Fix:** `start_ai_conversation` already returns "conversation context (past summaries, meds, follow-up info)." Store the constructed system prompt as the first `system` role message in `visit_messages`. On subsequent calls, loading all messages naturally includes the cached system prompt — no need to re-query 4 tables per message.

**Cost note:** A 30-message conversation replays all prior tokens on each call. For a 2000-token system prompt + 20 prior messages averaging 100 tokens each, the last message sends ~4000 input tokens. For advanced AI, total conversation input cost could reach $0.30-0.50. This is inherent to stateless APIs and should be factored into credit pricing, not "fixed."

### HIGH: Translation adds 2 API calls per message exchange — Phase 9

Non-English patients: every message round-trip adds:
1. Translate patient message → English (before Claude call)
2. Translate AI response → patient's language (after Claude call)

That's 200-400ms extra per message on top of Claude latency.

**Important:** These 2 calls are the irreducible minimum — they cannot be batched. Call 2 depends on Claude's output, which doesn't exist when Call 1 runs. Language detection is NOT needed — the patient already selects their language in Phase 3 step 7 (stored as `patient.language`).

**Plan already optimizes this:** Translation is handled **inline** within the `ai-conversation` edge function (plan line 1237), not as separate edge function invocations. This avoids 2 extra cold starts + HTTP roundtrips per message (~200-600ms saved vs. separate calls). For English patients: zero translation calls.

**Why NOT have Claude respond directly in the patient's language:** The plan stores English as source of truth (`content` = English). Doctors see English. Claude's multilingual quality varies by language and is not validated for medical terminology. Google Translate is more consistent and auditable for this use case. Don't change this architecture.

### HIGH: `create_referral` — PDF generation + email synchronous — Phase 8

Doctor waits for: data fetch (multiple visits) + PDF generation (pdf-lib) + email (Resend). Could be 5-10s.

**Fix:** Create DB record immediately -> return "Referral sent." Generate PDF + send email in a background Edge Function invoked async via `pg_net` or a trigger on referral insert.

### MEDIUM: `generate-referral-pdf` — attachment loading — Phase 8

If a referral includes many large attachments, the Edge Function loads them all into memory. Supabase Edge Functions have ~150MB memory limit.

**Fix:** Link to attachments by URL in the PDF rather than embedding binary data. This also produces a smaller PDF.

### MEDIUM: Analytics compute on-demand over large date ranges — Phase 10

`get_wait_time_heatmap` does bucketed aggregation over months. 50 patients/day x 90 days = 4,500 rows with complex GROUP BY.

**Fix v1.0:** Accept real-time computation with proper indexes (Section 2). Cap date range to 90 days max.
**Fix v2.0 (if needed):** Pre-compute daily rollups via pg_cron nightly job.

### MEDIUM: `get_estimated_wait` recomputed on every patient poll — Phase 5

Calculates average from last 10 completed visits. 20 patients polling every 5s = 240 queries/min computing the same value.

**Fix:** Cache per location. Recompute only when a visit completes — store the result as a column on `locations` (e.g., `estimated_wait_minutes numeric`) updated by `complete_visit`. Patients read the cached value.

### LOW: SMS sending on visit completion path — Phase 8

`trigger_visit_summary_sms` and `trigger_review_sms` invoked during `complete_visit`. If synchronous, doctor waits for Twilio.

**Fix:** Fire-and-forget via `pg_net` or a trigger on status -> `completed`.

---

## 6. Not Actually Problems (removed from consideration)

These were analyzed and found to be **not real concerns at v1.0 scale**:

- **Connection pool pressure:** Edge Functions use PostgREST API (not direct DB connections). Pool pressure requires more concurrent direct connections than expected at v1.0 scale. Monitor, don't pre-optimize.
- **`visit_messages` table size:** 365K rows/year per location is trivial for PostgreSQL with proper indexes. Archival is a year-3+ concern.
- **Edge Function cold starts on `ai-conversation`:** Cold start is 200-500ms. Negligible compared to Claude's 2-10s response time. SSE streaming means patient sees typing indicator immediately.
- **Dashboard layout auth queries:** `getUser()` + `getMyRoles()` + `getMyOrg()` are 3 fast indexed queries. Parallel via `Promise.all()` = ~5ms total. Not a problem.
- **Double-subscription (sidebar + page):** Two event handlers on the same WebSocket connection. Negligible overhead — Supabase multiplexes on one connection.
- **Cron batch sizes (follow-up SMS):** Twilio handles 400 msg/sec. Even large batches are fine. The real constraint is SMS cost, not rate limits.
- **`SELECT FOR UPDATE` serialization on credits:** Lock held for <5ms. Contention requires 50+ simultaneous starts at the same org. Not realistic for a clinic.
- **`process-voice` STT latency:** Google Cloud Speech-to-Text takes 2-10s. Patient actively initiated recording and expects delay. Same UX category as Claude response time. Not fixable without making it async, which adds no UX benefit since patient needs the transcribed text before they can edit/send.

---

## 7. Implementation Checklist

### Already Fixed (deployed)

- [x] `get_organization_overview` — consolidated 3 staff_users scans into 1 via CROSS JOIN LATERAL + FILTER
- [x] `get_staff_list` — replaced correlated subquery with CTE for role aggregation

### Apply When Building Each Phase

#### Phase 2 (Location Management)
- [ ] `get_locations` — use LEFT JOIN subqueries for staff/checkin counts (pattern in Section 1)

#### Phase 3 (Patient Check-in)
- [ ] `get_pending_approvals` — do NOT pre-fetch similar patients; load on-demand per card
- [ ] Header counts — single query with `count(*) FILTER (WHERE ...)` (pattern in Section 1)
- [ ] `search_patients` — require 3+ character input, LIMIT 25

#### Phase 4 (AI Conversation)
- [ ] `generate-summary` — single structured-output Claude call, not 3 serial calls
- [ ] `ai-conversation` — cache system prompt as first visit_message row
- [ ] Bulk med/allergy/condition upserts — use `unnest()` pattern (Section 1)

#### Phase 5 (Doctor Flow)
- [ ] `get_visit_detail` — single CTE-based function (pattern in Section 1)
- [ ] `get_patient_visit_history` — cursor pagination, LIMIT 20
- [ ] `get_conversation` — safety LIMIT 500
- [ ] `get_estimated_wait` — cache on `locations.estimated_wait_minutes`, recompute on visit completion
- [ ] Queue positions — compute in `get_patient_session` polling, not pre-broadcast

#### Phase 7 (Notes & Audit)
- [ ] `get_audit_trail` — mandatory cursor pagination, LIMIT 50, max 200
- [ ] `get_notes_for_patient` — cursor pagination, LIMIT 30
- [ ] Child tables (`visit_notes`, `patient_notes`, etc.) — default-deny RLS + SECURITY DEFINER reads
- [ ] `get_active_follow_ups` — safety cap 100
- [ ] `get_visit_attachments` — safety cap 50
- [ ] Add `idx_followups_doctor`, `idx_followups_visit` indexes

#### Phase 8 (Referrals)
- [ ] `create_referral` — batch fetch with unnest + jsonb_agg (pattern in Section 1)
- [ ] `create_referral` — async PDF + email via background Edge Function
- [ ] `generate-referral-pdf` — link attachments by URL, don't embed
- [ ] `get_referral_inbox/history` — cursor pagination, LIMIT 20
- [ ] `get_referral_analytics` — require date_range, cap 90 days
- [ ] Add `idx_referrals_patient`, `idx_referrals_from_org` indexes
- [ ] Add `idx_sms_log_visit` index
- [ ] Add `idx_referrals_org` index (LOW — RLS optimization)

#### Phase 9 (Reviews + Translation)
- [ ] Translation — 2 calls are irreducible minimum; skip both for English patients (already inline per plan)
- [ ] `get_review_hub` — paginate, default 30-day date range
- [ ] Add `idx_reviews_org` index (LOW — RLS optimization)

#### Phase 10 (Analytics)
- [ ] Add `idx_visits_completed`, `idx_checkins_analytics`, `idx_checkins_staff` indexes (Section 2)
- [ ] `get_employee_stats` — CTEs grouped by staff_user_id
- [ ] Cap date ranges to 90 days max on all analytics functions
- [ ] `get_patient_return_rate` — require date_range, cap 90 days

#### Phase 11 (Patient Management)
- [ ] `get_patient_full_profile` — summary + latest 10 visits, lazy-load rest
- [ ] `search_patients` — LIMIT 25, 3+ char minimum
- [ ] Follow-up SMS cron — single join query, batch sends

#### Real-Time (applies across phases)
- [ ] Accept org-level Postgres Changes filtering for v1.0
- [ ] Ensure Edge Function broadcast is idempotent
- [ ] React `useEffect` cleanup on unmount/logout/visit-completion
- [ ] Plan Broadcast migration path if multi-location orgs report issues

---

## Top 10 Fixes by Impact

| # | Issue | Phase | Severity | Fix |
|---|-------|-------|----------|-----|
| 1 | `generate-summary` up to 3 serial Claude calls while patient waits | 4 | CRITICAL | Single structured-output call (also saves ~6K input tokens/visit vs plan's `Promise.all()`) |
| 2 | `get_audit_trail` + `get_patient_visit_history` unbounded | 5, 7 | CRITICAL | Mandatory cursor pagination |
| 3 | Referral package N+1 (6 queries x N visits) | 8 | CRITICAL | Batch fetch with unnest + jsonb_agg |
| 4 | `ai-conversation` re-queries static context on every message | 4 | HIGH | Cache system prompt as first visit_message |
| 5 | `create_referral` PDF + email blocks doctor | 8 | HIGH | Async background Edge Function |
| 6 | Missing analytics indexes (completed_at, checkins) | 10 | HIGH | Add composite indexes |
| 7 | Child table RLS without org_id = expensive JOIN policies | All | HIGH | SECURITY DEFINER reads + default-deny RLS |
| 8 | RLS Postgres Changes firehose (org, not location) | 3, 5 | HIGH | Accept for v1, plan Broadcast migration if needed |
| 9 | `get_estimated_wait` recomputed on every patient poll | 5 | MEDIUM | Cache on `locations.estimated_wait_minutes` |
| 10 | Bulk med/allergy/condition upserts loop row-by-row | 4 | MEDIUM | Use `unnest()` for bulk operations |
