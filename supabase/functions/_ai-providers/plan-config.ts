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

/** Plan -> AI scribe model tier the subscription plan includes unlimited (no
 *  per-minute charge at that tier). Scribe is PAID; there is no universal free
 *  tier. Starter includes unlimited Standard; Professional includes unlimited
 *  Advanced; Business/Enterprise include unlimited Precision. PAYG/trials are
 *  not subscription plans: the caller meters them per minute (Standard 0.1,
 *  Advanced 0.2, Precision/Premium 0.5) and only uses this map's
 *  `?? "standard"` fallback for tier resolution. */
export const PLAN_SCRIBE_TIER: Record<string, "standard" | "advanced" | "precision"> = {
  starter: "standard",
  professional: "advanced",
  business: "precision",
  enterprise: "precision",
  pay_as_you_go: "standard",
  standard_trial: "standard",
  premium_trial: "standard",
};
