# Phone-as-Identity Check-in System

## Context

The current patient identity system uses (org, first name, last name, birthday) as the primary key, with an optional phone number and a complex collision flag system to handle the rare case of two different people sharing the same name and birthday. This collision system spans 6+ SQL functions, multiple UI states, and deferred phone collection (post-AI conversation). The complexity is disproportionate to how often collisions actually occur.

This redesign adds phone number to the check-in form and makes it part of the identity key: (org, first name, last name, birthday, phone). This eliminates the collision system entirely. The system handles all edge cases (phone changes, no phone) automatically — no receptionist detective work needed. The receptionist's only role is the standard approve/deny on every check-in.

---

## Identity Model

**Patient identity key:** `(org_id, lower(first_name), lower(last_name), birthday, phone)`

- Phone is collected at check-in time (on the form, alongside name/birthday/sex)
- Two unique indexes (already exist, no schema change needed):
  - `(org_id, lower(first_name), lower(last_name), birthday, phone) WHERE phone IS NOT NULL`
  - `(org_id, lower(first_name), lower(last_name), birthday) WHERE phone IS NULL` — max one no-phone record per name+birthday combo
- `collision_flag` column removed from patients table

---

## Check-in Flow

### 1. Form

Patient enters: first name, last name, birthday, biological sex, phone number (with country code selector).

Additional form elements:
- **"I do not have a phone number"** toggle — hides phone field, submits with NULL phone
- **SMS terms checkbox** (visible when phone entered): "I agree to receive text messages including verification codes, visit summaries, and follow up reminders. Message and data rates may apply."
- Optional referral source checkbox (unchanged)
- Optional discovery source (unchanged, post-check-in for new patients only)

### 2. Primary Match

`checkin_patient` receives all form fields including phone. Matches on the full identity key.

- **Phone provided:** match on `(org, lower(first), lower(last), birthday, phone) WHERE NOT is_orphaned`
- **No phone:** match on `(org, lower(first), lower(last), birthday) WHERE phone IS NULL AND NOT is_orphaned`

| Primary result | Action |
|---|---|
| Match + `phone_verified = true` | Return `returning`, client skips SMS verification |
| Match + `phone_verified = false` | Return `returning`, client triggers SMS verification |
| Match + active visit | Return `active_session` with visit info |
| No match | Proceed to secondary check |

### 3. Secondary Check (Automatic Edge Case Resolution)

When primary match fails, `checkin_patient` checks `(org, lower(first), lower(last), birthday) WHERE NOT is_orphaned` for ANY existing records regardless of phone. Orphaned records are excluded from both checks.

| Secondary result | Patient entered | Return type |
|---|---|---|
| No records found | Phone or no phone | `new` — create patient + visit |
| Records found (any with phone) | Different phone | `potential_match` — do NOT create record or visit |
| Records found (any with phone) | No phone | `potential_match_no_phone` — do NOT create record or visit |
| Only NULL-phone record found | Has phone | `potential_match_add_phone` — do NOT create record or visit |

**Important:** `potential_match_add_phone` is NOT the same as `new`. An existing patient who was created without a phone (old system migration or "no phone" toggle) would land here when they later come in with a phone. Creating a new record here would duplicate the patient and destroy their entire history (meds, allergies, chronic conditions, past visits). The patient must be asked to confirm before linking.

For all three `potential_match*` types: no patient record or visit is created. No existing phone information is returned to the client — client only knows a potential match exists.

### 4. Match Resolution (Patient Screen)

**Phone change scenario** (`potential_match`, patient entered a new phone):

> We found an existing record with your name and birthday.
> Did you recently change your phone number?
>
> [Yes, I changed my number] [No, I am a new patient]

- **"Yes, I changed my number"** → patient is prompted to enter their PREVIOUS phone number → client calls `resolve_potential_match` with action `phone_change`, old phone, and new phone → system checks if (org, name, birthday, old_phone) matches an existing non-orphaned record:
  - **Active session on that record** → return `active_session`
  - **Match, no active session** → create visit on that record, store new phone as `pending_phone` on visit (NOT written to patient yet) → client triggers SMS verification of the new phone → on successful verify, `verify_phone_and_link` writes new phone to patient record and sets `phone_verified = true`
  - **No match** → return error `old_phone_mismatch` → client shows: "Previous phone number does not match our records. Please try again or check in as a new patient." Patient can retry or tap "I am a new patient."
