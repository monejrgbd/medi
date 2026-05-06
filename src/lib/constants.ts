// Per-provider plan pricing. The AI tier for each plan lives in src/lib/ai-plans.ts (PLAN_AI).
export const PLAN_CONFIG = {
  starter:      { price: 79,  annual: 63,  credits: 20,  label: "Starter" },
  professional: { price: 149, annual: 119, credits: 100, label: "Professional" },
  business:     { price: 249, annual: 199, credits: 300, label: "Business" },
} as const;

export const PROVIDER_ROLES = ["doctor", "nurse"] as const;
export const ADMIN_ROLES = ["receptionist", "manager", "marketer", "reviews"] as const;

// Legacy aliases (used by existing components until migrated)
export const PLAN_CREDITS: Record<string, number> = {
  starter: PLAN_CONFIG.starter.credits,
  professional: PLAN_CONFIG.professional.credits,
  business: PLAN_CONFIG.business.credits,
  pay_as_you_go: 0,
};

export const PLAN_PRICING: Record<string, number> = {
  starter: PLAN_CONFIG.starter.price,
  professional: PLAN_CONFIG.professional.price,
  business: PLAN_CONFIG.business.price,
};

export const PLAN_ANNUAL_PRICING: Record<string, number> = {
  starter: Math.round(PLAN_CONFIG.starter.price * 12 * 0.8),
  professional: Math.round(PLAN_CONFIG.professional.price * 12 * 0.8),
  business: Math.round(PLAN_CONFIG.business.price * 12 * 0.8),
};

export const REVIEW_PLATFORMS = [
  "google",
  "yelp",
  "healthgrades",
  "zocdoc",
  "vitals",
  "ratemds",
  "facebook",
];

export const ALLOWED_SPECIALTIES = [
  "Cardiology",
  "Dentistry",
  "Dermatology",
  "Endocrinology",
  "ENT",
  "Family Medicine",
  "Gastroenterology",
  "General Practice",
  "General Surgery",
  "Hematology",
  "Infectious Disease",
  "Internal Medicine",
  "Nephrology",
  "Neurology",
  "Obstetrics/Gynecology",
  "Oncology",
  "Ophthalmology",
  "Optometry",
  "Orthopedics",
  "Pain Management",
  "Pediatrics",
  "Physical Therapy",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Rheumatology",
  "Urgent Care",
  "Urology",
  "Walk-in Clinic",
  "Other",
];

export const INJECTION_SITES = [
  'left_deltoid', 'right_deltoid', 'left_thigh', 'right_thigh',
  'left_gluteal', 'right_gluteal', 'subcutaneous', 'intranasal', 'oral',
] as const;

export const QUEUE_TYPES = [
  { value: "fifo", label: "FIFO", description: "Strict arrival order. Every patient waits their turn.", requiresRaven: false },
  { value: "priority", label: "Priority", description: "AI detects urgency and moves critical patients ahead.", requiresRaven: false },
  { value: "appointment_priority", label: "Appointment then Priority", description: "Scheduled patients first, then priority for walk ins.", requiresRaven: true },
  { value: "appointment_fifo", label: "Appointment then FIFO", description: "Scheduled patients first, then arrival order for walk ins.", requiresRaven: true },
  { value: "critical_appointment_fifo", label: "Critical, Appointment, then FIFO", description: "AI flagged critical patients first, then appointments, then arrival order.", requiresRaven: true },
] as const;

export const DISCOVERY_SOURCE_OPTIONS = [
  "Google Search",
  "Social Media",
  "Friend or Family",
  "Doctor Referral",
  "Insurance Directory",
  "Walk in",
  "Other",
] as const;

export const MARKETING_SMS_CREDIT_COST = 0.1;

export const MARKETING_SCAN_EXAMPLES = [
  "Patients with diabetes or high blood sugar",
  "Women over 50 who have not visited in 6 months",
  "Patients taking blood pressure medication",
  "Anyone with chronic back pain or joint issues",
];

// Affiliate program
export const PARTNER_COMMISSION_RATE = 0.30;
export const PARTNER_MIN_PAYOUT_CENTS = 5000;          // $50
export const PARTNER_HOLD_DAYS_STANDARD = 30;
export const PARTNER_HOLD_DAYS_FIRST = 60;
export const PARTNER_HOLD_DAYS_DISPUTE = 90;
export const PARTNER_AFFILIATE_CODE_GRACE_HOURS = 1;
export const PARTNER_DAILY_TRIAL_CODE_LIMIT = 20;
export const PARTNER_VELOCITY_AUTO_SUSPEND = 5;        // signups per 24h
export const PARTNER_TAX_FORM_THRESHOLD_CENTS = 60000; // $600 (US 1099)
export const PARTNER_TAX_FORM_BANNER_CENTS = 40000;    // $400
export const PARTNER_TOS_VERSION = "v1-2026-05-05";
export const REF_COOKIE_NAME = "hh_ref";
export const REF_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days (UX prefill only)

export const DOCUMENT_TEMPLATES = [
  { key: "letter_sick_note", label: "Sick note", icon: "file-text", category: "letter" },
  { key: "letter_return_to_work", label: "Return to work", icon: "check-circle", category: "letter" },
  { key: "letter_school_absence", label: "School absence", icon: "graduation-cap", category: "letter" },
  { key: "letter_work_accommodation", label: "Work accommodation", icon: "shield", category: "letter" },
  { key: "letter_light_duty", label: "Light duty", icon: "activity", category: "letter" },
  { key: "letter_travel_medical", label: "Travel medical letter", icon: "plane", category: "letter" },
  { key: "letter_disability_short", label: "Disability note", icon: "clipboard", category: "letter" },
  { key: "letter_custom", label: "Custom letter", icon: "edit", category: "letter" },
  { key: "clinical_note_soap", label: "SOAP note", icon: "stethoscope", category: "clinical_note" },
] as const;
