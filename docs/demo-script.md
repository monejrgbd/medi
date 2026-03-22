DEMO GUIDE


THE INTRO (before they touch anything)

Greeting, problem, what Hilt does, demo handoff. Under 60 seconds.

Key points to hit:
  - Greet by name, thank them for the time
  - The bottleneck: doctors spend 5 to 10 minutes per patient repeating the same intake questions
  - The gap: after the visit, nothing happens. No summary, no review, no follow up
  - What Hilt does: AI collects everything before the doctor walks in, handles everything after
  - This is a live product, not slides. They drive it themselves

You could say:

  "Hi [name], [name], thanks for taking the time. Really appreciate it.

  Quick context before I hand you the demo. Every clinic we talk to has the same bottleneck. The doctor walks in and spends the first five to ten minutes asking questions the patient has already answered somewhere else. Medications, allergies, symptoms, history. By the time the real work starts, half the appointment is gone.

  Then after the visit, nothing. No summary sent to the patient. No review collected. No follow up when they are due back.

  Hilt sits between the patient and the doctor. Before the visit, the patient has a conversation with an AI that collects everything the doctor needs. The doctor walks in, reads a one paragraph summary, and starts. After the visit, the system handles the rest.

  I just sent you a link. It takes you to our homepage. Take a minute to scroll through it, it gives you the full picture of what we do better than I can explain it. When you are ready, hit Try Demo at the top. You are going to walk through the full journey yourself, every role, patient, receptionist, nurse, doctor. I will be watching your progress live on my end and adding context as you go. Should take about 15 minutes. Go ahead and open that link."


HOW IT WORKS

The presenter and prospect use the demo simultaneously on a call:

1. Presenter opens /demo/track, enters their team code (e.g. HK001)
2. Prospect opens the shared link hilthealth.com?team=HK001
3. The prospect follows the on screen instructions at each step
4. The presenter watches their progress in real time (polls every 3 seconds)
5. Contextual talking points appear at each step telling the presenter exactly what to say


SETTING THE TEAM CODE

The team code links the prospect's demo session to the presenter's tracker.

The flow:
1. You share hilthealth.com?team=HK001 with the prospect
2. They land on the homepage. The code is silently saved to their browser
3. They browse around, click "Try Demo", land on the demo page
4. The demo reads the code and shows a green badge in the top right
5. When they enter their email, the code is stored on their record
6. You track them at /demo/track

The prospect never types a code. They never see it. It flows from the URL through localStorage to the database silently.

If they open the site without a team link: a small key icon appears in the top right of the demo page. They can click it and type the code you give them verbally. Green badge confirms it is set.

Before the call: make sure you know your team code and have /demo/track open. Share the homepage link (not the demo link) with the ?team= parameter so they can browse first.


DO NOT NARRATE THE SCREEN

The demo has built in text at every step explaining what to do and why. The prospect reads that. The talking points in the tracker are things the screen does NOT say. They add business value, technical depth, and handle the "so what?" that a prospect has in their head.


STEPS

Step 1  Check In
  Prospect sees: Form on patient tab
  Tracker shows: Name entered
  Talking points: No app install, 130+ languages

Step 2  Approve
  Prospect sees: Waiting screen
  Tracker shows: Pending approval
  Talking points: Skip AI button, returning patient matching

Step 3  AI Screening
  Prospect sees: AI conversation
  Tracker shows: Message count live
  Talking points: Follow up intelligence, urgency detection, voice input, custom AI per specialty

Step 4  Diagnose
  Prospect sees: Doctor FocusMode
  Tracker shows: Claimed by doctor
  Talking points: Patient verified summary, doctor only diagnostic, vitals/vaccines, care instructions, follow up AI, focus mode auto claim

Step 5  Review
  Prospect sees: Review submission
  Tracker shows: Visit completed
  Talking points: Permanent summary link, review filtering funnel

Step 6  Outreach
  Prospect sees: Marketing campaign
  Tracker shows: Review submitted
  Talking points: AI patient search, credit costs


IF THEY ASK

"We have an EMR already."
  This sits in front of your EMR. The patient conversation happens before the doctor opens the chart.

"HIPAA?"
  Encrypted at rest and in transit. Row level security. Full audit trail. BAA available.

"What if the AI is wrong?"
  It collects information. It does not diagnose. The patient approves the summary before it reaches the doctor.

"Can we customize the AI?"
  Per location. Add instructions like "always ask about family history." Set the conversation length from 10 to 50 messages.

"How long to set up?"
  Sign up, create a location, print the QR code. First patient can check in within 10 minutes.

Developer asks about architecture:
  Private/public SQL wrapper pattern. JWT scoped RLS. Realtime via Postgres LISTEN/NOTIFY. TypeScript end to end. All serverless edge functions.