- **"No, I am a new patient"** → client calls `resolve_potential_match` with action `new_patient` → system creates new patient + visit → client triggers SMS verification → waiting for approval as new patient

**Multiple existing records** are handled identically — old phone entered by patient, system matches against all non-orphaned records with that name+birthday. Whichever record matches the old phone is the correct one. No selection UI.

**First-time phone scenario** (`potential_match_add_phone`, patient entered a phone but existing record has no phone):

> We found an existing record with your name and birthday.
> Are you a returning patient?
>
> [Yes, I have been here before] [No, I am new]

- **"Yes, I have been here before"** → client calls `resolve_potential_match` with action `add_phone` → system finds the null-phone record for (org, name, birthday) → checks for active session → creates visit, stores new phone as `pending_phone` on visit → client triggers SMS verification of the new phone → on successful verify, `verify_phone_and_link` writes phone to the patient record (null-phone record now has a verified phone) → waiting for approval with "Phone added" badge
- **"No, I am new"** → client calls `resolve_potential_match` with action `new_patient` → system creates new patient with phone + visit → SMS verify → approval

No old phone entry needed since the existing record had no phone.

**No phone today scenario** (`potential_match_no_phone`, patient selected "no phone"):

> We found an existing record with your name and birthday.
> Please enter the phone number you previously used with us to verify your identity.
>
> [Phone input field] [Submit] [I am a new patient]

- **Phone entered + matches a record** → identity proven → system creates visit on that existing record → waiting for approval as returning patient (no SMS needed, old phone entry is the identity check)
- **Phone entered + no match** → "Phone number does not match our records. Please try again or check in as a new patient." Patient can retry.
- **"I am a new patient"** (cannot remember or prove identity) → client calls `resolve_potential_match` with action `new_patient` → system creates new no-phone patient + visit → waiting for approval as new patient

Cannot prove identity = new patient. No receptionist involvement.

### 5. Phone Verification

Triggered after form submit for:
- New patients with a phone number
- Returning patients with `phone_verified = false`
- Phone change resolutions (verify the new number before it is written to patient record)

NOT triggered for:
- Returning patients with `phone_verified = true` (skip entirely — straight to approval)
- No-phone patients
- No-phone-today patients who proved identity by entering old phone

Uses existing `verify-phone` edge function and `PhoneVerification` component. Verification happens BEFORE the patient enters the approval queue.

### 6. Approval (Receptionist)

Standard approve/deny. No extra actions required for any case.

New badge on approval card:
- **"No phone"** badge if patient has NULL phone
- **"Phone updated"** note if patient resolved a phone change (informational only)

### 7. Post-Approval Flow

Unchanged: first-timer explainer → language selection → AI conversation → summary review → queue → claimed → completed → SMS summary.

**The post-AI phone collection step is removed entirely.** Phone is collected and verified at check-in.

---

## Session Recovery

Patient re-scans QR and re-enters identifying info to resume:

- **Has phone:** name + birthday + phone → primary match → finds active session → resume
- **No phone:** name + birthday → match NULL-phone record → finds active session → resume

Birthday verification on shared kiosks unchanged.

**Important:** In the `potential_match` flow, no session token exists until `resolve_potential_match` completes and creates a visit. `CheckinFlow` must NOT write a session token to localStorage until after `resolve_potential_match` returns successfully.

---

## SQL Changes

### `checkin_patient.core-sql` (rewrite)

Parameters (changes from current):
- `p_phone text DEFAULT NULL` — now always passed from form (was optional, rarely used)
- `p_was_referred boolean DEFAULT false`, `p_referred_by text DEFAULT NULL` — unchanged

Logic changes:
- Primary match: include phone in WHERE clause, exclude `is_orphaned`
- Secondary check on (org, name, birthday) WHERE NOT is_orphaned when primary fails
- Return new match types: `potential_match`, `potential_match_no_phone`, `potential_match_add_phone`
- Remove ALL collision_flag logic
- `phone_verification_pending` is still set on new visits — but collision logic is gone. Rules:
  - Set `phone_verification_pending = true` when: new patient with phone, returning patient with `phone_verified = false`
  - Set `phone_verification_pending = false` when: returning patient with `phone_verified = true`, no-phone patient
