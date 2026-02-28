# Outreach Templates

**Website:** getmedi.ca (link in every message)
**Contact:** hello@getmedi.ca
**Free trial:** 200 credits, no card required

---

## LinkedIn Messages

### For clinic owners with confirmed LinkedIn (Dr. Jain, Dr. Bertolo, Dr. Ahmed)

```
Hi Dr. [Name],

I run Medi (getmedi.ca) — a tablet-based intake system used by walk-in clinics. Patients describe their symptoms to an AI while they wait, and the doctor gets a full summary before the visit starts.

We're expanding into Niagara and offering [Clinic Name] a free trial — 200 credits, no card required.

Worth a quick look?
```

**Why this works:** Established product expanding into their region. They're not a test case — they're a new customer being offered a trial. Short enough for LinkedIn.

---

## Emails

### Template A: For clinics with wait complaints (Court Street 2.3, MedCare 2.5, Grantham 2.7)

**Subject:** Patient intake at [Clinic Name]

```
Hi [Name],

I run Medi — we make a tablet-based intake system for walk-in clinics.

When a patient walks in, they describe their symptoms to an AI on the tablet. It asks follow-ups, narrows things down, and gives the doctor a summary before the visit starts. The doctor skips "what brings you in today?" and gets straight to examining.

We're expanding into Niagara and offering your clinic a free trial — 200 credits, no card, no commitment.

Here's a 30-second look at how it works: getmedi.ca

Would it be worth 10 minutes to walk through it? I can stop by [Clinic Name] or do a quick Zoom — whatever's easier.

[Your name]
hello@getmedi.ca
[Phone]

P.S. — We built this because we kept hearing from clinic staff that the first 5 minutes of every visit are the same conversation. If that's not true at [Clinic Name], ignore this entirely.
```

**Why this works:**
- Names the product (Medi) — they can Google it
- Links to the site — credibility
- Specific CTA: "stop by or Zoom"
- P.S. line gets read even if the body doesn't
- Gives them permission to ignore it (reduces pressure, increases response)

### Template B: For MedCare chain (to Jessica Gallant-Lemke, Ops Manager)

**Subject:** Patient throughput across MedCare locations

```
Hi Jessica,

I run Medi (getmedi.ca) — a tablet-based intake system for walk-in clinics.

Patients describe symptoms to an AI on the tablet when they arrive. It asks follow-ups and builds a summary for the doctor before the visit starts. Doctors skip the initial Q&A and go straight to examining.

Given MedCare's volume across Niagara, I think this could move the needle on throughput. We're offering a free trial — 200 credits, no card required.

Would you be the right person to discuss this, or could you point me to who handles clinic operations?

[Your name]
hello@getmedi.ca
[Phone]
```

**Why this works:** Acknowledges she may not be the decision maker. Asks for a referral if not. Frames it around "throughput" which is what ops managers care about.

### Template C: For Dr. Munkley (Morrison Walk-In) — respect the legacy

**Subject:** Intake system for Morrison Walk-In

```
Hi Dr. Munkley,

I know Morrison Walk-In has been serving Niagara Falls since 1988 — that's impressive longevity.

I run Medi (getmedi.ca). We built a tablet where patients describe their symptoms to an AI while they wait, and the doctor gets a full summary before the visit. The goal is to let doctors spend more time diagnosing and less time on initial questions.

We're offering Niagara clinics a free trial — 200 credits, no card, no strings.

Would it be worth a quick look? Happy to stop by Morrison St or do a 10-minute Zoom.

[Your name]
hello@getmedi.ca
[Phone]
```

### Template D: For Dr. Jayawardene (PromptDoc) — ER background angle

**Subject:** Pre-screening for PromptDoc patients

```
Dr. Jayawardene,

With your ER background, you know better than most how much time gets spent on initial symptom gathering before the real work begins.

I built Medi (getmedi.ca) — patients describe symptoms to an AI on a tablet while they wait. It asks follow-ups and gives you a summary before the visit starts. Think of it as triage that happens in the waiting room.

We're offering PromptDoc a free trial — 200 credits, no card.

Worth 10 minutes? I can drop by PromptDoc or jump on Zoom.

[Your name]
hello@getmedi.ca
[Phone]
```

**Why this works:** Speaks his language — "triage in the waiting room." References his ER background. Short.

---

## Follow-Up (send 4 business days after no response)

**Subject:** Re: [original subject]

```
Hi [Name],

Following up — wanted to share that we just launched our pricing page if you're curious about what this looks like longer term: getmedi.ca/pricing

The free trial (200 credits) is still the best way to see if it fits. Happy to stop by [Clinic Name] for a quick walkthrough whenever works.

[Your name]
[Phone]
```

**Why this works:** Adds new information (pricing page). Doesn't repeat the pitch. Specific offer to come in person.

---

## In-Person Script (for Real Health + Grantham Medical)

Walk in during a quiet period (avoid Monday mornings and lunch hour). Ask for the clinic manager or owner by name if you have it.

```
"Hi — I'm [name] from Medi. We make a patient intake system for walk-in clinics.
I was wondering if [Dr. Reka / the clinic manager] has 5 minutes?
I'd love to show them something quick on my phone — it's a tablet system
where patients describe symptoms to an AI while they wait, and the doctor gets a
summary before the visit. We're expanding into Niagara and offering clinics a free trial."
```

If they say the owner isn't available:
```
"No worries at all. Could I leave my card? Or if you could share
the best email to reach them, I'll send over a quick note.
Our website is getmedi.ca if they want to take a look."
```

**Bring:** Business cards with getmedi.ca on them. Have the website open on your phone ready to show.

---

## Sending Order

| Day | Action |
|-----|--------|
| Day 1 | Send LinkedIn messages to Dr. Jain, Dr. Bertolo, Dr. Ahmed |
| Day 2 | Send emails to MedCare, Court Street, PromptDoc, Morrison |
| Day 5 | Visit Real Health (Welland) and Grantham Medical (St. Catharines) in person |
| Day 6 | Send follow-ups to any LinkedIn/email non-responders |
| Day 10 | Second follow-up or escalate to next outreach step |

---

## Rules

- **Personalize every message.** Their clinic name, their background, their city. Generic = deleted.
- **Always link to getmedi.ca.** Let the site do the heavy lifting on credibility.
- **One follow-up max.** If they don't respond twice, move to the next step (email -> in person).
- **Update the database.** After every touchpoint, update `outreach_step` and `status` in `clinic_prospects`.
- **Track in notes.** Date sent, response received, next action.
