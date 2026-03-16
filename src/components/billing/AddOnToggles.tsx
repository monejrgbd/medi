"use client";

import { useState } from "react";
import { toggleLocationAddon } from "@/app/(dashboard)/d/_actions/billing";
import { toast } from "sonner";

interface Location {
  id: string;
  name: string;
  review_sms_enabled: boolean;
  followup_sms_enabled: boolean;
}

interface AddOnTogglesProps {
  locations: Location[];
  subscriptionPlan: string;
  onChanged: () => void;
}

export default function AddOnToggles({
  locations: initialLocations,
  subscriptionPlan,
  onChanged,
}: AddOnTogglesProps) {
  const [locations, setLocations] = useState(initialLocations);
  const [toggling, setToggling] = useState<string | null>(null);

  const isDisabled = ["expired", "suspended", "read_only"].includes(
    subscriptionPlan
  );

  async function handleToggle(
    locationId: string,
    addon: "review_sms" | "followup_sms",
    enabled: boolean
  ) {
    const key = `${locationId}-${addon}`;
    setToggling(key);
    const result = await toggleLocationAddon(locationId, addon, enabled);
    setToggling(null);

    if (result?.success) {
      setLocations((prev) =>
        prev.map((l) =>
          l.id === locationId
            ? {
                ...l,
                [addon === "review_sms"
                  ? "review_sms_enabled"
                  : "followup_sms_enabled"]: enabled,
              }
            : l
        )
      );
      const label = addon === "review_sms" ? "Review SMS" : "Follow-up SMS";
      toast.success(`${label} ${enabled ? "enabled" : "disabled"}`);
      onChanged();
    } else {
      toast.error(result?.error || "Failed to update");
    }
  }

  const addons = [
    {
      key: "review_sms" as const,
      label: "Review SMS",
      description: "Send review request texts after visits",
      field: "review_sms_enabled" as const,
    },
    {
      key: "followup_sms" as const,
      label: "Follow-up SMS",
      description: "Send follow-up appointment reminders",
      field: "followup_sms_enabled" as const,
    },
  ];

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ink">SMS Features</h2>
        <span className="text-xs text-slate bg-gray-50 px-2 py-1 rounded-full">
          0.1 credits per SMS
        </span>
      </div>

      {isDisabled && (
        <p className="text-xs text-red-500 mb-4">
          SMS features are unavailable while your plan is {subscriptionPlan}.
        </p>
      )}

      <div className="space-y-3">
        {locations.map((location) => (
          <div
            key={location.id}
            className="rounded-lg border border-gray-200 p-4"
          >
            <h3 className="font-medium text-ink text-sm mb-3">
              {location.name}
            </h3>
            <div className="space-y-2">
              {addons.map((addon) => {
                const enabled = location[addon.field];
                const toggleKey = `${location.id}-${addon.key}`;
                return (
                  <div
                    key={addon.key}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <span className="text-sm text-ink">{addon.label}</span>
                      <span className="text-xs text-slate ml-2">
                        {addon.description}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleToggle(location.id, addon.key, !enabled)
                      }
                      disabled={isDisabled || toggling === toggleKey}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        enabled ? "bg-hilt-blue" : "bg-gray-200"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      role="switch"
                      aria-checked={enabled}
                      aria-label={`Toggle ${addon.label} for ${location.name}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {locations.length === 0 && (
        <p className="text-xs text-slate text-center py-4">
          No locations found.
        </p>
      )}
    </div>
  );
}