- Unique violation handling simplified (no collision recovery path)

Return JSON:
```json
{
  "success": true,
  "match_type": "returning | new | active_session | potential_match | potential_match_no_phone | potential_match_add_phone",
  "visit_id": "uuid — null for potential_match types",
  "session_token": "uuid — null for potential_match types",
  "patient_id": "uuid — null for potential_match types",
  "has_previous_visits": "boolean",
  "phone_verified": "boolean — false for potential_match types"
}
```

No existing phone info returned to client for any match type.

### `resolve_potential_match.core-sql` (new)

Called after patient responds to the match resolution screen.

Parameters:
- `p_location_id uuid`
- `p_first_name text, p_last_name text, p_birthday date, p_sex text`
- `p_phone text` — new phone (phone_change, add_phone actions) or NULL (no_phone_verify, new_patient with no phone)
- `p_old_phone text` — previous phone entered by patient to prove identity (phone_change, no_phone_verify only; NULL for add_phone and new_patient)
- `p_action text` — `'phone_change'` | `'no_phone_verify'` | `'add_phone'` | `'new_patient'`
- `p_was_referred boolean DEFAULT false, p_referred_by text DEFAULT NULL`

**Race condition safety:** All actions that look up an existing patient record must use `SELECT ... FOR UPDATE` on the patient row before creating a visit. This prevents two concurrent submissions (double-tap) from creating duplicate visits.

Logic:

**`phone_change`:**
1. `SELECT ... FOR UPDATE` patient by (org, name, birthday, old_phone) WHERE NOT is_orphaned
2. If no match → return `{success: false, error: 'old_phone_mismatch'}`
3. If active visit on that record → return `{success: true, match_type: 'active_session', ...}`
4. Create visit with `pending_phone = p_phone` (new phone NOT written to patient yet), `phone_verification_pending = true`
5. Return `{success: true, match_type: 'returning', session_token, visit_id, phone_verified: false}`
6. Client proceeds to SMS verification; `verify_phone_and_link` writes pending_phone to patient on success

**`no_phone_verify`:**
1. `SELECT ... FOR UPDATE` patient by (org, name, birthday, old_phone) WHERE NOT is_orphaned
2. If no match → return `{success: false, error: 'old_phone_mismatch'}`
3. If active visit on that record → return `{success: true, match_type: 'active_session', ...}`
4. Create visit with `phone_verification_pending = false` (old phone entry already proved identity)
5. Return `{success: true, match_type: 'returning', session_token, visit_id, phone_verified: true}`
6. Client skips SMS verification, proceeds to approval immediately

**`add_phone`:**
1. `SELECT ... FOR UPDATE` null-phone patient by (org, name, birthday) WHERE phone IS NULL AND NOT is_orphaned
2. If no match → record was updated by concurrent request; attempt primary match on (org, name, birthday, p_phone) as fallback
3. If active visit → return active_session
4. Create visit with `pending_phone = p_phone` (new phone NOT written to patient yet), `phone_verification_pending = true`
5. Return `{success: true, match_type: 'returning', session_token, visit_id, phone_verified: false}`
6. Client proceeds to SMS verification; `verify_phone_and_link` writes pending_phone to patient on success
   Session recovery: patient returns with new phone → primary fails (patient still null-phone) → secondary finds null-phone → `potential_match_add_phone` → "yes returning" → add_phone → finds null-phone → active visit → `active_session` ✓

**`new_patient`:**
1. Create new patient record with (name, birthday, sex, phone = p_phone already set, phone_verified = false)
2. On UNIQUE_VIOLATION (race condition: concurrent submission): look up the race-winner record → check for active visit → return `active_session` if found, or create visit on existing record as `returning`
3. Create visit with `phone_verification_pending = true` if phone provided, `false` if no phone
4. Return `{success: true, match_type: 'new', session_token, visit_id, phone_verified: false, has_previous_visits: false}`
5. Client triggers SMS verification if phone provided, skips if no phone
   Note: phone is written to patient immediately for new patients (not via pending_phone). Session recovery: patient enters same phone → primary match finds them → `active_session` ✓

All actions return `is_discovery_eligible: boolean` — true when match_type is `new` and location has `ask_discovery_source` enabled.

