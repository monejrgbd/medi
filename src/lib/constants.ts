// Per-provider pricing with AI model differentiation
export const PLAN_CONFIG = {
  starter:      { ai: "haiku" as const,  price: 79,  annual: 63,  credits: 20,  label: "Starter" },
  professional: { ai: "sonnet" as const, price: 149, annual: 119, credits: 100, label: "Professional" },
  business:     { ai: "sonnet" as const, price: 249, annual: 199, credits: 300, label: "Business" },
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

export const MARKETING_SMS_CREDIT_COST = 0.1;

export const MARKETING_SCAN_EXAMPLES = [
  "Patients with diabetes or high blood sugar",
  "Women over 50 who have not visited in 6 months",
  "Patients taking blood pressure medication",
  "Anyone with chronic back pain or joint issues",
];
