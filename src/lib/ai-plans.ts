// Shared plan + tier config for the dashboard UI.
// Keep in sync with supabase/functions/_ai-providers/plan-config.ts

export type AiTier = "standard" | "advanced" | "precision" | "premium";

export interface PlanAiConfig {
  included: AiTier[];       // Tiers free with the plan
  creditBased: AiTier[];    // Tiers usable but paid per conversation
  defaultTier: AiTier;      // What new locations start with
  messageLimit: { def: number; max: number };
}

export const PLAN_AI: Record<string, PlanAiConfig> = {
  starter: {
    included: ["standard"],
    creditBased: ["premium"],
    defaultTier: "standard",
    messageLimit: { def: 30, max: 30 },
  },
  professional: {
    included: ["standard", "advanced"],
    creditBased: ["premium"],
    defaultTier: "advanced",
    messageLimit: { def: 60, max: 60 },
  },
  business: {
    included: ["standard", "advanced", "precision"],
    creditBased: ["premium"],
    defaultTier: "precision",
    messageLimit: { def: 100, max: 100 },
  },
  enterprise: {
    included: ["standard", "advanced", "precision", "premium"],
    creditBased: [],
    defaultTier: "precision",
    messageLimit: { def: 100, max: 100 },
  },
  pay_as_you_go: {
    included: [],
    creditBased: ["standard", "advanced", "precision", "premium"],
    defaultTier: "advanced",
    messageLimit: { def: 30, max: 100 },
  },
  standard_trial: {
    included: [],
    creditBased: ["standard", "advanced", "precision", "premium"],
    defaultTier: "advanced",
    messageLimit: { def: 30, max: 30 },
  },
  premium_trial: {
    included: [],
    creditBased: ["standard", "advanced", "precision", "premium"],
    defaultTier: "precision",
    messageLimit: { def: 30, max: 100 },
  },
};

// Plan-dependent labels no longer needed since Precision is a real tier with its own slot.
// Labels are universal.
export const TIER_LABEL: Record<AiTier, string> = {
  standard: "Standard AI",
  advanced: "Advanced AI",
  precision: "Precision AI",
  premium: "Premium AI",
};

export const TIER_DESC: Record<AiTier, string> = {
  standard: "Fast intake for routine visits",
  advanced: "Deeper reasoning and thorough follow ups",
  precision: "Superior clinical depth for Business clinics",
  premium: "Deepest reasoning for complex cases",
};

export const ALL_TIERS: AiTier[] = ["standard", "advanced", "precision", "premium"];

/** Plan → "the plan that first includes this tier for free", for upgrade CTAs. */
export const TIER_INCLUDED_IN: Record<AiTier, string> = {
  standard: "starter",
  advanced: "professional",
  precision: "business",
  premium: "enterprise", // enterprise includes it free; other plans treat it as credit-based
};

export const PLAN_DISPLAY_NAME: Record<string, string> = {
  starter: "Starter",
  professional: "Professional",
  business: "Business",
  enterprise: "Enterprise",
};

export function isValidTier(v: string): v is AiTier {
  return v === "standard" || v === "advanced" || v === "precision" || v === "premium";
}
