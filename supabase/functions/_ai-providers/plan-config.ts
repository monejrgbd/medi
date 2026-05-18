// Keep in sync with src/lib/ai-plans.ts
// Duplicated because Deno edge functions cannot import from Next.js app code.

import type { AiTier } from "./types.ts";

export interface PlanAiConfig {
  included: AiTier[];
  creditBased: AiTier[];
  defaultTier: AiTier;
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

/** Plan -> AI scribe cleanup tier. Scribe is FREE on every plan; this only
 *  selects the cleanup model quality. Standard for free/PAYG/trials; Starter
 *  buys Advanced; Professional/Business/Enterprise buy Precision. Unknown or
 *  special states (expired/suspended/read_only/cancelled) fall back to standard
 *  via the caller's `?? "standard"`. */
export const PLAN_SCRIBE_TIER: Record<string, "standard" | "advanced" | "precision"> = {
  starter: "advanced",
  professional: "precision",
  business: "precision",
  enterprise: "precision",
  pay_as_you_go: "standard",
  standard_trial: "standard",
  premium_trial: "standard",
};
