"use client";

import { useState } from "react";
import { useRole } from "@/contexts/RoleContext";
import FeatureRequestModal from "./FeatureRequestModal";

const ROLE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  doctor: { label: "Doctor", icon: "🩺", color: "bg-blue-50 border-blue-200 hover:border-blue-400" },
  receptionist: { label: "Receptionist", icon: "📋", color: "bg-green-50 border-green-200 hover:border-green-400" },
  manager: { label: "Manager", icon: "⚙️", color: "bg-purple-50 border-purple-200 hover:border-purple-400" },
  reviews: { label: "Reviews", icon: "⭐", color: "bg-yellow-50 border-yellow-200 hover:border-yellow-400" },
};

const ALL_ROLES = ["doctor", "receptionist", "manager", "reviews"];

export default function RoleSelector() {
  const { org, roles, isOwner, currentStaffUser } = useRole();
  const [featureModalOpen, setFeatureModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  // Get unique locations from roles
  const locations = Array.from(
    new Map(roles.map((r) => [r.location_id, r.location_name])).entries()
  ).map(([id, name]) => ({ id, name }));

  // For owner: show all roles. For staff: show assigned roles.
  const displayRoles = isOwner ? ALL_ROLES : [...new Set(roles.map((r) => r.role))];

  // Get location badges per role (for staff)
  function getLocationsForRole(role: string) {
    return roles.filter((r) => r.role === role);
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-ink mb-1">{org.name}</h1>
        <p className="text-sm text-slate">
          {currentStaffUser?.full_name} — Select your role
        </p>
      </div>

      {isOwner && locations.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-ink mb-2">
            Location
          </label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none"
          >
            <option value="">All locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {displayRoles.map((role) => {
          const config = ROLE_CONFIG[role];
          if (!config) return null;
          const roleLocations = getLocationsForRole(role);

          return (
            <button
              key={role}
              className={`rounded-xl border-2 p-6 text-left transition-all ${config.color}`}
              onClick={() => {
                // Navigation to role dashboard will be added in Phase 2+
              }}
            >
              <div className="mb-2 text-2xl">{config.icon}</div>
              <h3 className="text-lg font-semibold text-ink">{config.label}</h3>
              {!isOwner && roleLocations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {roleLocations.map((rl) => (
                    <span
                      key={`${rl.location_id}-${rl.role}`}
                      className="inline-block rounded-full bg-white/80 px-2 py-0.5 text-xs text-slate"
                    >
                      {rl.location_name}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}

        <button
          onClick={() => setFeatureModalOpen(true)}
          className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-left transition-all hover:border-gray-400 bg-white"
        >
          <div className="mb-2 text-2xl">💡</div>
          <h3 className="text-lg font-semibold text-ink">Request a Feature</h3>
          <p className="mt-1 text-sm text-slate">
            Have an idea? Let us know what would help your workflow.
          </p>
        </button>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={async () => {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
          className="text-sm text-slate hover:text-ink transition-colors"
        >
          Sign out
        </button>
      </div>

      <FeatureRequestModal
        open={featureModalOpen}
        onClose={() => setFeatureModalOpen(false)}
      />
    </>
  );
}
