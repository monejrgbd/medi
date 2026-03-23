export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

const PLAN_LABELS: Record<string, string> = {
  standard_trial: "Standard Trial",
  premium_trial: "Premium Trial",
  starter: "Starter",
  professional: "Professional",
  business: "Business",
  enterprise: "Enterprise",
  pay_as_you_go: "Pay As You Go",
  expired: "Expired",
  read_only: "Read Only",
  suspended: "Suspended",
};

export function getPlanLabel(plan: string): string {
  return PLAN_LABELS[plan] || plan;
}

export function getTrialDaysLeft(trialEndDate: string | null): number | null {
  if (!trialEndDate) return null;
  const end = new Date(trialEndDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}
