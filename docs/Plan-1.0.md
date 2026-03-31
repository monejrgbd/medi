# Plan 1.0 — Hilt Health

## Context

Clinics waste significant time on verbal symptom intake. Patients struggle to articulate everything in a short doctor interaction. Hilt Health replaces this with an AI-powered intake system: patients describe symptoms to an AI agent before seeing the doctor. The doctor receives a structured summary, transcript, and AI diagnostic opinion before ever meeting the patient. Result: more patients per day, better-informed doctors, patients who feel heard.

---

## What We Are Building

An AI pre-screening platform for medical clinics. A patient scans a QR code, converses with an AI about their symptoms, and joins a queue. The doctor reads the AI-generated summary and claims the patient. The system manages the entire flow from arrival to completion across four roles.

---

## The Patient Journey

1. **Arrival & QR Scan** — Patient walks in and scans a location-specific QR code on their own phone. If they don't have a phone or internet, the receptionist gives them a clinic-owned tablet (tracked per location). QR check-in only works when at least one receptionist is checked in at that location. If none are checked in, the patient sees "This location is not currently accepting check-ins" with operating hours displayed if configured. Operating hours are informational, not a hard gate. Patient enters their first name, last name, and birthday. The system matches automatically:
   - **Name + birthday matches an existing record** → returning patient → receptionist asks the patient if they've been here or at any of the organization's other locations before. If yes, receptionist approves. If no (patient claims to be new), verbal confirmation alone isn't enough — the receptionist clicks "Verify Phone" which prompts the patient to enter and SMS-verify their phone number on their device. If the existing record has a phone: match triggers a shared-phone check (receptionist asks if the phone is shared with someone who has the same name and date of birth — if no, same person, proceed as returning; if yes, that name + birthday + phone combination is blocked — each person must get a separate phone number for next time, visit handled manually), no match means confirmed collision — both records stay active (distinguishable by phone), name + birthday flagged permanently. If the existing record has no phone: it's orphaned (frozen, unmatchable) and the new patient's SMS-verified phone is used for a fresh record, name + birthday flagged permanently. Phone required on all future check-ins for flagged combos.
   - **Name + birthday flagged (phone required)** → patient is asked to enter and SMS-verify their phone number. Matched by phone to the correct record. If the phone doesn't match any record (e.g., the original patient returning for the first time since the collision), the receptionist sees a note explaining that orphaned records exist for this name + birthday and a new account is expected — patient provides phone, fresh record created.
   - **No match** → new patient registration → receptionist approves the new record
   - When approving a new patient, receptionist sees a "Similar patients" hint (same birthday or similar names) as a safety net for typos.
   - Patient sees "Waiting for approval" until the receptionist approves or denies.
   - **If denied** → patient sees "Your check-in was not approved. Please speak to the front desk." Patient can try again by re-scanning. No credit used.
1a. **Self-reported referral** (optional, per location toggle `ask_referral_source`) — the check-in form shows a checkbox: "I was referred here by another provider." If checked, an optional free text field appears for the referring doctor or clinic name. This creates a referral record in the system (source='self_reported', status='patient_arrived', linked to the visit) visible in the referral inbox alongside Hilt-to-Hilt referrals. Receptionist sees a "Patient reports being referred" badge on the approval card. Applies to all patients (new and returning).
1b. **Discovery source** (optional, per location toggle `ask_discovery_source`) — shown as a post-check-in screen ONLY for genuinely new patients (first visit at this org). After `checkin_patient` returns `match_type: "new"`, a screen appears: "How did you learn about us?" with a dropdown (Google Search, Social Media, Friend or Family, Doctor Referral, Insurance Directory, Walk in, Other). Patient can skip. Returning patients never see this screen. Data feeds into discovery analytics (Patients tab in Manager Dashboard, summary widget on Owner Overview).
2. **First-Timer Explainer** — If it's the patient's first time with Hilt Health AI (checked via history), a brief overlay explains:
   - Use your wait time to share everything on your mind — no rushing
   - Your doctor reads this before they walk in, so you won't have to repeat yourself
   - You'll receive a copy of your visit summary by text — it's yours to keep and show any doctor, anytime
   - Includes a consent checkbox (agree to terms/privacy policy) before proceeding
3. **Language selection** — part of the first-timer explainer flow (default English), saved on patient record for future visits. In the chat, a language button at the top lets them switch anytime. System runs entirely in English internally — translation is just an I/O layer. Patient messages translated to English before AI processes them, AI responses translated to patient's language before display. Summary/diagnostic stored in English (source of truth), translated copy shown to patient for approval. Doctor always sees English. UI strings translated per language.
   - **Supported languages:** 130+ languages via Google Translate API. UI strings also pre-translated via the API and stored. Quality issues fixed on a per-language basis as clinics report them.
   - **Language picker sorting:** Top languages shown first (English, Spanish, French, German, Portuguese, Italian, Japanese, Korean, Chinese, Dutch, Russian, Arabic, Hindi, Turkish, Vietnamese, Thai, Indonesian, Polish, Swedish, Ukrainian), then remaining 110+ alphabetically below. Searchable.
