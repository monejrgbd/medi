# FocusMode Parity + Pre-Check-in Links

## What Changed

### Part 1: FocusMode Parity

FocusMode (the streamlined doctor view) was missing features that PatientDetailView had. Now they match.

**FocusMode action bar**: `[Cancel Claim] [Refer] [Complete Visit & Claim Next]`
- Refer button: checks `org.verified` (via `useRoleSafe`), shows toast if unverified or demo mode
- Opens `ReferralForm` modal (same as PatientDetailView)

**FocusMode tabs**: `summary | transcript | notes | vitals | vaccines | attachments | history | referrals`
- History: `<VisitHistoryAccordion patientId={detail.patient.id} />` (reused standalone component)
- Referrals: `<ReferralHistory />` (reused standalone component, shows doctor's sent referrals)

**DoctorDashboard**: `focusMode` now always starts as `false` (was `useState(demoMode)`). Doctors enter FocusMode by clicking a claimed patient card, not automatically.

**Demo org**: `organizations.verified = true` for Smith Family Clinic, so referral SQL functions work in prod context.

### Part 2: Pre-Check-in Links

Receptionists can generate a single use link with a patient's name pre filled. Patient opens the link, confirms details, and starts AI intake directly (skipping receptionist approval, phone verification, and discovery questions).

#### Database (33 tables total)

**New table: `pre_checkin_tokens`**
- `id`, `org_id`, `location_id`, `first_name`, `last_name`, `created_by`, `token` (UUID, UNIQUE), `used`, `visit_id`, `session_token`, `created_at`, `expires_at` (48h default)
- RLS enabled, deny all (all access via SECURITY DEFINER functions)
- Indexes: token lookup, location+date, expiry (unused only)

**New function: `create_pre_checkin_token`** (authenticated)
- Staff at location or owner can create tokens
- Validates: names not empty, location belongs to caller's org
- Returns: `{ success, token, token_id }`

**New function: `validate_pre_checkin_token`** (anon)
- Token unused: returns `{ first_name, last_name, location_id }` for form pre fill
- Token used + active visit: returns `{ session_token, visit_id, location_id }` for recovery
- Token used + done visit: error "already been used"
- Expired/invalid: error

**New function: `checkin_with_token`** (anon)
- `SELECT ... FOR UPDATE` on token row (prevents concurrent double creation)
- Fuzzy name match via `similarity()` (pg_trgm), threshold 0.4
- Subscription check (expired/suspended/read_only blocked)
- No "receptionist checked in" check (intentional: patients fill this out from home before arriving)
- Respects `locations.skip_ai`: creates visit as `still_answering_ai` (with `ai_started_at`) or `waiting_doctor_claim` (with `ai_skipped`, `entered_queue_at`)
- Handles: existing patient lookup, new patient creation (with race condition handling), active visit detection
- Audit trail: logs `pre_checkin_used` with token_id, name_similarity, ai_skipped
- Returns: `{ match_type: 'pre_approved', session_token, visit_id, queue_number, has_previous_visits, phone_verified: false, ai_skipped }`

**Modified: `expire_stale_sessions`** (cron cleanup)
- Added step 7: `DELETE FROM pre_checkin_tokens WHERE expires_at < now() - interval '7 days'`

#### Frontend

**New: `src/components/receptionist/ShareCheckinLink.tsx`**
- Modal: first name + last name inputs, Generate Link, copyable URL with "Copied!" feedback
- Link format: `{APP_BASE_URL}/checkin/{locationId}?token={uuid}`
- Shows 48 hour expiry notice

**New: `src/app/(dashboard)/d/_actions/checkin-link.ts`**
- `generateCheckinLink(locationId, firstName, lastName)` server action

**Modified: `src/app/(dashboard)/d/receptionist/ReceptionistDashboard.tsx`**
- "Share Link" button in tab bar (link icon + label)
- Opens ShareCheckinLink modal

**Modified: `src/app/checkin/[locationId]/CheckinFlow.tsx`**
- On mount: reads `?token=` from URL search params
- Synchronous URL check gates session recovery (prevents race condition with two concurrent useEffects)
- Token unused + location matches: stores token, pre fills form via `preFill` prop
- Token used + active visit: recovers session via `get_patient_session` (no birthday verification)
- Token invalid/expired: proceeds with normal flow
- On form submit with token: calls `checkin_with_token` instead of `checkin_patient`
- Post submit: skips phone verification, skips discovery questions, goes to `first_timer` (AI) or `queued` (skip_ai)

**Modified: `src/components/patient/CheckinForm.tsx`**
- New `preFill` prop: `{ firstName, lastName }` pre fills name fields (editable, fuzzy match handles typos)
- Blue welcome banner when preFill is present

### Part 3: Marketing + Demo

**Modified: `src/app/(marketing)/page.tsx`**
- Hero mockup: "Patient scans QR code or opens a shared link"
- Step 01: "Patient scans a QR code or clicks a link you shared."
- Step 01 desc: mentions "share a link ahead of time so they can start from home"
- Referral mockup: fixed "one click" to "in seconds", fixed status steps to match prod (Sent/Viewed/Arrived/Completed), fixed footer to list actual contents

**Modified: `src/components/demo/DemoShell.tsx`**
- Blue info banner on receptionist tab: "You can also share a check in link with patients before they arrive."

## Bugs Found and Fixed During Audit

1. **`locations.active` column does not exist.** `checkin_with_token` and `create_pre_checkin_token` both referenced `l.active` which is not a real column. The "active" concept is derived from `staff_checkins` (receptionist checked in). Fixed: removed the check entirely. Pre checkin tokens intentionally skip the "receptionist checked in" check because patients use them from home before arriving.

2. **Race condition in CheckinFlow.** Both the token validation useEffect and the session recovery useEffect could fire simultaneously on mount (React 18 batches state updates, so `setTokenValidating(true)` in the first effect is not visible to the second). Fixed: session recovery effect now synchronously checks `window.location.search` for a `token` param and returns early if present.

3. **Dead code in `checkin_with_token`.** `SELECT v.status, v.session_token, v.queue_number INTO v_visit_status` was unused (only `v_active_visit` from the second query was used). Removed the dead query and the `v_visit_status` variable.

## Files

| File | Action |
|------|--------|
| `src/components/doctor/FocusMode.tsx` | Add Refer button, ReferralForm modal, History + Referrals tabs |
| `src/app/(dashboard)/d/doctor/DoctorDashboard.tsx` | focusMode default=false |
| `sql/tables/pre_checkin_tokens.core-sql` | New table |
| `sql/create_pre_checkin_token.core-sql` | New function (staff) |
| `sql/validate_pre_checkin_token.core-sql` | New function (anon) |
| `sql/checkin_with_token.core-sql` | New function (anon) |
| `sql/expire_stale_sessions.core-sql` | Add token cleanup |
| `src/components/receptionist/ShareCheckinLink.tsx` | New modal |
| `src/app/(dashboard)/d/receptionist/ReceptionistDashboard.tsx` | Share Link button + modal |
| `src/app/(dashboard)/d/_actions/checkin-link.ts` | New server action |
| `src/app/checkin/[locationId]/CheckinFlow.tsx` | Token param handling + auto approve path |
| `src/components/patient/CheckinForm.tsx` | preFill prop + welcome banner |
| `src/app/(marketing)/page.tsx` | QR section + Step 01 copy, referral mockup fixes |
| `src/components/demo/DemoShell.tsx` | Blue info banner on receptionist tab |
| `src/lib/database.types.ts` | Regenerated |
