# Privacy & Compliance Checklist

What needs to happen before Hilthealth processes patient health information.

The landing page is compliant today. This checklist is for when we build the actual product.

---

## Before Sending Emails to Prospects

- [ ] Set up `privacy@hilthealth.com` — the privacy policy lists this as the Privacy Officer contact
- [ ] Use a transactional email provider (Resend, Mailgun, etc.) that automatically includes unsubscribe links
- [ ] Every commercial email must include: Hilthealth's name, mailing address, contact info, and a working unsubscribe link (CASL s.6(2))
- [ ] Process unsubscribe requests within 10 business days (CASL s.11)

---

## Before Processing Patient Health Data (PHI)

### Contracts

- [ ] **Sign Anthropic's DPA** — standard API terms say they don't train on your data, but a DPA formally binds them to PHIPA obligations (breach notification to Canadian regulators, data handling restrictions, audit rights)
- [ ] **Sign Supabase's DPA** — available through their dashboard or sales team. Covers data storage obligations under PHIPA
- [ ] **Create a clinic-facing Data Processing Agreement template** — PHIPA s.17(3) requires a written agreement with each clinic if Hilthealth acts as their agent. Must cover:
  - What PHI Hilthealth can access and why
  - Restrictions on use and disclosure
  - Required safeguards
  - Audit and compliance monitoring rights
  - Return or destruction of records on termination

### Patient Consent Flow (build into the product)

- [ ] Before the AI conversation starts, the patient must see a consent screen explaining:
  - An AI system will ask questions about their symptoms
  - Their conversation will be shared with the treating physician
  - Their data is processed by a third-party AI service on servers that may be in the US
  - They can decline without affecting their care
- [ ] Consent must be **express** (active click/tap), not implied (PHIPA s.18)
- [ ] Record the consent (timestamp, what was consented to) for audit purposes
- [ ] If patient is under 16, consent must come from parent/guardian (PHIPA s.20, Health Care Consent Act)

### Data Residency

- [ ] Confirm where the Supabase project stores data (check the hosting region in Supabase dashboard)
- [ ] If data is stored outside Canada, update the privacy policy's third-party table with the specific location
- [ ] Consider migrating to `ca-central-1` (AWS Canada) if not already there
- [ ] Anthropic API processes in the US — this is disclosed in the privacy policy and the patient consent screen must mention it

### Security & Audit

- [ ] **Audit logging** — log every access to PHI (who accessed what, when). PHIPA O. Reg. 329/04 s.10 requires this
- [ ] **Role-based access** — clinic staff only see their own patients' data
- [ ] **Encryption** — TLS in transit, AES-256 at rest (Supabase handles this by default)
- [ ] **Authentication** — secure auth for clinic dashboard (Supabase Auth or similar). Use MFA for accounts that access PHI
- [ ] Do NOT use PHI for analytics, marketing, AI training, or any purpose beyond the clinical pre-screening service

### Breach Response Plan (internal document)

- [ ] Write an internal playbook covering:
  - Who is the incident lead (Privacy Officer)
  - How to assess "real risk of significant harm" (RROSH)
  - If RROSH exists: report to OPC (PIPEDA s.10.1) and IPC (PHIPA, O. Reg. 329/04)
  - Notify affected individuals as soon as feasible
  - Notify the clinic (HIC) immediately
  - What to include in notifications: description of breach, what data was involved, steps taken, steps individuals can take
  - Maintain breach records for minimum 24 months (PIPEDA s.10.3)
- [ ] Create template notification letters (to OPC, IPC, individuals, clinics)

### Privacy Impact Assessment (PIA)

- [ ] Conduct a PIA before launching the patient-facing product. Covers:
  - What PHI is collected and why
  - Data flow mapping (patient → tablet → AI API → Supabase → clinic dashboard)
  - Risk assessment for each data flow
  - Mitigation measures
  - Third-party risk (Anthropic, Supabase)
- [ ] Not legally mandatory but strongly recommended by OPC and IPC. If you're ever investigated, having a PIA shows good faith.

### Data Retention Implementation

- [ ] Build automated retention enforcement:
  - Patient PHI: minimum 1 year, up to 10 years as directed by clinic (PHIPA s.13)
  - Clinic accounts: duration of account + 2 years
  - Prospect data: 2 years from last contact
  - Audit logs: 2 years
  - Breach records: minimum 24 months
- [ ] Secure deletion — when retention expires, actually delete from the database, not just soft-delete
- [ ] Handle backup data — retention applies to backups too

### Patient Rights Implementation

- [ ] **Access requests** — patients can request their data. Respond within 30 days (PHIPA s.54(7))
- [ ] **Correction requests** — patients can request corrections to inaccurate PHI
- [ ] **Deletion requests** — patients can request deletion (subject to minimum retention periods)
- [ ] **Lock-box** (PHIPA s.23) — patients can restrict access to their PHI by certain custodians. Build a mechanism to honor this, or route requests to the clinic
- [ ] Build an admin tool or process for handling these requests

---

## Legal Review

- [ ] **Have a PHIPA lawyer review before launch** (~$500-1000, 1-2 hours). Key questions:
  - Is Hilthealth an "agent" or "electronic service provider" under PHIPA? This affects downstream obligations.
  - Is the clinic-facing DPA template sufficient?
  - Is the patient consent flow sufficient?
  - Any gaps in the privacy policy?

---

## Ongoing (After Launch)

- [ ] Monitor **Bill C-27 / AIDA** (Artificial Intelligence and Data Act) — not yet in force but would classify health AI as "high-impact" and require risk assessments, bias mitigation, and transparency
- [ ] Review and update the privacy policy annually, or when practices change
- [ ] Review security measures regularly
- [ ] Train any staff who access PHI on privacy obligations
- [ ] Keep DPAs current — re-sign if Anthropic or Supabase update their terms

---

## Reference

| Regulator | Jurisdiction | Contact |
|-----------|-------------|---------|
| Office of the Privacy Commissioner of Canada (OPC) | PIPEDA (federal) | priv.gc.ca |
| Information and Privacy Commissioner of Ontario (IPC) | PHIPA (Ontario) | ipc.on.ca |

| Law | What It Covers |
|-----|---------------|
| PIPEDA | Commercial collection/use of personal information |
| PHIPA | Personal health information in Ontario |
| CASL | Commercial electronic messages (email marketing) |
| Health Care Consent Act, 1996 | Capacity to consent to health-related decisions (minors) |
| AIDA (proposed) | AI systems — risk assessment, transparency, bias |