4. **AI Conversation** — Greeting (system-generated, not from the AI): "Hello [Name], welcome to [Clinic]! Could you describe what you're feeling?" Patient can type or use **voice input** (tap mic, Google Cloud Speech-to-Text). For non-English patients: speech-to-text in their language → Google Translate to English → Claude processes in English → response in English → Google Translate to patient's language → displayed. For English patients: speech-to-text → straight to Claude, no translation calls. All Google ecosystem (Speech-to-Text + Translate API). The AI then takes over the conversation. See AI Behavior section below.
5. **Phone number** — after the AI conversation, the patient is always asked for their phone number (if we don't already have it on file). SMS code verification to confirm it's real. Once verified, stored on their patient record — never asked again on future visits. This is a core step, not configurable by the clinic. The patient enters `waiting_doctor_claim` and appears in the staff queue immediately after the AI conversation finishes — phone collection does not block this. The phone step happens on the patient's screen while they're already in the queue.
6. **Queue** — The patient is in the queue as soon as the AI conversation ends. Before phone verification, they see the phone input screen. After verifying, they see the live queue view: "You're in the queue. [X] people ahead of you. Estimated wait: ~[Y] minutes. This will update live — you'll be called when it's your turn." Phone verification unlocks the queue visibility for the patient, but their position in the queue is already active.
7. **Doctor Claims** — When a doctor claims the patient, the patient's screen updates to show they've been claimed. The receptionist also sees this status change.
8. **Doctor Visit** — Doctor reads transcript + AI diagnostic, conducts their visit with full context.
9. **Completion** — Doctor enters their actual diagnosis and marks the patient as complete. The patient has a verified phone number (collected in step 5):
   - **Visit summary SMS** (only if no referral was created for this visit) — patient receives a link to a secure Hilt Health-hosted page showing: clinic name, date, doctor name, their approved summary, doctor's diagnosis, and meds/allergies/chronic conditions on file. Does NOT include doctor notes or the AI diagnostic (doctor-eyes-only). Link is persistent — patient can pull it up anytime. Each visit gets its own link, building a personal health timeline. The patient owns this — they can show it to any doctor, ER, specialist, or family member. If the doctor referred the patient through our system, the information transfer is already handled — no duplicate SMS needed.
   - **Review funnel SMS** (add-on only) — if the clinic has the Review SMS add-on enabled, the review link is triggered after the visit summary.

**Session recovery:** If a patient closes the browser or switches devices, they rescan the QR and re-enter first + last name + birthday to resume where they left off. If their name + birthday is flagged (collision), phone is also required to identify the correct session. Birthday (and phone when applicable) required to prevent someone else from hijacking the session. No receptionist re-approval needed — the active session resumes directly.

**Same-day return:** If a patient returns later the same day, it's treated as a normal new visit — new session, new credit, new AI conversation.

### Check-in Identity Flow (Clarified)

This section exists to prevent implementation ambiguity. The check-in identity system has three paths:

**Path A — No match (name + birthday doesn't match any record):**
1. New patient registration
2. Receptionist approves
3. Record created (no phone required)

**Path B — Match found, no collision flag:**
1. Receptionist asks patient "have you been here before?"
2. Patient says **yes** → returning patient, receptionist approves, done
3. Patient says **no** → verbal confirmation alone isn't enough. Receptionist clicks **"Verify Phone"** which prompts the patient to enter and SMS-verify their phone number on their device. Then:
   - **Existing record has phone** → compare. If it matches → receptionist asks: "Is this phone number shared with someone who has the same name and date of birth?" **No** → same person (confused or forgot), proceed as returning. No flag needed. **Yes** → that combination of first name, last name, birthday, and phone number is blocked from future use. Receptionist tells both individuals to each get a separate phone number for next time. This visit is handled manually. If it doesn't match → confirmed collision, both records stay active (distinguishable by phone). Name + birthday flagged permanently.
   - **Existing record has no phone** → can't verify ownership. Existing record is orphaned (frozen, no longer matchable). New patient's SMS-verified phone is used for a fresh record. Name + birthday flagged permanently.

**Path C — Match found, collision flag exists (phone required):**
1. Patient is prompted to enter and SMS-verify their phone number
2. Phone matches an existing record → that's the patient, proceed as returning
3. Phone doesn't match any record → receptionist sees a note: "Orphaned records exist for this name + birthday. A new account is expected." → fresh record created with this phone

**Key rules:**
- **Every phone entry in the collision flow is SMS-verified.** No exceptions — this proves ownership and prevents impersonation.
- Collision phone verification is a **system safety mechanism** — since phone is always collected, the collision flow simply uses the same verified phone.
- Orphaned records are preserved but frozen — they retain visit history, meds, allergies, and notes, but are not matchable during check-in.
- **No flag on false alarm** — if the patient says "I'm new" but their SMS-verified phone matches the existing record, the receptionist is asked if the phone is shared with someone who has the same name and date of birth. If no (most cases), it's the same person — proceed as returning, no collision flag set. If yes, that combination of first name, last name, birthday, and phone number is blocked from future use — each person must get a separate phone number for next time. This visit is handled manually.
- Session recovery for flagged name + birthday combos requires phone in addition to name + birthday.
- The DB unique key is (org, first name, last name, birthday, phone). Phone is nullable for non-collision patients.
- **No phone available** — if a patient hits the collision flow but can't SMS-verify (no phone at all), the receptionist sees a note: "This patient cannot be entered into the system without phone verification. Please handle manually."
- **Liability disclaimer** — patients who share the same first name, last name, and date of birth must not use the same phone number. The system identifies returning patients by matching these fields. If two different individuals share identical information across all fields, the system cannot distinguish them. We are not liable for any records affected in this scenario.

---

## AI Behavior

### What It Knows
- The AI does NOT have access to the patient's name or PII. The greeting is system-generated; the AI only sees the conversation thread.
- **Past visit awareness** — when a patient finishes a session, the AI immediately generates and stores a summary of that conversation. On future visits, the AI receives all past summaries (not full transcripts) to check for connections: "Last time you came in for headaches — is this related?" Full transcripts are only pulled up on demand (e.g., when a doctor wants to read a specific past visit).

### How It Behaves
- **Thinks like a triage nurse** — asks what a doctor needs to know: chief complaint, onset, duration, location, severity, sharp vs. throbbing, aggravating/relieving factors, related symptoms
- **Always asks about medications, allergies, and chronic conditions** — every visit, no exceptions. Doctors need this. Each patient has stored records for medications, allergies, and chronic conditions (diabetes, hypertension, asthma, etc.). If returning, the AI confirms what's on file: "Last time you mentioned you take [medication], are allergic to [allergy], and have [condition]. Is this still accurate?" Any changes update the stored records.
- **Urgency detection** — AI assigns priority during conversation: **high** (red-flag: chest pain, breathing difficulty, severe bleeding), **medium** (concerning: high fever, significant pain, possible infection), **low** (standard: cough, rash, routine). Queue sorted: high → medium → low, FIFO within each level. High priority visually alerts staff.
- **Never diagnoses or suggests treatment to the patient** — the AI is intake only. The AI diagnostic is doctor-eyes-only. If a patient asks "Do you think I have X?", the AI deflects: "That's something your doctor will assess. Let me make sure they have all the information they need." This is an iron-clad rule in the prompt.
- **Sensitive topic handling** — if the AI detects the conversation involves mental health, substance use, sexual health, or similar, it adapts its tone to be extra careful and non-judgmental. The transcript is flagged as sensitive so doctors approach with appropriate care.
- **Follow-up mode** — when the receptionist selects a follow-up visit, the AI receives the prior visit context + the doctor's follow-up instructions and asks accordingly (e.g., "How are you feeling since your visit on [date]? Has the [treatment] helped?") instead of starting from scratch.
- **Conversational but efficient** — short follow-ups, not chatty
- **Knows when to stop** — once it has a complete picture, asks: "Is there anything else we might be missing?" If no, it shows the patient a review of what the AI understood. The format depends on the **clinic's display setting** (configured by owner/manager):
  - **Summary mode** — plain-language paragraph: "Here's what I understood: [summary]. Is this accurate?"
  - **Structured card mode** — standardized intake form (chief complaint, onset, duration, severity, location, associated symptoms, aggravating/relieving factors, what they've tried)
  - The clinic picks one. That's what the patient approves, and that's what the doctor reads. Everyone sees the same patient-approved format.
  - The summary is always generated and stored in the database regardless of display mode. The structured card is only generated if the clinic has it set as their default.
  - **Medical info confirmation** — alongside the summary, the patient sees their medications, allergies, and chronic conditions currently on file. This lets the patient confirm or flag outdated medical info in the same approval step. Displayed as a compact card below the summary: "Your information on file" with meds, allergies, and chronic conditions. If the patient rejects, they return to the conversation to correct the information.

### Output to Doctor
The doctor sees the full raw transcript, plus two things at the bottom:
1. **Patient-approved summary or structured card** — whichever format the clinic has configured. This is what the patient reviewed and confirmed.
2. **AI Diagnostic** (Advanced AI only) — the AI's best assessment of what's going on, with reasoning. Doctor-eyes-only — patients never see this.

---

## Patient Statuses

```
still_answering_ai -> waiting_doctor_claim -> claimed_by_doctor -> completed
        |                                          |
        -> left                                    -> cancelled (doctor cancels/unclaims)
                         -> left (receptionist marks patient as left from any pre-claim status)
```

- Each patient record includes a `claimed_by` field (which doctor claimed them).
- **30-minute timeout** — if a patient stays in `still_answering_ai` for more than 30 minutes, they are automatically moved to `waiting_doctor_claim`. The doctor sees the incomplete transcript with a flag: "Patient took more than 30 mins. Please ask anything else you need to the doctor."
- **Doctor cancel** — a doctor can cancel/unclaim a patient, which returns them to the pending queue (`waiting_doctor_claim`) so another doctor can pick them up.
- **Left** — receptionist marks a patient who left without being seen. Visible to doctors too.
- **Audit trail** — every status change is logged with timestamp and actor (e.g., "Doctor Smith claimed at 2:14pm", "Receptionist marked as left at 3:00pm"). Referral creation is also logged (e.g., "Dr. Smith created referral for cardiology at 2:14pm, patient notified via SMS at 2:15pm"). Accessible to owner and manager for legal coverage and dispute resolution.
- **Stale session cleanup** — patients left in `waiting_doctor_claim` from the previous day auto-expire. Receptionist gets notified: "X patients from yesterday were not seen."
- **Check-out guard** — doctors can't check out while they have claimed patients. Must complete or cancel each one first. Prevents patients stuck in `claimed_by_doctor` limbo.
- **Last-doctor warning** — if a doctor is the last one checked in at the location and there are patients in `waiting_doctor_claim`, show a warning: "You're the last doctor checked in. X patients are still waiting." Doctor can still check out, but they're warned. Receptionist is also notified.
- **Concurrent session guard** — one active session per patient per organization at a time. If a patient scans QR at Location B while having an active session at Location A, they resume the Location A session (with a notice). Receptionist at Location A is notified if the patient appears at a different location.

---

## Notifications & Real-Time Updates

- **Real-time mechanism**: WebSocket connections for all live views (patient queue position, staff dashboards). Fallback to polling if WebSocket drops.
- **Staff notifications**:
  - New patient in queue → browser notification + subtle sound (configurable on/off per user)
  - High-urgency patient → louder distinct alert sound + persistent banner
  - New check-in awaiting approval → receptionist badge count update
  - Stale sessions from yesterday → on-login notification for receptionist
- **Patient notifications**:
  - Queue position updates → live on screen (WebSocket)
  - Doctor claimed → screen update + browser notification if tab is backgrounded
- **Email notifications** (to owner):
  - Credits below 20% remaining
  - 7 days before trial expiry (already mentioned, formalized here)
  - Daily digest: patients not seen from previous day (ties to stale session cleanup)

---

## Error States & Degradation

- **Internet drops mid-AI-conversation**: Patient sees "Connection lost. Reconnecting..." Messages queued locally, sent when connection resumes. If offline >2 minutes, prompt to check connection. Conversation state preserved server-side — patient can rescan QR to resume.
- **Claude API error**: Patient sees "One moment..." with a retry. After 3 retries, patient is moved to `waiting_doctor_claim` with partial transcript flagged: "AI conversation interrupted. Please ask follow-up questions directly."
- **Google Translate/Speech-to-Text down**: Translation falls back to English-only with a notice to the patient: "Translation is temporarily unavailable. Please continue in English if possible." Speech-to-text button disabled with tooltip.
- **Subscription expires mid-day**: Active sessions complete normally. No new AI conversations can start. Staff dashboards remain accessible. Owner sees a banner: "Your subscription has expired. Renew to continue accepting new patients."
- **All doctors check out with patients in queue**: Receptionist sees a warning: "No doctors are checked in. X patients are waiting."

---

## Roles & Permissions (Per Location)

When a staff member logs in, they see all their assigned roles as options (Doctor, Receptionist, Manager, Reviews). They pick which one to enter.

### Owner
- **Signup** — Owner signs up via Supabase Auth (email + password). Also collects full name and organization name. Premium trial requires an approval code during signup (code is auto generated via domain email qualification or manually by the team). Email is used to contact them 7 days before trial expires.
- Creates the account. This is the admin.
- Creates locations (unlimited).
- Per location: adjust roles, view statistics.
- Full access to all dashboards and views at every location without needing a role assigned. They can enter any role view (Doctor, Receptionist, Manager, Reviews) at any location.
- **Staff management** — two-step process:
  1. **Add user** — owner or manager creates a user at a location (username + password + full name). Each user gets a unique user ID on creation. Managers can only add/see users at their location. Owner can add/see users across all locations.
  2. **Assign roles** — assign one or more roles (doctor, receptionist, manager) to that user at that location. A user can have multiple roles at the same location and different roles at different locations.
- **QR code generation** — when a location is created, the system auto-generates a unique QR code (plain by default). A tiny hint underneath says "Upload a logo for this location" to show it in the center. Logo is per location. Once uploaded, a toggle appears to switch between branded and plain. Owner can download/print as a PDF with configurable patient instructions (defaults to "Scan this to check in"). The instructions text is editable per PDF download, not saved in the system.
- **Tablet logistics** — Clinics use their own device or patients use their phones. Post-trial: clinics purchase their own tablets (any iPad or Android tablet). Hilt Health provides setup guide. Kiosk mode uses iOS Guided Access or Android kiosk mode (built-in OS features). No MDM required. Setup instructions provided.

### Manager
- Adds/removes people from roles within their location.
- Views employee statistics (enhanced if working hours are set for that person, optional):
  - Hours checked in per day
  - **Utilization** — checked-in time vs working hours (e.g., "7h 15m / 8h — 90.6%"). Only shows if working hours are configured.
  - Number of patients (queues) handled
  - Patients per checked-in hour (throughput)
  - Average handling time (claim to complete, doctors only)
  - Idle time (checked in but not actively with a patient, doctors only)
  - Check-in/out log with timestamps and any mid-shift gaps
  - Time-slot breakdown: when each patient queue started and completed
- Views patient statistics:
  - Time spent with AI
  - Time spent waiting
  - Time from doctor claim to completed
  - Averages across all patients
- All statistics keyed per day.

### Doctor
- **Check in/out** — doctors and receptionists must check in to a location when starting their shift and check out when done. No shift duration — simply check in and check out. Managers don't check in — they're just logged in or not. Owners can enter any role view directly without checking in.
- **Queue** — sees all patients with `waiting_doctor_claim` status (not yet claimed). Sorted by priority: high → medium → low, FIFO within each level.
- **Claim is atomic** — if two doctors click "Claim" on the same patient simultaneously, the first one wins. The second doctor sees "Already claimed by Dr. [Name]" and the patient is removed from their pending queue in real-time.
- **Four tabs:** Pending | Claimed by You | Completed | Cancelled
- Patients listed by first and last name.
- Clicking a patient opens the AI conversation transcript with AI Diagnostic and optional summary at the bottom.
- **Past visit access** — if the patient references a previous visit during the AI conversation, the doctor can read that prior transcript too. Full visit history is accessible from the patient's view.
- **Cancel** — doctor can unclaim a patient, returning them to the pending queue for another doctor to pick up.
- **Focus mode** — optional toggle. When enabled, the UI strips down to just the current claimed patient (transcript, diagnostic, notes). When the doctor completes a patient, the next pending patient is automatically claimed and loaded. No queue browsing, no tab switching — just patient after patient. If no patients in queue, doctor sees "No patients in queue. You'll be notified when one arrives." Auto-claim triggers when a patient enters. Doctor disables it to return to the normal multi-tab view.
- **To complete:** doctor must enter their actual diagnosis. This is how they close the queue entry. Optionally, the doctor can tag a **follow-up** — specifying an approximate timeframe (e.g., "follow-up in 7 days") or choosing "Let receptionist schedule" to defer the date to the front desk. Doctor writes instructions for the AI on what to ask when the patient returns (e.g., "Ask if the antibiotics helped and if the fever subsided"). If the timeframe is skipped, the receptionist sets a specific date with the patient before they leave. Follow-ups expire if 90 days overdue.
- **Patient profile card** — when a doctor opens a patient, a quick-glance card appears at the top: meds, allergies, chronic conditions, number of past visits, last visit date + summary. The transcript and diagnostic sit below it. This is the first thing the doctor's eyes land on.
- **Attachments** — doctor can upload images or files to a visit (e.g., X-rays, lab results, photos of conditions). Stored per visit, visible to all doctors viewing that patient. Available for inclusion in referral packages.
- **Notes** — two types of notes, both shared with all doctors by default with a "Make private" toggle:
  - **Patient notes** — persistent notes tied to the patient across all visits (e.g., "anxious patient, take extra time")
  - **Visit notes** — notes tied to a specific visit (e.g., observations during the appointment, follow-up instructions)
  - The system remembers each doctor's privacy preference per patient — if a doctor sets notes to private for a specific patient, future notes for that patient default to private for that doctor
  - When viewing a patient, the doctor sees their own notes plus any public notes from other doctors (attributed to the doctor who wrote them)
- **Referral** — doctor clicks "Refer" on a patient → selects specialty → selects which visit(s) to include from the patient's visit history (each shown as date + summary one-liner, can pick one or multiple) → writes a referral note (required, e.g., "Suspect appendicitis, please evaluate for surgical intervention"). Package includes: patient name + birthday, meds/allergies/chronic conditions, selected visit(s) transcript + summary + diagnosis + AI diagnostic + public doctor notes (patient notes + visit notes from selected visits — private notes excluded), and any attachments the doctor chooses to include from those visits. Each referral record tracks: referring doctor, referring clinic/location, receiving clinic or email, receiving clinic's specialty (e.g., cardiology, orthopedics), and timestamp. Two paths:
  - **Hilt Health → Hilt Health** — if the receiving location has a referral receiving address configured, the referral appears directly in that location's referral inbox within the system. Seamless. The receiving clinic's owner gets incoming referral analytics: which clinics send them patients, which doctors refer to them, and volume over time. Helps identify and nurture referral relationships.
  - **Non-Hilt Health** — doctor enters an email address → PDF sent via our email system with HiltHealth.com branding. Doctor can also download the PDF directly.
  - Free feature — every referral to a non-Hilt Health clinic is organic marketing.
  - **When a referral is created, the visit summary SMS is not sent** — the referral system handles the information transfer. The visit summary SMS is only for visits where the patient leaves without a referral, so they have a portable record to carry themselves.
  - **Self-reported referrals** — patients who were referred by an external provider (phone, fax, letter, verbal) can self-report at check-in via the "Were you referred?" checkbox. This creates a referral record (source='self_reported') in the same inbox as Hilt-to-Hilt referrals. The receptionist sees a badge on the approval card and can view the referral in the inbox. The referral auto-completes when the visit is completed. Captures referral data that would otherwise be invisible to the system.
  - **Referral-to-visit linking at receiving clinic** — each referral gets a unique `referral_id`. When the referred patient checks in at the receiving clinic:
    - **Auto-match**: system checks the referral inbox for matching name + birthday. If found, receptionist sees: "Incoming referral from [Clinic A / Dr. Smith] for [specialty]. Link this visit?" Receptionist confirms.
    - **Manual link**: if auto-match fails (name spelled differently, etc.), receptionist can manually search the referral inbox and link the patient to the correct referral.
    - Once linked, the receiving doctor sees the full referral package (referral note, selected visits, transcripts, diagnosis, AI diagnostic, public notes, attachments) directly in the patient view — no need to dig through the inbox.
    - Patient records stay scoped per organization in v1. Cross-clinic patient linking is v2.
  - **Referral status tracking** — referral lifecycle: `sent` → `viewed` (receiving clinic opened it) → `patient_arrived` (linked to a visit) → `completed` (receiving doctor completed the visit). Referring doctor can check referral status from their referral history. If patient hasn't arrived within 30 days, referral marked as `expired` (can be reactivated).

### Receptionist
- **Self-check-in** — patients scan the QR themselves and enter first name, last name, and birthday. The system matches automatically:
  - **Name + birthday matches an existing record** → returning patient → receptionist asks the patient if they've been here or at any of the organization's other locations before. If yes, receptionist approves. If no (patient claims to be new), verbal confirmation alone isn't enough — the receptionist clicks "Verify Phone" which prompts the patient to enter and SMS-verify their phone number on their device. If the existing record has a phone: match triggers a shared-phone check (receptionist asks if the phone is shared with someone who has the same name and date of birth — if no, same person, proceed as returning; if yes, that name + birthday + phone combination is blocked — each person must get a separate phone number for next time, visit handled manually), no match means confirmed collision — both records stay active (distinguishable by phone), name + birthday flagged permanently. If the existing record has no phone: it's orphaned (frozen, unmatchable) and the new patient's SMS-verified phone is used for a fresh record, name + birthday flagged permanently. Phone required on all future check-ins for flagged combos.
  - **Name + birthday flagged (phone required)** → patient is asked to enter and SMS-verify their phone number. Matched by phone to the correct record. If the phone doesn't match any record (e.g., the original patient returning for the first time since the collision), the receptionist sees a note explaining that orphaned records exist for this name + birthday and a new account is expected — patient provides phone, fresh record created.
  - **No match** → new patient registration → receptionist approves the new record
  - When approving a new patient, receptionist sees a "Similar patients" hint (same birthday or similar names). Receptionist is the human filter for typos. All new patient registrations require receptionist approval.
  - Patient sees a "Waiting for approval" screen until the receptionist approves. Once approved, transitions into the AI conversation. Receptionist can deny if something looks wrong.
- **New visit vs. follow-up** — when activating a returning patient, if they have an active follow-up tag, a "Follow-up" button appears specifying the visit instance (date + reason). Receptionist chooses "Follow-up" (AI enters follow-up mode with prior context + doctor's instructions) or "New visit" (AI starts fresh, still has past summaries). If no follow-up tag exists, it just starts a new visit. If multiple active follow-ups exist from different visits, all are shown and receptionist picks the relevant one.
- **Tablet tracking** — a "Gave Tablet" toggle per patient to track clinic owned devices. When that patient completes, the receptionist can see they still have a tablet and should collect it before they leave.
- **Patient record editing** — receptionist, manager, and owner can edit a patient's first name, last name, and birthday. All edits logged in the audit trail (who changed what, old value → new value, timestamp). Editing is allowed at any time, even during an active session. Edits are validated against the uniqueness constraint — the system blocks any change that would create a duplicate (same first + last + birthday + phone as another patient in the org).
- **Handled button** — "Handled" dismisses a patient from the receptionist's active view. Does not change patient status. Like archiving — clears clutter so the receptionist focuses on patients still needing attention.
- **Live view** — can see the status of patients as they fill out the AI conversation.

### Reviews
- Manager controls who gets this role per location
- Grants access to the review hub: all internal patient ratings, tagged by doctor, which ones went to external platforms

### Staff Lifecycle
- **Password reset**: Owner or manager can reset a staff member's password. Staff cannot self-reset (no email on staff accounts). Owner's own account uses Supabase Auth password reset via email.
- **Deactivation vs deletion**: Staff can be **deactivated** (can't log in, preserved in records — their name still shows on past visits, notes, diagnoses) or **deleted** (removed entirely, past records show "Deleted staff member"). Default action is deactivate. Deletion is a separate confirmation step.
- **Data on removal**: Deactivated staff's notes, diagnoses, and audit trail entries are preserved and attributed. Active claims are force-released back to queue on deactivation.
- **Multi-location**: A staff member can have roles at multiple locations but can only be **checked in at one location at a time**. Checking in at Location B auto-checks out of Location A.

### Patient
- Scans QR, talks to AI, waits in queue with live position + estimated wait time, gets notified when doctor claims them, sees doctor, leaves review.

---

## Business Model

### Trial

Three trial paths. User chooses on the signup form (preselected from /start-trial).

**Pay As You Go Trial** (self-serve, no credit card)
- **$20 worth of credits** (20 credits) + full platform access for 14 days
- Optional approval code upgrades to Premium PAyG Trial (200 credits, 30 days)
- Clinic signs up and starts immediately

**Starter Subscription Trial** (credit card required)
- 14 days free, then $79/provider/mo (auto charges via PayPal)
- Standard AI (Haiku), unlimited screening, per-feature budgets
- Up to 5 providers during trial. Cancel anytime.
- Org starts as standard_trial, PayPal webhook upgrades to starter plan

**Professional Subscription Trial** (credit card + approval code required)
- 14 days free, then $149/provider/mo (auto charges via PayPal)
- Advanced AI (Sonnet), unlimited screening, per-feature budgets
- Up to 5 providers during trial. Cancel anytime.
- Requires valid approval code. Org starts as premium_trial, PayPal webhook upgrades to professional plan

**Subscription trial PayPal setup:** each Starter/Professional plan has a 14-day $0 trial billing cycle configured in PayPal. If user skips PayPal checkout, they keep their PAyG trial (standard_trial or premium_trial with credits).

**Premium Trial (PAyG path)** (domain email gated, automated approval)
- **$200 worth of credits** (200 credits) + full platform access for 30 days
- Requires an approval code to activate, clinic enters the code during signup
- **Automated qualification flow (marketing site):** clinic fills out the "Apply for Premium Trial" form on the marketing site with their clinic email address. The frontend enforces custom domain emails only (not gmail, outlook, etc.). If the email is on a generic domain, the user is told to use a clinic email or book a meeting instead. If the email is on a custom domain, the system auto generates an approval code and emails it after a randomized 5 to 15 minute delay (simulates staff review). The user sees "A staff member is currently online, expect a rejection or approval within one hour." One approval per domain, one request per email.
- **External API (outreach system):** the `request_premium_code` RPC is also callable externally (anon key). When called from an outreach system, generic domain emails (gmail, etc.) are accepted and receive a code, but no domain is claimed. Custom domain emails claim the domain (one per domain). This allows outreach to send codes to contacts regardless of their email provider. Pass `p_email` to generate a code, or `p_domain` to check domain availability. Codes never expire.
- Manual approval codes can still be generated by the team via the **Platform Admin panel** (`/d/admin`) or for edge cases
- **Platform Admin panel** — accessible to designated Hilt Health staff (identified by `is_platform_admin` claim in `app_metadata`). Admin logs in with their real email, auto redirected to `/d/admin`. Features: quick create codes (one click, no identifiers), create codes with identifiers (email, phone, domain, optional approval email), view all codes with status (available, used, expired), copy codes to clipboard. Auth: double gated (server action + SQL function both verify admin claim). Admin accounts are set via a one time SQL update on `auth.users.raw_app_meta_data`.
- 7 days before trial ends, we contact them with pricing based on the plan they choose

### Post-Trial Pricing (Per Provider)

| | Starter | Professional | Business |
|---|---|---|---|
| **Monthly** | $79/provider | $149/provider | $249/provider |
| **Annual (20% off)** | $63/provider | $119/provider | $199/provider |
| **AI Conversations** | Haiku (unlimited) | Sonnet (unlimited) | Sonnet (unlimited) + Opus (4 credits/use) |
| **Summaries** | Sonnet | Sonnet | Sonnet (Opus if location set to advanced) |
| **Diagnostics** | Sonnet (free) | Opus (free) | Opus (free) |
| **Message Limit** | 20/conversation | 35/conversation | 50/conversation |
| **Marketing Budget** | 20/month (~200 SMS) | 100/month (~1K SMS) | 300/month (~1K SMS + 25 Premium AI) |
| **Embeddable Widget** | No | No | Yes |

- **Providers** = doctors + nurses (paid seats). **Admin staff** (receptionists, managers, marketers, reviews role) = free
- **Enterprise**: custom pricing, managed via admin panel
- **Pay as you go**: $1 per credit (credit based for everything, legacy system). Conversation: 1.5 credits (standard) or 4 credits (advanced). Diagnostic: 0.5 credits per visit. SMS: 0.1 credits each.
- **Annual billing**: 20% off, billed yearly. Toggle on pricing page and billing dashboard
- **All plans include every feature**: nurse workflow, vitals, vaccines, referrals, full analytics, custom AI per location, marketing (credit based), all roles, all SMS. No feature gating.
- **Marketing budget** (internally "credits"): used for Premium AI conversations (Starter $3.50, Professional $3.00, Business $2.50, PAyG $4.00), Marketing SMS (0.1, all plans), Marketing AI scans (1 per 1K, all plans). Subscription plans show "marketing budget" to users, not "credits." PAyG shows "credits."
- **Included marketing budget resets each billing cycle** — no rollover. Purchased top-ups persist until consumed (do not expire at cycle reset). PAyG purchased overage expires at reset.
- **PayPal billing**: quantity based subscriptions. Each provider is a unit. Adding/removing providers revises the PayPal subscription quantity automatically.

### Credit Usage Dashboard (Owner)
- Real-time credit consumption: credits used this month, credits remaining
- Projected run out date based on current usage pace
- Available on all plans (credits used for marketing + Opus)

### Payment & Billing
- **Payment processor**: PayPal for subscription billing and overage charges. Quantity based per provider.
- **Payment failure**: 3 retry attempts over 7 days. After 7 days unpaid, service enters read only mode (staff can view existing data, no new AI conversations). After 30 days, account suspended. Owner notified at each stage via email.
- **Cancellation**: Owner can cancel anytime. Access continues until current period end (monthly or annual). Data retained for 90 days post cancellation, then permanently deleted. Owner can request immediate deletion.
- **Annual pricing**: 20% off all plans, billed yearly. Toggle on pricing page and billing dashboard.

### What's Included (All Plans)
- AI pre-screening (Haiku, Sonnet, or Opus depending on plan)
- Doctor summary (always Sonnet) + full transcript
- Analytics dashboard
- Follow up reminders (email, free)
- 130+ language support
- Referral system
- Multi location support
- Kiosk and tablet mode

---

## Settings

### Admin Settings (Owner only)
- Organization name
- Billing / subscription plan management
- Credit usage dashboard (real-time consumption, remaining, projected run-out)
- AI Targeted Marketing add-on (enable/disable, credit based)
- All locations overview

### Location Settings (Owner + Manager of that location)
- Location name, address, operating hours, clinic specialty/category (selected from a list — e.g., general practice, dermatology, pediatrics, orthopedics, mental health, cardiology, etc.). Included in the AI prompt so it asks domain-relevant questions.
- Logo + QR code (upload, toggle branded/plain, download PDF)
- AI model (Standard or Advanced — per location)
- Display format (summary vs structured card)
- Staff management (add users, assign roles, set working hours per staff member)
- Review funnel config (platform links + URLs, cycle time) — only relevant if Review SMS add-on is enabled
- Embeddable widget (code snippet + preview)
- Tablet inventory count
- Ask about referrals toggle (`ask_referral_source`) — show "Were you referred?" checkbox on the check-in form
- Ask how they found us toggle (`ask_discovery_source`) — show "How did you learn about us?" screen for new patients after check-in
- Referral receiving address (email address where this location receives incoming referrals from other Hilt Health clinics)
- Referral inbox (view incoming referrals sent to this location, including self-reported referrals from patient check-in)
- Review hub (view all internal patient ratings, tagged by doctor, see which ones went to external platforms)

---

### Patient Data Ownership
- Patient records are keyed by owner (organization), not by location
- A patient who visits Location A and later goes to Location B under the same owner shares the same record — history, summaries, meds, allergies, chronic conditions all carry over
- **No duplicate patients** — unique key is (first name, last name, birthday, phone) per organization. Phone is nullable in the normal case. If two genuinely different people share the same name + birthday, the new patient must provide an SMS-verified phone number. If the existing record already has a phone, it stays active (distinguishable). If not, it's orphaned (frozen, no longer matchable). From that point on, any check-in with that name + birthday requires phone. Orphaned records are preserved but frozen.

---

## V1 Scope Additions

These are confirmed for v1 beyond the core flow:

1. **Urgency flagging** — AI assigns priority during conversation: high (red-flag), medium (concerning), low (standard). Queue sorted by priority then FIFO. High priority gets a visual indicator for staff
2. **Medications & allergies** — AI always collects this during every conversation
3. **Estimated wait time** — patients see an estimated wait based on average doctor completion times, not just queue position
4. **Past visit context** — AI references prior visits for returning patients; doctor can also access prior transcripts
5. **Doctor diagnosis recording** — doctors must enter their diagnosis to mark a patient complete (enables future AI accuracy tracking)
6. **Multiple review links** — clinic can configure multiple external review platform links (Google, Yelp, etc.) used in the SMS review funnel for 5-star reviewers. Clinic sets a **cycle time** (e.g., 7 days) so platforms rotate — first week sends to Google, next week to Yelp, etc. Spreads reviews evenly across platforms.
7. **Voice input** — patients can tap a mic button and speak instead of typing; speech-to-text with AI responding in text
8. **Doctor cancel/handoff** — doctors can unclaim a patient, returning them to the pending queue for another doctor
9. **Left/no-show status** — receptionist can mark patients who left without being seen; visible in a Cancelled tab for doctors too
10. **30-minute session timeout** — patients stuck in `still_answering_ai` for 30+ minutes auto-move to queue with incomplete transcript flagged for the doctor
11. **Persistent meds & allergies** — stored per patient, confirmed by AI on return visits, updated when changes are reported
12. **Doctor notes** — patient notes (cross-visit) and visit notes (per visit), public to all doctors by default with a "Make private" toggle
13. **Patient-approved summary** — before entering the queue, the patient reviews and confirms the AI's summary, making it validated before it reaches the doctor or gets stored for future visits
14. **Chronic conditions** — stored per patient alongside meds and allergies, confirmed by AI on return visits
15. **Focus mode** — doctor focus mode that strips the UI to just the current patient and auto-claims the next one on completion
16. **Credit usage dashboard** — owner sees real-time credit consumption, remaining balance, and projected run-out date
17. **Cross-location patient data** — patient records keyed by owner so history carries across all locations in the same organization
18. **Name collision handling** — patients always enter name + birthday. Birthday match = returning patient (receptionist confirms), no birthday match = new patient registration. If two genuinely different people share the same name + birthday, the new patient provides an SMS-verified phone. If the existing record has a phone, it stays active. If not, it's orphaned (frozen). Future check-ins for that name + birthday require phone.
19. **Follow-up system** — doctor tags follow-up with timeframe + AI instructions at completion; receptionist sees active follow-ups when activating returning patients; follow-ups expire after 90 days overdue
20. **Patient profile card** — quick-glance card at top of doctor's patient view showing meds, allergies, chronic conditions, past visit count, and last visit summary
21. **Audit trail** — every status change logged with timestamp and actor, accessible to owner/manager
22. **Sensitive topic flagging** — AI adapts tone for sensitive subjects and flags the transcript so doctors approach appropriately
23. **Follow-up mode (AI)** — AI uses prior visit context + doctor's follow-up instructions instead of starting from scratch
24. **Embeddable widget** — clinics can embed the patient intake flow (QR scan, AI conversation, queue) into their own website. Shows a "Powered by HiltHealth.com" badge. Same engine, their site.
25. **Display format setting** — clinic-level setting choosing between summary (paragraph) or structured card (intake form) as the display format. Applies to patient approval step and doctor view. Summary always stored; structured card only generated if selected.
26. **Patient addendum** — "Add more details" button while in queue, lets patients add information after submission. Doctor sees it marked as "Added after submission."
27. **Receptionist dashboard header** — at-a-glance status bar: patients per status, tablets out, doctors checked in. One line, full clinic state.
28. **Self-check-in** — patients scan QR and enter their own info. Returning patients matched automatically, new patients can register themselves. Receptionist just approves/denies. Patient sees "Waiting for approval" until approved.
29. **AI safety guardrail** — AI never diagnoses or suggests treatment to the patient. Deflects if asked. AI diagnostic is doctor-eyes-only.
30. **Phone collection & visit summary SMS** — phone number is always collected after AI conversation (SMS-verified, only asked once per patient). Visit summary SMS sent automatically after every completed visit (no referral). Phone number stored on patient record. This is a core feature, not an add-on.
30a. **Review request SMS** — 0.1 credits per SMS. Post visit review collection, enable or disable per location. Triggers after the visit summary. Included free during trial (14 days standard, 30 days premium) to demonstrate value.
31. **Review hub & funnel** — clinics get a review hub in their admin showing all internal patient ratings. After visit, patient receives an SMS with a link to a Hilt Health-hosted rating page. Page shows clinic name, doctor name, and a 1-5 star selector with optional text feedback. If they rate 5 stars → "Would you also leave a review on [Platform]?" with a direct link (current rotation per the cycle time setting). Below 5 → "Thank you for your feedback." (stays internal only — clinic sees the feedback but unhappy patients aren't funneled to public platforms). All ratings stored in review hub tagged by doctor. Each review is tagged with the doctor who handled that visit.
32. **Follow up reminder SMS** — 0.1 credits per SMS. Automated return visit reminders, enable or disable per location. Doctors can optionally skip the timeframe and let the receptionist schedule a specific date with the patient. Credits charged when date is set (by doctor at completion or receptionist at scheduling). Owner pre-configures: reminder text template + how many reminders to send + timing (e.g., 1st reminder 3 days after due, 2nd 7 days after). Included free during trial (14 days standard, 30 days premium).
33. **Follow-up compliance dashboard** — only available if Follow-up SMS add-on is enabled. Tracks: patients tagged for follow-up → returned (receptionist picked the follow-up) → overdue → reminded via SMS → returned after reminder. Per-doctor compliance rates. Follow-ups expire after 90 days overdue.
34. **Stale session cleanup** — patients left in `waiting_doctor_claim` from the previous day auto-expire. Receptionist notified.
35. **Check-out guard** — doctors can't check out with claimed patients. Must complete or cancel first.
36. **Wait time analytics + peak hours** — heat map showing average wait time by day and hour. Identifies bottlenecks and understaffed time slots. Manager/owner view.
37. **Patient return rate** — tracks what % of patients return within 90 days, return rate per doctor, first-time vs repeat ratio over time. Manager/owner view.
38. **Patient consent flow** — first-time checkbox agreeing to terms/privacy policy before starting AI conversation. Part of the first-timer explainer screen.
39. **Mobile-responsive dashboards** — doctor and receptionist dashboards fully mobile-responsive for use on phones while moving around the clinic. Includes basic WCAG 2.1 AA compliance: sufficient color contrast, keyboard navigability, screen reader labels on interactive elements. Patient-facing screens prioritized (check-in, AI conversation, queue view).
40. **Tablet kiosk mode** — `?kiosk=true` query param activates kiosk mode. Auto-resets on all terminal states (visit completed, denied, timeout, no credits, subscription inactive). Skips session recovery on mount (shared device). Resets language to English between patients. "Kiosk Mode" badge + red "End Session" button for receptionist to manually clear stuck sessions. QRCodeManager has "Patient QR" / "Kiosk QR" toggle. In-app setup guide at `/d/owner/kiosk` with iPad (Guided Access) and Android (Fully Kiosk Browser) instructions. Device-level lockdown handled by OS — no MDM required.
41. **AI summary disclaimer** — on doctor view: "AI-generated summary approved by patient. Refer to full transcript for accuracy."
42. **Referral system** — doctor generates referral packages with patient data. Seamless transfer between Hilt Health clinics, PDF with HiltHealth.com branding for non-Hilt Health clinics. Free — doubles as organic marketing.
43. **Custom requests** — available everywhere: in the admin panel for owners (labeled "Request Custom Build") and on the role selection screen for staff (labeled "Request a Feature", alongside Doctor, Receptionist, Manager, Reviews). Anyone can submit feature requests, suggestions, or ideas. Each request is keyed by user ID — so we know who requested what and from where. Saved to our system so we can track what clinics want and prioritize accordingly.
44. **Patient search** — accessible from Doctor, Receptionist, Manager, and Owner views. Search by name, birthday, or both. Results show: name, birthday, last visit date, number of visits. Clicking opens the patient profile with full visit history, notes, meds/allergies/chronic conditions, and past referrals. Scoped by organization (owner's account) — a doctor at Location A can find patients from Location B under the same owner.
45. **Notification system** — WebSocket real-time updates, browser notifications for staff, email alerts for owner (low credits, trial expiry, stale sessions)
46. **Error handling** — graceful degradation for API failures, connection drops, subscription expiry. Partial transcripts flagged for doctors.
47. **Staff lifecycle** — deactivation vs deletion, password reset by owner/manager, single-location check-in constraint
48. **Concurrent session guard** — one active session per patient per org at a time. Second scan resumes existing session, doesn't create a new one.
49. **Referral status tracking** — referral lifecycle: sent → viewed → patient arrived → completed. Referring doctor can see current status.
50. **Platform Admin panel** — internal admin dashboard at `/d/admin` for designated Hilt Health staff. Create and manage premium trial approval codes (quick create or with email/phone/domain identifiers). View all codes with status tracking. Admin identity stored as `is_platform_admin` claim in `auth.users.app_metadata`, auto redirect on login. Double gated auth (server action + SQL SECURITY DEFINER).
51. **AI targeted marketing SMS** — owner defines targeting criteria via structured form filters (age range, sex, visit recency, visit count) and/or a free text AI criteria box (e.g. "patients with joint pain"). Structured filters run instantly in SQL, AI criteria triggers Claude evaluation of patient clinical profiles (visit summaries, diagnoses, medications, allergies, chronic conditions) in batches. Compose together: structure narrows pool, AI evaluates what passes. Owner reviews matched patients with reasons, excludes individuals, writes message body with `{first_name}` and `{clinic_name}` variables, and sends. "Reply STOP to opt out" appended to every message. SMS delivery uses queue pattern: `process-campaign-sms` cron runs every minute, picks up 50 pending per campaign, sends via existing `send-sms` edge function. No timeout risk at any scale. Credits: 0.1 per SMS sent, 1 credit per 1K patients for AI scans (structure only scans are free). Gated by `marketing_sms_addon` on organizations (toggled from the marketing page itself). Cancellation mid send refunds credits for unsent recipients. New tables: `sms_campaigns`, `sms_campaign_recipients`. New edge functions: `ai-scan-campaign`, `process-campaign-sms`. New pg_cron: `process_campaign_sms` (every minute). Owner only, audit trailed.

52. **Nurse role** — new staff role with its own dashboard at `/d/nurse`. Nurses claim patients from the same queue as doctors, then either complete the visit or release back to the doctor queue with a "nurse reviewed" tag and nurse notes. Doctors see a "Nurse Reviewed" badge in queue and a nurse notes section in the visit detail. Nurse workflow: claim patient, record vitals, administer/record vaccines, write notes, then "Complete Visit" or "Continue to Doctor". Gated by `nurse_enabled` per location. Nurses who release a patient back to queue cannot re-claim nurse reviewed patients (prevents double review). Nurse check in/check out works like doctors. Receptionist sees nurses checked in count and whether a patient was claimed by a nurse or doctor.
53. **Patient vitals tracking** — generic measurement model supporting any vital type. Ships with 11 predefined vitals (Weight, Height, Blood Pressure Systolic/Diastolic, Heart Rate, Temperature, Oxygen Saturation, Respiratory Rate, Blood Glucose, BMI, Head Circumference) in a global `vital_types` master table. Each org configures which vitals to track via `org_vital_configs` (toggle predefined vitals on/off, add custom vitals with name/unit/min/max). `patient_vitals` stores one row per measurement (vital_config_id + value), not fixed columns. When an org first enables vitals, 6 defaults are auto seeded (Weight, Height, BP, Heart Rate, Temperature). Nurses and doctors record vitals via a dynamic form that adapts to the org's enabled configs. Weight and Height get trend sparkline charts in the history view. Blood Pressure Systolic + Diastolic are paired as "120/80 mmHg" in session displays. Vitals history is accessible from three places: nurse claimed patient view, doctor visit detail (as a tab), and patient search profile. Owner or manager configures vital types at `/d/vitals-config`. Gated by `vitals_enabled` per location.
54. **Vaccine management** — full tracking with schedule awareness, due dates, overdue alerts, lot numbers, manufacturer, injection site, patient refusal tracking. 17 vaccines seeded (Influenza, COVID 19, Tdap, Hepatitis A/B, MMR, Varicella, Pneumococcal, Shingles, HPV, IPV, Meningococcal, Rotavirus, Hib). Tables: `vaccines` (global master list with CVX codes), `patient_vaccines` (administered records), `vaccine_schedule` (due dates per patient with auto completion when vaccine is administered). Gated by `vaccines_enabled` per location.
55. **Per clinic AI adjustments** — two configurable fields on each location: `ai_custom_instructions` (free text appended to the AI system prompt after safety rules, max 2000 chars, e.g. "Ask about family history if applicable") and `ai_message_limit` (optional integer 10 to 50 that overrides the default 30 patient message limit per conversation). The AI is aware of the limit and paces itself to cover critical fields (medications, allergies, chronic conditions) before running out. When 4 messages remain, the AI gets an urgent nudge to wrap up. The hard limit is a backstop that should rarely trigger. Configured by owner in location settings.
56. **Per clinic feature flags** — boolean toggles on locations table: `nurse_enabled`, `vaccines_enabled`, `vitals_enabled`. Each gates the corresponding functionality in SQL functions and frontend. Owner configures per location in settings alongside existing toggles (review_sms_enabled, diagnostic_enabled).
59. **Onboarding feature selection** — new "Customize Your Clinic" step (Step 2) in the onboarding wizard, shown right after location creation. Three toggle cards: Nurse Triage, Vitals Tracking, Vaccine Management. Smart default: enabling Nurse auto enables Vitals. Skip link for clinics that want defaults. If Nurse is enabled, the next step (Add Staff) shows nurse as an assignable role. When Vitals is enabled during onboarding, default vital configs are auto seeded for the org. 6 step onboarding flow: Welcome, Location, Features, Staff, Try It, Done.
57. **Marketer role** — new staff role for delegating marketing campaign management. Assigned per location like all roles, but the dashboard at `/d/marketer` is org scoped with no location pre selection. Marketer picks location scope per campaign in the form (filtered to their assigned locations). Auth: owner OR marketer can create, review, send, and cancel campaigns. Only owners can enable the `marketing_sms_addon`. Marketer sees "Ask your administrator to enable this" if addon is off. Campaigns created by marketers show the marketer's staff_user_id in `created_by`. All existing marketing components reused, no duplication. Rate limit (3 campaigns/24hr) is org wide.
58. **Demo marketing integration** — 200 AI generated fake patients seeded in the demo org across 10 medical categories (diabetes, cardiovascular, mental health, musculoskeletal, respiratory, GI, neuro, healthy, obesity/sleep, elderly/rare). Each patient has realistic demographics, medications, allergies, chronic conditions, and 2 to 4 completed visits with summaries and diagnoses. Demo limited to 3 scans per session on the UI side. Marked with `is_demo_patient = true` on patients table. Phone numbers use `+1555000XXXX` format. `process-campaign-sms` skips actual SMS delivery for demo patients (marks as sent without calling D7). Demo org has `marketing_sms_addon` enabled and demo staff user assigned the marketer role. Marketing tab added to demo alongside existing Patient, Receptionist, Doctor, Reviews, Q and A tabs.

60. **Demo live tracker** — internal tool at `/demo/track` for team members doing remote demo calls. Each team member gets a unique code (e.g. `HK001`). They share `hilthealth.com/demo?team=HK001` with the prospect. The team code is silently captured from the URL and stored on the `demo_access` record when the prospect enters their email. During the call, the team member opens `/demo/track`, enters their code, and sees the prospect's demo progress in real time (polls every 3 seconds): current step (1 through 5), patient name, message count during AI screening, and contextual talking points that appear at each step. Talking points are things NOT already shown in the demo's built in text, covering urgency detection, patient verified summaries, doctor only AI diagnostics, follow up AI instructions, visit summary SMS, and the review filtering funnel. No authentication required beyond knowing a valid team code. Zero friction for the prospect since the code is a URL parameter they never see. SQL function `get_demo_tracker` runs as SECURITY DEFINER to bypass RLS. New column: `demo_access.team_code`. New SQL function: `get_demo_tracker`. New page: `/demo/track`.
61. **Queue type per location** — each location chooses one of five queue modes, stored as `queue_type` on the `locations` table. The modes are composable sort layers applied in order:
    - **FIFO** (`fifo`) — strict arrival order. AI does not update priority. Every patient waits their turn. Default for new locations.
    - **Priority** (`priority`) — AI auto assigns urgency (1 to 3), queue sorted by priority then arrival time.
    - **Appointment then Priority** (`appointment_priority`) — scheduled patients first (ordered by appointment time), then priority queue for walk ins. Requires Raven Scheduler integration.
    - **Appointment then FIFO** (`appointment_fifo`) — scheduled patients first (ordered by appointment time), then strict arrival order for walk ins. Requires Raven Scheduler integration.
    - **Critical then Appointment then FIFO** (`critical_appointment_fifo`) — AI flagged critical patients (priority 3) jump everything, then scheduled appointments by time, then FIFO for remaining walk ins. Requires Raven Scheduler integration.
    Owners select the queue type during onboarding (Step 3, after Raven Scheduler) with a note that the setting applies to the location being created and can be changed later in location settings. Appointment based modes are greyed out unless a valid Raven Scheduler API key is configured. Also configurable per location in the location detail settings page.
62. **Raven Scheduler integration** — optional third party scheduling integration. During onboarding (new step after location creation), the owner can enter a Raven Scheduler API key for the location. The key is stored on the `locations` table as `raven_api_key` (encrypted at rest via vault). When a valid key is present, appointment based queue modes become available. Raven provides appointment data keyed by patient phone number, so the phone collection step in the patient flow includes a note: "If you have an appointment, it is critical you fill this in so we can find your booking." The integration enables: appointment aware queue ordering, follow up scheduling sync (Raven can mark bookings as follow ups linked to our follow up system by phone number), and arrival notification (Raven sends check in events so we can mark patients as arrived). We expose a location scoped API that Raven calls into using the API key we generate. Raven also needs to enter our API credentials on their side, configured during the onboarding step. Also configurable per location in settings.

63. **Self-reported referral tracking** — per location toggle (`ask_referral_source`). Check-in form shows "I was referred here by another provider" checkbox with optional free text for referring doctor/clinic. Creates a referral record (source='self_reported', status='patient_arrived', linked to the visit) in the same referral inbox as Hilt-to-Hilt referrals. Receptionist sees "Patient reports being referred" badge on approval card. Referral auto-completes when the visit is completed. Referral analytics updated with by_source breakdown (hilt vs self_reported). Captures external referral data that would otherwise be invisible. Demo location has this enabled.
64. **Discovery source tracking** — per location toggle (`ask_discovery_source`). After check-in succeeds for genuinely new patients (match_type='new'), a screen shows "How did you learn about us?" with preset dropdown (Google Search, Social Media, Friend or Family, Doctor Referral, Insurance Directory, Walk in, Other). Returning patients never see this. Data stored on the visit. New `get_discovery_stats` SQL function powers a "Where New Patients Find You" chart in the Patients tab of the Manager Dashboard and a summary widget on the Owner Overview. Demo location has this enabled.

---

## Out of Scope for V1

- Insurance information collection — Hilt Health is intake, not billing
- Patient self-service account/portal
- Annual billing plans
- Minors/guardian legal consent model — parent checks in child as a regular new patient (child's name + birthday). No special guardian relationship or consent flow in V1.