# Live Interactive Demo

## How It Works

The live demo at `/demo` lets homepage visitors experience the full Hilt Health patient-to-doctor flow using real product components. Visitors enter their email, verify via OTP, and are auto-logged in as a restricted demo staff user. They then switch between three tabs — Patient, Receptionist, and Doctor — walking through check-in, approval, AI conversation, summary review, and visit completion.

The demo works because patient flow uses session tokens (localStorage) while staff dashboards use Supabase auth (JWT cookies). Both coexist on the same page without conflict. A `demoMode` prop on CheckinFlow skips onboarding friction (first-timer consent, language picker, phone verification) and pre-fills the check-in form. On the doctor side, `demoMode` starts in FocusMode and hides the End Shift button to prevent demo breakage.

Access is email-gated: the `request_demo_otp` SQL function generates a 6-digit OTP, stores the bcrypt hash in `demo_access`, and queues the email via `pending_emails` (picked up by `process-email-queue` edge function). Each email is limited to 3 demo sessions. Auto-switching between tabs is driven by Supabase realtime — when a visit status changes (pending_approval → receptionist, still_answering_ai → patient, waiting_doctor_claim → doctor), the DemoShell auto-switches with a 3-second delay and contextual guide messages.

## Files That Represent It

**Route:**
- `src/app/demo/page.tsx` — server component, auth check + data fetch for all 3 dashboards
- `src/app/demo/layout.tsx` — bare layout (Toaster only, no Navbar/Sidebar)
- `src/app/demo/_actions/demo.ts` — server actions (OTP request/verify, demo login/logout)

**Components:**
- `src/components/demo/DemoGate.tsx` — email + OTP verification gate
- `src/components/demo/DemoShell.tsx` — main orchestrator (tabs, realtime, auto-switching)
- `src/components/demo/DemoTabBar.tsx` — 3-tab bar with pulsing notification dots
- `src/components/demo/DemoGuide.tsx` — contextual instruction banner + typing hints
- `src/components/demo/DemoComplete.tsx` — completion screen with sign-up CTA

**Modified components:**
- `src/app/checkin/[locationId]/CheckinFlow.tsx` — `demoMode` prop (pre-fill, skip consent/language/phone)
- `src/components/patient/CheckinForm.tsx` — `demoDefaults` prop for form pre-fill
- `src/app/(dashboard)/d/doctor/DoctorDashboard.tsx` — `demoMode` prop (FocusMode default, hide End Shift)

**SQL:**
- `sql/tables/demo_access.core-sql` — email gate tracking (OTP hash, access count)
- `sql/request_demo_otp.core-sql` — OTP generation + email queueing via pending_emails
- `sql/verify_demo_otp.core-sql` — OTP verification + count increment
- `sql/cleanup_demo_data.core-sql` — hourly cleanup of demo visits + dependent tables

**Homepage:**
- `src/app/(marketing)/page.tsx` — "Try Live Demo" link in hero section

## Dependencies

**Relies on:**
- `pending_emails` table + `process-email-queue` edge function (email delivery)
- Supabase Realtime (auto-tab-switching on visit status changes)
- `check_location_active` RPC (requires receptionist checked in at demo location)
- All patient RPCs (`checkin_patient`, `start_ai_conversation`, `send_patient_message`, etc.)
- All staff RPCs (`get_pending_approvals`, `approve_patient`, `get_queue`, `claim_patient`, etc.)
- `ai-conversation` + `generate-summary` edge functions (real AI conversations)

**What relies on it:**
- Nothing — self-contained feature

**Demo org details:**
- Org, location, and staff IDs are stored in env vars (not committed to source)
- Env vars: `DEMO_STAFF_EMAIL`, `DEMO_STAFF_PASSWORD`, `DEMO_LOCATION_ID`, `DEMO_ORG_ID`, `NEXT_PUBLIC_DEMO_LOCATION_ID`, `NEXT_PUBLIC_DEMO_ORG_ID`

## Testing

**Automated:**
- None yet

**Manual verification:**
1. Visit `/demo` → see email gate
2. Enter email → OTP arrives via email → enter code → demo loads
3. Patient tab: pre-filled form → click Check In → auto-switch to Receptionist (3s delay)
4. Receptionist: see pending patient → click Approve → auto-switch to Patient
5. Patient: AI conversation starts immediately (no consent/language screens) → chat → summary → approve (no phone collection)
6. Auto-switch to Doctor → FocusMode → Claim → see AI summary
7. Complete visit → DemoComplete screen with CTA
8. Open new tab → navigate to `/d/owner` → redirected to `/d/select-role` (no owner access)
9. 4th demo attempt with same email → "Demo limit reached"
10. After 2 hours → verify `cleanup_demo_data` cron deleted demo visits