Uses private/public wrapper pattern per CLAUDE.md.

### `verify_phone_and_link.core-sql` (simplify)

Remove collision resolution logic entirely. New behavior:
- Validates session token matches visit
- If visit has `pending_phone` set: write `pending_phone` to `patients.phone`, set `phone_verified = true`, clear `pending_phone` on visit
- If no `pending_phone`: just set `phone_verified = true` on the patient (phone is already on patient record from when it was created)
- Set `phone_verification_pending = false` on visit in both cases
- Audit trail entry

`phone_verification_pending` is still cleared here — it's the gate that lets the visit into the receptionist approval queue.

**New column added:** `pending_phone text` on visits table — stores the new phone number during `phone_change` and `add_phone` flows until verification completes. NULL for all other visit types.

### `visits` table migration

```sql
-- phone_verification_pending is KEPT but repurposed (simpler: just "waiting for SMS verify")
-- Only add pending_phone for staging new phone during phone_change and add_phone flows
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS pending_phone text;
```

`phone_verification_pending` stays on visits. Its new, simplified purpose: true when this visit is waiting for SMS phone verification to complete. `get_pending_approvals` keeps its filter on `phone_verification_pending = false` — unverified visits stay hidden from the receptionist queue. `get_patient_session` keeps returning `phone_verification_pending` so CheckinFlow can resume the `phone_verification` state on session recovery. The collision logic for how it was previously set is removed; the column itself remains.

### `edit_patient_record.core-sql` (modify)

- Allow phone field updates (currently only name/birthday/sex)
- When phone is updated: set `phone_verified = false` on that patient — they re-verify on next check-in
- Duplicate check updated: validate against full identity key including phone
- Receptionist/manager/owner can update phone from patient profile

### `patients` table migration

```sql
ALTER TABLE public.patients DROP COLUMN IF EXISTS collision_flag;
```

Unique indexes already correct, no changes needed.

### Functions to DROP (and delete .core-sql files)

- `handle_collision_result` — replaced by resolve_potential_match
- `handle_no_phone_existing` — orphan/collision logic no longer needed
- `handle_collision_verify` — collision verification flow removed entirely
- `get_collision_state` — collision state tracking removed entirely
- `decline_phone_verification` — no collision flow to decline
- `collect_phone_post_ai` — phone collected at check-in, not post-AI

### `get_patient_session.core-sql` (modify)

Keep `phone_verification_pending` in the returned JSON — CheckinFlow uses it during session recovery to route back to `phone_verification` state when a patient resumes a session where verification was not yet complete.

Add `pending_phone` to the returned JSON — needed for session recovery during phone_change and add_phone flows. When the patient closed the browser mid-verification, the client may not have the phone number in localStorage (incognito, different device). `pending_phone` tells the client which phone to send the SMS verification code to on resume.

Remove: collision_flag, `phone_no_match`, `phone_required` — any collision-related fields.

### `get_pending_approvals.core-sql` (modify)

Remove `collision_flag` from the returned visit JSON — no longer a concept in the system.

Keep `phone_verification_pending` in the returned JSON — `ApprovalCard` still uses it to show a "Verifying phone..." badge for visits waiting on SMS verification. The filter `WHERE phone_verification_pending = false` also stays, hiding unverified visits from the queue.

---

## Component Changes

### `CheckinForm.tsx`

- Add phone input field with country code selector (reuse PhoneInput component logic)
- Add "I do not have a phone number" toggle — hides phone field, nulls out phone value
- Add SMS terms checkbox (conditionally visible when phone field is shown)
- Phone field validation: E.164 format when provided
- Form submission includes phone value (or null)

### `CheckinFlow.tsx`

**States to remove:** `phone_collection`, `phone_input` (collision context), `no_phone_notice`

**States to add:** `match_resolution`

**States to modify:**
- `phone_verification` — now triggered immediately after form submit (not post-AI)
- `submitting` — handles `potential_match` and `potential_match_no_phone` return types

**Session token rule:** Do not write to `localStorage['hilt_session_token']` until after either `checkin_patient` (for `new`/`returning`) or `resolve_potential_match` (for `potential_match` paths) returns with a visit and session token.

