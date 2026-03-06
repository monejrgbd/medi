# Plan 2.0 — Hilt Health (Future)

This document captures features planned beyond V1. These are not in scope for initial launch but are confirmed directions.

---

## Remote Intake (Start from Home)

Using the embeddable widget (V1) or a direct link from the clinic's website, patients can start the AI conversation **before arriving at the clinic**.

### Flow

1. Patient visits the clinic's website → clicks "Check in online" or similar
2. Patient enters first name, last name, and birthday to create or match their record
3. Patient selects a **timeslot** from available windows the clinic has configured (e.g., "10:00–10:30 AM", "2:00–2:30 PM")
4. Patient completes the AI conversation from home — same flow as in-clinic (voice input, meds/allergies confirmation, patient-approved summary)
5. Patient arrives at the clinic within their timeslot → receptionist confirms arrival → patient gets **priority in the queue** over walk-ins
6. If the patient doesn't show within their timeslot, they lose priority and are treated as a regular walk-in (or marked as no-show if they never come)

### Why This Matters

- Patient arrives already processed — no waiting room AI time, straight to queue
- Clinic can predict volume by timeslot and staff accordingly
- Reduces physical waiting room congestion even further
- Patients who plan ahead are rewarded with shorter waits

---

## Smart Conversation Pacing

Post-launch prompt optimization based on real conversation data. The AI adapts its questioning style to the patient's communication pattern:

- **Brief responders** — one question at a time, open-ended phrasing, patience cues, short AI responses that mirror their energy
- **Detailed responders** — skip already-answered questions, jump to gaps only, can batch 2 questions per message, more direct tone
- **Anti-fatigue detection** — if response length declines across messages, prioritize critical missing info and wrap up. If patient repeats themselves, course correct
- **Universal** — always acknowledge what the patient said before next question, never stack more than 2 questions

This lives entirely in the system prompt — no code changes. Should be tuned using real conversation data from V1 to identify where patients drop off or get frustrated.

---

---

## External Review Integration

Integrate official APIs to pull external reviews into the Hilt Health review hub, making it the single place for ALL clinic reviews.

- **Google Business Profile API** — clinic authorizes access to their Google account, we pull reviews automatically
- **Yelp Fusion API** — same approach for Yelp reviews
- Review hub shows which reviews came from the Hilt Health SMS funnel vs. organic
- Clinics get a full picture of their review landscape in one dashboard

---

## Paid Add-Ons (V2)

- **Patient Broadcast SMS ($49/mo)** — bulk SMS to patient base with smart targeting using health data. Example: "Send flu shot reminder to all patients with respiratory conditions in last 6 months." Clinic composes message, selects targeting criteria, reviews audience size, sends.
- **Post-Visit Care Instructions SMS ($29/mo)** — doctor sends care instructions to patient's phone after completing visit. Type free-form or pick from saved templates. Stored on the visit record. Patient gets an SMS with the instructions they can reference at home.

---

## Cross-Clinic Patient Linking

Enable patient records to be linked across organizations via the referral system. When Clinic A refers a patient to Clinic B, and the patient consents, a cross-org link is established so both clinics see shared history going forward. Requires patient consent flow, data sharing scope definition, and handling for when a clinic leaves the platform.

---

## Hilt Health Internal Admin Panel

An internal dashboard for the Hilt Health team to view and manage all incoming feature requests and custom build requests submitted by clinics. See who requested what, from which organization/location, prioritize, and track status.

---

## Open Questions for V2

- Can patients reschedule their timeslot online?
- How far in advance can they book? Same day only, or next few days?
- Should the clinic set a max number of remote check-ins per timeslot to prevent overbooking?
- Does the receptionist need to approve remote check-ins, or are they automatic?
