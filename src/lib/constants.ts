export const PLAN_CREDITS: Record<string, number> = {
  starter: 125,
  professional: 600,
  business: 1800,
  pay_as_you_go: 0,
};

export const PLAN_PRICING: Record<string, number> = {
  starter: 99,
  professional: 349,
  business: 899,
};

export const PLAN_ANNUAL_PRICING: Record<string, number> = {
  starter: Math.round(99 * 12 * 0.8),     // $950/yr ($79.17/mo)
  professional: Math.round(349 * 12 * 0.8), // $3,350/yr ($279.17/mo)
  business: Math.round(899 * 12 * 0.8),     // $8,630/yr ($719.17/mo)
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

export const MARKETING_SMS_CREDIT_COST = 0.3;

export const MARKETING_SCAN_EXAMPLES = [
  "Patients with diabetes or high blood sugar",
  "Women over 50 who have not visited in 6 months",
  "Patients taking blood pressure medication",
  "Anyone with chronic back pain or joint issues",
];