New state flow:
```
form → submitting → checkin_patient()
  → returning (phone_verified=true)        → waiting (skip SMS)
  → returning (phone_verified=false)       → phone_verification → waiting
  → new (has phone)                        → phone_verification → waiting
  → new (no phone)                         → waiting
  → potential_match                        → match_resolution → resolve_potential_match()
       → returning                             → phone_verification → waiting
       → new                                  → [phone_verification →] waiting
       → active_session                       → resume
  → potential_match_no_phone               → match_resolution → resolve_potential_match()
       → returning (old phone matched)        → waiting (no SMS)
       → new                                  → waiting (no phone)
       → active_session                       → resume
  → potential_match_add_phone              → match_resolution → resolve_potential_match()
       → returning                            → phone_verification → waiting
       → new                                  → phone_verification → waiting
       → active_session                       → resume
  → active_session                         → resume existing session

waiting → [receptionist approves] → first_timer → chatting → summary_review → queued → claimed → completed
```

Discovery source screen: show after `waiting` state when `match_type === 'new'` and location has `ask_discovery_source` enabled. This applies to new patients from both `checkin_patient` and `resolve_potential_match` paths (use the `is_discovery_eligible` field returned by both functions).

**Approval during verification:** The receptionist can approve a visit while the patient is still on the phone_verification screen (get_pending_approvals does not filter on `phone_verification_pending`). CheckinFlow must handle this: when verification completes, check the current visit status. If already approved → skip the waiting state and proceed directly to first_timer/AI. If not yet approved → enter waiting state as normal. This prevents the patient from getting stuck.

### `MatchResolution.tsx` (new component)

Patient-facing screen for resolving potential matches. No existing phone info revealed.

**For `potential_match` (patient entered a phone, existing records have different phones):**
- "We found an existing record with your name and birthday."
- "Did you recently change your phone number?"
- Two buttons: "Yes, I changed my number" / "No, I am a new patient"
- On "Yes": show phone input labeled "Enter your previous phone number" → submit → `resolve_potential_match` with action `phone_change`
- On mismatch: inline error with retry + "I am a new patient" escape
- On "No": `resolve_potential_match` with action `new_patient`

**For `potential_match_no_phone` (patient selected "no phone", existing records have phones):**
- "We found an existing record with your name and birthday."
- "Please enter the phone number you previously used with us to verify your identity."
- Phone input → submit → `resolve_potential_match` with action `no_phone_verify`
- On mismatch: inline error with retry + "I am a new patient" escape
- "I am a new patient" button: `resolve_potential_match` with action `new_patient`

**For `potential_match_add_phone` (patient entered a phone, existing record has no phone):**
- "We found an existing record with your name and birthday."
- "Are you a returning patient?"
- Two buttons: "Yes, I have been here before" / "No, I am new"
- On "Yes": `resolve_potential_match` with action `add_phone` → SMS verify new phone
- On "No": `resolve_potential_match` with action `new_patient`

All outcomes route into the normal flow via state transitions in CheckinFlow.

### `ApprovalCard.tsx`

Remove:
- `collision_flag` check and all collision-related badge/dialog logic

Keep:
- `phone_verification_pending` badge — repurposed to simply show "Verifying phone..." for any visit awaiting SMS verification (no collision context, no special receptionist action)

Add:
- **"No phone"** badge for NULL-phone patients
- **"Phone updated"** note for phone-change resolutions (informational)
- **"Phone added"** note for add_phone resolutions (informational)

No new receptionist actions required for any case.

### `ApprovalQueue.tsx`

Remove:
- Auto-trigger of `CollisionResolutionDialog` based on `collision_flag && phone_verified`
- State tracking of `phone_verification_pending` changes
- All collision dialog state/props

### `CollisionResolutionDialog.tsx`

Delete entire component. No longer needed.

### `ReceptionistDashboard.tsx`

Remove `collision_flag` and `phone_verification_pending` from the visit interface type.

### `usePatientRealtime.ts`

Remove:
- `phone_required` event listener
- `phone_verified` event listener (patient flow is now synchronous at check-in — no realtime event needed)
- Polling fallback logic that read `phone_verification_pending` to emit synthetic `phone_required` / `phone_verified` events

### `broadcast-visit-update` edge function

Remove handling of `phone_required` event type. Redeploy after change.

### `PhoneInput.tsx` / `PhoneVerification.tsx`

