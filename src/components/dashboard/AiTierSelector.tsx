"use client";

import Link from "next/link";
import {
  ALL_TIERS,
  PLAN_AI,
  PLAN_DISPLAY_NAME,
  TIER_DESC,
  TIER_INCLUDED_IN,
  TIER_LABEL,
  type AiTier,
} from "@/lib/ai-plans";

interface AiTierSelectorProps {
  value: string;
  onChange: (value: string) => void;
  plan: string;
}

const TIER_ACCENT: Record<AiTier, string> = {
  standard: "text-slate font-semibold",
  advanced: "text-hilt-blue font-bold",
  precision: "font-extrabold bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent",
  premium: "font-extrabold bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent",
};

const TIER_RANK: Record<AiTier, number> = {
  standard: 0,
  advanced: 1,
  precision: 2,
  premium: 3,
};

function tierRank(tier: AiTier): number {
  return TIER_RANK[tier];
}

export default function AiTierSelector({ value, onChange, plan }: AiTierSelectorProps) {
  const config = PLAN_AI[plan] ?? PLAN_AI.starter;
  const defaultTier = config.defaultTier;
  const defaultRank = tierRank(defaultTier);

  // Show: the plan's default tier + everything higher (includes or credit-based or locked upgrade).
  // Hide lower tiers (don't clutter the UI with tiers the owner has moved past).
  const visible = ALL_TIERS.filter((tier) => tierRank(tier) >= defaultRank);

  // Resolve the selected tier. If DB value isn't in the visible set, fall back to default.
  const selectedTier: AiTier = (["standard", "advanced", "precision", "premium"] as AiTier[]).includes(value as AiTier)
    ? (value as AiTier)
    : defaultTier;
  const effectiveSelected: AiTier = visible.includes(selectedTier) ? selectedTier : defaultTier;

  return (
    <div className="space-y-2">
      {visible.map((tier) => {
        const isIncluded = config.included.includes(tier);
        const isCreditBased = config.creditBased.includes(tier);
        const isLocked = !isIncluded && !isCreditBased;
        const isSelected = effectiveSelected === tier;
        const upgradePlanKey = TIER_INCLUDED_IN[tier];

        if (isLocked) {
          return (
            <Link
              key={tier}
              href="/d/owner/billing"
              className="block rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 transition-colors hover:bg-gray-100"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 shrink-0 text-ash" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                    <span className={`text-sm ${TIER_ACCENT[tier]}`}>{TIER_LABEL[tier]}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-ash truncate">{TIER_DESC[tier]}</p>
                </div>
                <span className="shrink-0 rounded-full bg-hilt-blue/10 px-2 py-0.5 text-[10px] font-semibold text-hilt-blue">
                  {PLAN_DISPLAY_NAME[upgradePlanKey] ?? "Upgrade"}
                </span>
              </div>
            </Link>
          );
        }

        return (
          <button
            key={tier}
            type="button"
            onClick={() => onChange(tier)}
            className={`block w-full rounded-lg border px-3 py-2.5 text-left transition-all ${
              isSelected
                ? "border-hilt-blue bg-blue-50 ring-1 ring-hilt-blue"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {isSelected && (
                    <svg className="h-3.5 w-3.5 shrink-0 text-hilt-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                  <span className={`text-sm ${TIER_ACCENT[tier]}`}>{TIER_LABEL[tier]}</span>
                  {isIncluded && tier === defaultTier && (
                    <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-green-700">
                      Included
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate truncate">{TIER_DESC[tier]}</p>
              </div>
              {isCreditBased && !isIncluded && (
                <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                  Credit based
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
