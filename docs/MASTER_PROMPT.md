# Master Prompt - Clinic Prospecting

Paste this when starting a new conversation to continue where we left off.

---

## Project Context

We're building an AI-powered pre-screening system for clinics. Patients use a tablet in the waiting room to describe symptoms to an AI. The AI narrows down likely conditions and sends a pre-filled summary to the doctor before the visit. This reduces congestion and saves doctor time.

**Target market:** Walk-in and urgent care clinics in Canada, starting with the Niagara region (Ontario).

**Business model:** 30-day free trial (we provide a tablet), then $0.50-$2.00 per patient screened depending on plan tier. Contact clinic 7 days before trial ends.

## Current State

- Plan doc at `docs/PLAN.md`
- Supabase project is set up (check `.mcp.json` for config, project ref `sdzeoeturtpkqlagobwj`)
- No product code built yet - we're in the prospecting/outreach phase
- **36 clinics** researched and inserted into `clinic_prospects` table
- **12 high-priority** clinics identified with owner/contact data, LinkedIn profiles, and business emails
- RLS enabled on the table (service role only)

## Database Schema: `clinic_prospects`

Table already exists. Current schema:

```sql
CREATE TABLE public.clinic_prospects (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_name text NOT NULL,
  type text CHECK (type IN ('walk_in', 'family', 'urgent_care', 'multi_specialty')),
  address text,
  city text,
  province text DEFAULT 'ON',
  phone text,
  website text,
  contact_name text,
  email text,
  num_doctors smallint,
  google_review_count int,
  google_rating numeric(2,1),
  wait_complaints boolean DEFAULT false,
  working_hours text,
  status text DEFAULT 'not_contacted' CHECK (status IN ('not_contacted', 'contacted', 'interested', 'trial', 'converted', 'lost')),
  follow_up_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  priority text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low', 'skip')),
  linkedin_url text,
  business_email text,
  outreach_step text DEFAULT 'step_1_linkedin' CHECK (outreach_step IN ('step_1_linkedin', 'step_2_email', 'step_3_in_person', 'responded', 'meeting_booked'))
);
```

## Outreach Strategy (3 steps)

1. **Step 1: LinkedIn** - Message the owner directly if we have their profile
2. **Step 2: Email** - Contact the business email requesting to speak with the owner/manager
3. **Step 3: In Person** - Visit the clinic and ask for the owner/manager

## High-Priority Clinics (12 clinics, 9 conversations)

### Step 1: LinkedIn (4 clinics)

| ID | Clinic | Owner | LinkedIn |
|----|--------|-------|----------|
| 1 | Real Health, Welland | Dr. Altin Reka (CPSO #85196) | https://www.linkedin.com/in/altin-reka-4485b3151 |
| 13 | Glenridge Walk-In Clinic, St. Catharines | Dr. Monica Bertolo | https://ca.linkedin.com/in/monica-bertolo-9bb884271 |
| 18 | Ontario Street Medical Centre, St. Catharines | Dr. Salim Ahmed (CPSO #102753) | https://www.linkedin.com/in/salim-ahmed-18018055/ |
| 24 | Niagara Region Medical, Niagara Falls | Dr. Vipul Jain (CPSO #97236) | https://www.linkedin.com/in/vipul-jain-80a747105/ |

### Step 2: Email (7 clinics, 4 emails)

| ID | Clinic | Contact | Email |
|----|--------|---------|-------|
| 10,11,3,21 | MedCare (4 locations: Scott St, Pen Centre, South Pelham, Niagara Square) | Jessica Gallant-Lemke (Ops Mgr) | doctor@medcareclinics.com |
| 12 | Court Street Medical, St. Catharines | Brett Rintoul / Dr. Joseph Bassey | Info@courtstreetmedicalcentre.ca |
| 14 | PromptDoc Urgent Care, St. Catharines | Dr. Nishan Jayawardene (Principal) | promptdocurgentcare@hotmail.com |
| 22 | Morrison Walk-In + Walmart location, Niagara Falls | Dr. Douglas Munkley (Founder) | info@twogreatwalkinclinics.ca |

### Step 3: In Person (1 clinic - no LinkedIn, no email)

| ID | Clinic | Owner | Phone | Address |
|----|--------|-------|-------|---------|
| 15 | Grantham Medical, St. Catharines | Unknown - ask for manager | 905-937-0000 | 400 Scott Street, St. Catharines |

## Chain/Group Notes

- **MedCare Clinics** = 4 locations, 1 conversation. Franchise model, ownership deliberately private. HQ: 387 Scott St A2C, St. Catharines. Also try franchise@medcareclinics.com
- **Two Great Walk-In Clinics** = Morrison + Walmart Niagara Falls. Same ownership (Dr. Munkley founded). 1 conversation.
- **Primary Care Niagara** = Welland + Fort Erie locations. Same org.
- **Niagara Health** = Fort Erie + Port Colborne urgent care. Hospital system - skip for now.

## Data Coverage

| City | Clinics | High Priority |
|------|---------|---------------|
| St. Catharines | 11 | 7 |
| Welland | 5 | 2 |
| Niagara Falls | 4 | 3 |
| Fort Erie | 4 | 0 |
| Thorold | 2 | 0 |
| Port Colborne | 3 | 0 |
| Grimsby | 1 | 0 |
| Lincoln | 1 | 0 |
| Pelham | 3 | 0 |
| Niagara-on-the-Lake | 2 | 0 |

**Not yet searched:** Wainfleet, West Lincoln, Smithville, Chippawa, Crystal Beach, Ridgeway. Also pharmacy walk-in clinics (Shoppers Drug Mart, Rexall) not captured.

## What's Next

- [ ] Draft LinkedIn message template and email template for outreach
- [ ] Begin outreach in order: LinkedIn -> Email -> In Person
- [ ] Start building the product (tablet app, AI engine, doctor dashboard)
- [ ] Expand research to other Canadian regions if Niagara goes well

## Rules

- Follow instructions in `CLAUDE.md` and `.claude/CLAUDE.md`
- Use Supabase MCP for all database operations
- Don't insert duplicates - check by clinic name + city before inserting
- If Supabase MCP auth fails, tell me to update the access token in `.mcp.json`
- Update `outreach_step` and `status` as outreach progresses
