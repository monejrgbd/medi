"use client";

import Link from "next/link";

interface AiTierSelectorProps {
  value: string;
  onChange: (value: string) => void;
  plan: string;
}

type TierId = "standard" | "advanced" | "precision" | "premium";

interface Tier {
  id: TierId;
  label: string;
  desc: string;
  dbValue: string;
  includedIn: string;
  accent: string;
}

const TIERS: Tier[] = [
  {
    id: "standard",
    label: "Standard AI",
    desc: "Fast intake for routine visits",
    dbValue: "standard",
    includedIn: "starter",
    accent: "text-slate",
  },
  {
    id: "advanced",
    label: "Advanced AI",
    desc: "Deeper reasoning and thorough follow ups",
    dbValue: "standard",
    includedIn: "professional",
    accent: "text-hilt-blue",
  },
  {
    id: "precision",
    label: "Precision AI",
    desc: "Superior clinical depth for Business clinics",
    dbValue: "precision",
    includedIn: "business",
    accent: "bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent",
  },
  {
    id: "premium",
    label: "Premium AI",
    desc: "Deepest reasoning, 4 credits per conversation",
    dbValue: "advanced",
    includedIn: "",
    accent: "bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent",
  },
];

const PLAN_TIER_ORDER: Record<string, number> = {
  starter: 0,
  standard_trial: 1,
  pay_as_you_go: 1,
  professional: 1,
  premium_trial: 2,
  business: 2,
  enterprise: 2,
};

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  professional: "Professional",
  business: "Business",
};

function planTier(plan: string): number {
  return PLAN_TIER_ORDER[plan] ?? 1;
}

function includedTierId(plan: string): TierId {
  if (plan === "starter") return "standard";
  if (plan === "business" || plan === "enterprise" || plan === "premium_trial") return "precision";
  return "advanced";
}

export default function AiTierSelector({ value, onChange, plan }: AiTierSelectorProps) {
  const currentPlanRank = planTier(plan);
  const includedId = includedTierId(plan);

  // Determine which tier is currently "selected" based on DB value + plan
  const selectedId: TierId = (() => {
    if (value === "advanced") return "premium";
    if (value === "precision") return "precision";
    return includedId;
  })();

  // Build the visible list: included tier + higher tiers + premium
  const visible = TIERS.filter((tier) => {
    if (tier.id === "premium") return true;
    const tierRank = PLAN_TIER_ORDER[tier.includedIn] ?? 0;
    return tierRank >= currentPlanRank;
  });

  return (
    <div className="space-y-2">
      {visible.map((tier) => {
        const isSelected = selectedId === tier.id;
        const isPremium = tier.id === "premium";
        const tierRank = PLAN_TIER_ORDER[tier.includedIn] ?? 0;
        const isLocked = !isPremium && tierRank > currentPlanRank;
        const isSelectable = !isLocked;

        if (isLocked) {
          return (
            <Link
              key={tier.id}
              href="/d/owner/billing"
              className="block rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 transition-colors hover:bg-gray-100"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 shrink-0 text-ash" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                    <span className={`text-sm font-semibold ${tier.accent}`}>{tier.label}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-ash truncate">{tier.desc}</p>
                </div>
                <span className="shrink-0 rounded-full bg-hilt-blue/10 px-2 py-0.5 text-[10px] font-semibold text-hilt-blue">
                  {PLAN_LABELS[tier.includedIn] ?? "Upgrade"}
                </span>
              </div>
            </Link>
          );
        }

        return (
          <button
            key={tier.id}
            type="button"
            onClick={() => isSelectable && onChange(tier.dbValue)}
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
                  <span className={`text-sm font-semibold ${tier.accent}`}>{tier.label}</span>
                  {tier.id === includedId && (
                    <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-green-700">
                      Included
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate truncate">{tier.desc}</p>
              </div>
              {isPremium && (
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
