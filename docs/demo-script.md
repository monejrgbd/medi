# Demo Guide

## How It Works

The presenter and prospect use the demo simultaneously on a call:

1. **Presenter** opens `/demo/track`, enters their team code (e.g. `HK001`)
2. **Prospect** opens the shared link `hilthealth.com/demo?team=HK001`
3. The prospect follows the on screen instructions at each step
4. The presenter watches their progress in real time (polls every 3 seconds)
5. Contextual talking points appear at each step telling the presenter exactly what to say

## The presenter does NOT narrate the screen

The demo has built in text at every step explaining what to do and why. The prospect reads that. The talking points in the tracker are things the screen does NOT say. They add business value, technical depth, and handle the "so what?" that a prospect has in their head.

## Steps

| Step | Prospect sees | Tracker shows | Talking points cover |
|------|---------------|---------------|---------------------|
| 1. Check In | Form on patient tab | Name entered | No app install, 130+ languages |
| 2. Approve | Waiting screen | Pending approval | Skip AI button, returning patient matching |
| 3. AI Screening | AI conversation | Message count live | Follow up intelligence, urgency detection, returning patient context |
| 4. Diagnose | Doctor FocusMode | Claimed by doctor | Patient verified summary, doctor only diagnostic, vitals/vaccines, care instructions, follow up AI |
| 5. Review | Review submission | Visit completed | Permanent summary link, review filtering funnel |
| 6. Outreach | Marketing campaign | Review submitted | AI patient search, credit costs |

## If They Ask

Objection answers for the presenter to have ready:

**"We have an EMR already."**
This sits in front of your EMR. The patient conversation happens before the doctor opens the chart.

**"HIPAA?"**
Encrypted at rest and in transit. Row level security. Full audit trail. BAA available.

**"What if the AI is wrong?"**
It collects information. It does not diagnose. The patient approves the summary before it reaches the doctor.

**"Can we customize the AI?"**
Per location. Add instructions like "always ask about family history." Set the conversation length from 10 to 50 messages.

**"How long to set up?"**
Sign up, create a location, print the QR code. First patient can check in within 10 minutes.

**Developer asks about architecture:**
Private/public SQL wrapper pattern. JWT scoped RLS. Realtime via Postgres LISTEN/NOTIFY. TypeScript end to end. All serverless edge functions.
