"use client";

import { useState } from "react";
import { toggleAddon } from "@/app/(dashboard)/d/_actions/billing";
import { toast } from "sonner";

interface AddOnTogglesProps {
  reviewSmsAddon: boolean;
  followupSmsAddon: boolean;
  locationCount: number;
  subscriptionPlan: string;
  onChanged: () => void;
}

export default function AddOnToggles({
  reviewSmsAddon,
  followupSmsAddon,
  locationCount,
  subscriptionPlan,
  onChanged,
}: AddOnTogglesProps) {
  const isTrial = subscriptionPlan.endsWith("_trial");
  const [reviewSms, setReviewSms] = useState(reviewSmsAddon);
  const [followupSms, setFollowupSms] = useState(followupSmsAddon);
  const [toggling, setToggling] = useState<string | null>(null);

  async function handleToggle(addon: string, enabled: boolean) {
    setToggling(addon);
    const result = await toggleAddon(addon, enabled);
    setToggling(null);

    if (result?.success) {
      if (addon === "review_sms") setReviewSms(enabled);
      if (addon === "followup_sms") setFollowupSms(enabled);
      toast.success(`${addon === "review_sms" ? "Review SMS" : "Follow-up SMS"} ${enabled ? "enabled" : "disabled"}`);
      onChanged();
    } else {
      toast.error(result?.error || "Failed to update addon");
    }
  }

  const addons = [
    {
      key: "review_sms",
      label: "Review SMS",
      description:
        "Automatically send review request texts to patients after their visit.",
      enabled: reviewSms,
      price: 49,
    },
    {
      key: "followup_sms",
      label: "Follow-up SMS Reminders",
      description:
        "Send automated follow-up appointment reminders to patients.",
      enabled: followupSms,
      price: 49,
    },
  ];

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6">
      <h2 className="text-lg font-semibold text-ink mb-4">Add-Ons</h2>

      <div className="space-y-4">
        {addons.map((addon) => (
          <div
            key={addon.key}
            className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
          >
            <div>
              <h3 className="font-medium text-ink">{addon.label}</h3>
              <p className="text-xs text-slate mt-0.5">
                {addon.description}
              </p>
              <p className="text-xs text-slate mt-1">
                {isTrial ? (
                  <span className="text-green-600 font-medium">Free during trial</span>
                ) : (
                  <>
                    ${addon.price}/mo x {locationCount} location
                    {locationCount !== 1 ? "s" : ""} = $
                    {addon.price * locationCount}/mo
                  </>
                )}
              </p>
            </div>
            <button
              onClick={() => handleToggle(addon.key, !addon.enabled)}
              disabled={toggling === addon.key}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                addon.enabled ? "bg-hilt-blue" : "bg-gray-200"
              } disabled:opacity-50`}
              role="switch"
              aria-checked={addon.enabled}
              aria-label={`Toggle ${addon.label}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  addon.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
