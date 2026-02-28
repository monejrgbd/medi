# Hilthealth - AI Clinic Pre-Screening System

## What Is This

An AI-powered intake system for clinics. Instead of patients sitting in a waiting room doing nothing, they describe their symptoms to an AI on a tablet. The AI asks follow-up questions, narrows down the likely condition, and sends a pre-filled summary to the doctor before the patient even walks into the room.

**Result:** Doctors spend less time asking "so what brings you in today?" and more time actually diagnosing. Clinics move faster. Patients wait less.

## The Flow

```
Patient arrives at clinic
        |
        v
Receptionist hands them a tablet
        |
        v
Patient enters first name + last name
        |
        v
AI conversation begins:
  - "What's bothering you today?"
  - Asks targeted follow-ups based on responses
  - Continues until it has enough to form an assessment
        |
        v
Patient hands tablet back, sits down
        |
        v
Doctor's dashboard (searches by patient name and last name):
  - Patient photo (taken during intake)
  - Full transcript of what patient said
  - AI's assessment: likely condition + reasoning
  - Doctor uses this as a second opinion, not a diagnosis
```

## Who Uses It

| Role | What They Do |
|------|-------------|
| **Receptionist** | Hands tablet to patient, resets it after each use |
| **Patient** | Types/talks about symptoms on the tablet |
| **Doctor** | Pulls up the pre-screening summary before seeing the patient |

## System Components

### 1. Patient Tablet App (iPad web app)
- Simple full-screen interface
- Name entry screen (first + last)
- Photo capture (front camera, one tap)
- Chat interface with the AI
- Session ends when AI has enough info or patient taps "Done"

### 2. AI Symptom Engine
- Conversational - not a form, not a checklist
- Asks open-ended first question, then narrows with follow-ups
- Knows when to stop (enough data to form assessment)
- Produces structured output: symptoms list, likely conditions (ranked), reasoning
- Does NOT diagnose - frames everything as "possible" / "consider"

### 3. Doctor Dashboard (web app)
- Search by patient first + last name
- Shows today's pre-screenings
- Each entry: patient photo, symptom summary, AI assessment, full transcript
- Doctor confirms identity via photo before consulting

### 4. Clinic Admin Panel
- Manage subscription/billing
- View usage (number of patients screened)
- Manage doctor accounts

## Business Model

### Trial
- Clinic gets a tablet + 30 days free access
- Full functionality, no restrictions

### After Trial
- Per-patient pricing: **$0.50 - $2.00 per patient screened**
- Price depends on which monthly plan the clinic chooses (higher plan = lower per-patient rate)
- Contact clinic **7 days before trial ends** with their pricing based on selected plan

### Plans (to be finalized)

| Plan | Monthly Fee | Per-Patient Rate | Includes |
|------|------------|-----------------|----------|
| Starter | Low | $2.00 | Up to X patients/mo |
| Standard | Mid | $1.00 | Up to Y patients/mo |
| Premium | High | $0.50 | Unlimited |

## Tech Stack (Proposed)

| Layer | Tech | Why |
|-------|------|-----|
| Frontend | Next.js | Fast, works great as iPad web app (add to home screen = full screen) |
| Backend | Supabase | Auth, database, realtime, edge functions - already set up |
| AI | Claude API | Conversational, good at medical reasoning, structured output |
| Hosting | Vercel | Pairs with Next.js, easy deploys |
| Payments | Stripe | Industry standard for SaaS billing |

## Database (High Level)

- **clinics** - clinic info, subscription status, plan
- **doctors** - linked to a clinic, login credentials
- **sessions** - one per patient visit (name, photo, timestamp, clinic_id)
- **messages** - the AI conversation (linked to session)
- **assessments** - AI's final output (symptoms, conditions, reasoning, linked to session)

## Key Decisions to Make

1. **Name** - see name candidates below
2. **Photo capture** - during intake or skip for MVP?
3. **Voice input** - type only for MVP, or add speech-to-text?
4. **Multi-language** - English only for MVP?
5. **Plan pricing** - exact tiers and per-patient rates
6. **Tablet management** - do we provide iPads or BYOD?

## What's Next

1. Pick a name
2. Set up Supabase schema
3. Build the patient tablet flow (MVP)
4. Build the doctor dashboard (MVP)
5. Integrate Claude API for symptom conversation
6. Test with a mock clinic scenario end-to-end
7. Add billing (Stripe)
8. Package trial offer for clinic outreach
