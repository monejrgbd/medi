"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/contexts/RoleContext";
import FeatureRequestModal from "./FeatureRequestModal";
import {
  Stethoscope,
  ClipboardList,
  Settings,
  Star,
  Building2,
  Lightbulb,
} from "lucide-react";

const ROLE_CONFIG: Record<string, { label: string; icon: ReactNode; color: string }> = {
  doctor: { label: "Doctor", icon: <Stethoscope className="h-6 w-6" />, color: "bg-blue-50 border-blue-200 hover:border-blue-400" },
  receptionist: { label: "Receptionist", icon: <ClipboardList className="h-6 w-6" />, color: "bg-green-50 border-green-200 hover:border-green-400" },
  manager: { label: "Manager", icon: <Settings className="h-6 w-6" />, color: "bg-purple-50 border-purple-200 hover:border-purple-400" },
  reviews: { label: "Reviews", icon: <Star className="h-6 w-6" />, color: "bg-yellow-50 border-yellow-200 hover:border-yellow-400" },
};

const ALL_ROLES = ["doctor", "receptionist", "manager", "reviews"];

export default function RoleSelector() {
  const { org, roles, isOwner, currentStaffUser } = useRole();
  const router = useRouter();
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
        {currentStaffUser?.full_name && (
          <p className="text-sm text-slate">{currentStaffUser.full_name}</p>
        )}
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

      {isOwner && locations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-ash" />
          <p className="text-sm font-medium text-slate">No locations set up yet</p>
          <p className="mt-1 text-xs text-ash">Create your first location to start accepting patients.</p>
          <a
            href="/d/onboarding"
            className="mt-4 inline-block rounded-lg bg-hilt-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-hilt-blue-dark transition-colors"
          >
            Start Setup
          </a>
        </div>
      ) : (
        <>
          {isOwner && (
            <button
              onClick={() => router.push("/d/owner")}
              className="w-full rounded-xl border-2 border-indigo-200 bg-indigo-50 p-6 text-left transition-all hover:border-indigo-400 mb-6"
            >
              <Building2 className="mb-2 h-6 w-6 text-indigo-600" />
              <h3 className="text-lg font-semibold text-ink">Owner Dashboard</h3>
              <p className="mt-1 text-sm text-slate">
                Manage locations, staff, and settings
              </p>
            </button>
          )}

          {displayRoles.length === 0 && !isOwner && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-6 text-center">
              <p className="text-sm text-amber-800">
                No roles assigned. Contact your administrator.
              </p>
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
                    if (role === "receptionist") {
                      router.push("/d/receptionist");
                    }
                    if (role === "doctor") {
                      router.push("/d/doctor");
                    }
                    if (role === "manager") {
                      router.push("/d/manager");
                    }
                    if (role === "reviews") {
                      router.push("/d/reviews");
                    }
                  }}
                >
                  <div className="mb-2 text-slate">{config.icon}</div>
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
              <Lightbulb className="mb-2 h-6 w-6 text-slate" />
              <h3 className="text-lg font-semibold text-ink">Request a Feature</h3>
              <p className="mt-1 text-sm text-slate">
                Have an idea? Let us know what would help your workflow.
              </p>
            </button>
          </div>
        </>
      )}

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