Timing change only — verification now happens at check-in, not post-AI. Component logic unchanged.

---

## Demo Flow

- Check-in form shows phone field
- Demo mode bypasses SMS verification: the `verify-phone` edge function accepts code `000000` for demo orgs (check `organizations.is_demo` flag)
- Demo-generated patients use the real phone entered at demo setup (already stored in demo session) as the phone on the check-in form, so primary match works on return visits within the same demo session
- Post-AI phone collection screen no longer exists

---

## Locale/i18n Updates

### Add (all 10 locale files)

- `checkin.phone_label` — "Phone Number"
- `checkin.no_phone_toggle` — "I do not have a phone number"
- `checkin.sms_terms` — "I agree to receive text messages including verification codes, visit summaries, and follow up reminders. Message and data rates may apply."
- `checkin.match_found_title` — "We found an existing record with your name and birthday."
- `checkin.match_found_phone_change` — "Did you recently change your phone number?"
- `checkin.enter_previous_phone` — "Enter your previous phone number"
- `checkin.enter_phone_on_file` — "Please enter the phone number you previously used with us to verify your identity."
- `checkin.yes_changed_number` — "Yes, I changed my number"
- `checkin.no_new_patient` — "No, I am a new patient"
- `checkin.match_found_returning` — "Are you a returning patient?"
- `checkin.yes_returning` — "Yes, I have been here before"
- `checkin.old_phone_mismatch` — "Phone number does not match our records. Please try again or check in as a new patient."
- `approval.no_phone_badge` — "No phone"
- `approval.phone_updated` — "Phone updated"
- `approval.phone_added` — "Phone added"

### Remove

- All collision-related strings (phone_required, phone_no_match, orphan messages, collision flag UI)
- Post-AI phone collection strings (phone_collection state)
- No-phone-notice strings (no_phone_notice state)

---

## Migration Strategy

1. DB migration: ADD `pending_phone` to visits, DROP `collision_flag` from patients (`phone_verification_pending` is KEPT on visits — repurposed, not dropped)
2. Deploy rewritten `checkin_patient`, new `resolve_potential_match`, simplified `verify_phone_and_link`, updated `edit_patient_record`, updated `get_patient_session`, updated `get_pending_approvals`
3. DROP removed SQL functions (`handle_collision_result`, `handle_no_phone_existing`, `handle_collision_verify`, `get_collision_state`, `decline_phone_verification`, `collect_phone_post_ai`) and delete their .core-sql files
4. Update and redeploy `broadcast-visit-update` edge function (remove phone_required event handling)
5. Regenerate `src/lib/database.types.ts` via Supabase MCP after all schema changes
6. Deploy updated frontend (CheckinForm, CheckinFlow, MatchResolution, ApprovalCard, ApprovalQueue, delete CollisionResolutionDialog, update ReceptionistDashboard, update usePatientRealtime, locale files)

Existing patient records keep working under the new identity model. `is_orphaned` records remain excluded by both primary and secondary checks. NULL-phone records remain valid under the NULL-phone unique index.

---

## What Gets Removed

| Item | Type | Reason |
|---|---|---|
| `collision_flag` column | DB column | Phone is now always part of identity |
| `handle_collision_result.core-sql` | SQL function | Replaced by resolve_potential_match |
| `handle_no_phone_existing.core-sql` | SQL function | Orphan/collision logic no longer needed |
| `handle_collision_verify.core-sql` | SQL function | Collision verification flow removed |
| `get_collision_state.core-sql` | SQL function | Collision state tracking removed |
| `decline_phone_verification.core-sql` | SQL function | No collision flow to decline |
| `collect_phone_post_ai.core-sql` | SQL function | Phone collected at check-in |
| `CollisionResolutionDialog.tsx` | Component | Collision resolution UI removed |
| `phone_collection` state | UI state | Removed from CheckinFlow |
| `phone_input` state (collision) | UI state | Replaced by match_resolution |
| `no_phone_notice` state | UI state | No phone decline path exists anymore |
| `phone_required` realtime event | Realtime | Collision trigger removed |
| `phone_verified` realtime event | Realtime | Verification now synchronous, no async event needed |
| Post-AI phone prompt | UI screen | No longer exists |
| Collision-related locale strings | i18n | Collision flow removed |
