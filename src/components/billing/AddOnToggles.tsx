"use client";

import { useState } from "react";
import { toggleLocationAddon } from "@/app/(dashboard)/d/_actions/billing";
import { toast } from "sonner";

interface Location {
  id: string;
  name: string;
  review_sms_enabled: boolean;
  diagnostic_enabled: boolean;
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
    addon: "review_sms" | "diagnostic",
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
                  : "diagnostic_enabled"]: enabled,
              }
            : l
        )
      );
      const label = addon === "review_sms" ? "Review SMS" : "AI Diagnostic";
      toast.success(`${label} ${enabled ? "enabled" : "disabled"}`);
      onChanged();
    } else {
      toast.error(result?.error || "Failed to update");
    }
  }

  const aiAddons = [
    {
      key: "diagnostic" as const,
      label: "AI Diagnostic",
      description: "AI powered clinical assessment for doctors",
      field: "diagnostic_enabled" as const,
    },
  ];

  const smsAddons = [
    {
      key: "review_sms" as const,
      label: "Review SMS",
      description: "Send review request texts after visits",
      field: "review_sms_enabled" as const,
    },
  ];

  function renderToggle(location: Location, addon: { key: "review_sms" | "diagnostic"; label: string; description: string; field: "review_sms_enabled" | "diagnostic_enabled" }) {
    const enabled = location[addon.field];
    const toggleKey = `${location.id}-${addon.key}`;
    return (
      <div key={addon.key} className="flex items-center justify-between">
        <div>
          <span className="text-sm text-ink">{addon.label}</span>
          <span className="text-xs text-slate ml-2">{addon.description}</span>
        </div>
        <button
          onClick={() => handleToggle(location.id, addon.key, !enabled)}
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
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6">
      <h2 className="text-lg font-semibold text-ink mb-4">Add ons</h2>

      {isDisabled && (
        <p className="text-xs text-red-500 mb-4">
          Add ons are unavailable while your plan is {subscriptionPlan}.
        </p>
      )}

      <div className="space-y-5">
        {/* AI Features */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-ink">AI Features</h3>
            <span className="text-xs text-slate bg-gray-50 px-2 py-1 rounded-full">
              0.5 credits per visit
            </span>
          </div>
          <div className="space-y-3">
            {locations.map((location) => (
              <div key={location.id} className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-ink text-sm mb-3">{location.name}</h4>
                <div className="space-y-2">
                  {aiAddons.map((addon) => renderToggle(location, addon))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SMS Features */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-ink">SMS Features</h3>
            <span className="text-xs text-slate bg-gray-50 px-2 py-1 rounded-full">
              0.1 credits per SMS
            </span>
          </div>
          <div className="space-y-3">
            {locations.map((location) => (
              <div key={location.id} className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-ink text-sm mb-3">{location.name}</h4>
                <div className="space-y-2">
                  {smsAddons.map((addon) => renderToggle(location, addon))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {locations.length === 0 && (
        <p className="text-xs text-slate text-center py-4">
          No locations found.
        </p>
      )}
    </div>
  );
}
