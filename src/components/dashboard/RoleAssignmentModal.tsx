"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignRole, removeRole } from "@/app/(dashboard)/d/_actions/staff";

interface LocationOption {
  id: string;
  name: string;
}

interface RoleAssignment {
  role: string;
  location_id: string;
  location_name: string;
}

export default function RoleAssignmentModal({
  open,
  staffUserId,
  staffName,
  currentRoles,
  locations,
  onClose,
}: {
  open: boolean;
  staffUserId: string;
  staffName: string;
  currentRoles: RoleAssignment[];
  locations: LocationOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (!open) return null;

  function hasRole(locationId: string, role: string) {
    return currentRoles.some(
      (r) => r.location_id === locationId && r.role === role
    );
  }

  async function toggleRole(locationId: string, role: string) {
    const key = `${locationId}-${role}`;
    setLoading(key);
    setError("");

    const has = hasRole(locationId, role);
    const result = has
      ? await removeRole(staffUserId, locationId, role)
      : await assignRole(staffUserId, locationId, role);

    if (!result.success) {
      setError(result.error || "Failed to update role");
      setLoading(null);
      return;
    }

    setLoading(null);
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-ink mb-1">Manage Roles</h2>
        <p className="text-sm text-slate mb-4">{staffName}</p>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {locations.map((loc) => (
            <div key={loc.id} className="rounded-lg border border-gray-100 p-4">
              <p className="text-sm font-medium text-ink mb-3">{loc.name}</p>
              <div className="flex gap-2">
                {["doctor", "receptionist", "manager"].map((role) => {
                  const key = `${loc.id}-${role}`;
                  const active = hasRole(loc.id, role);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleRole(loc.id, role)}
                      disabled={loading === key}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-hilt-blue text-white"
                          : "bg-gray-100 text-slate hover:bg-gray-200"
                      } disabled:opacity-50`}
                    >
                      {loading === key ? "..." : role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate hover:text-ink"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
