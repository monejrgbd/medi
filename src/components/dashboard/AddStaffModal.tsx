"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/contexts/RoleContext";
import { createStaffUser } from "@/app/(dashboard)/d/_actions/staff";

interface LocationOption {
  id: string;
  name: string;
}

export default function AddStaffModal({
  open,
  onClose,
  locations,
  preselectedLocationId,
}: {
  open: boolean;
  onClose: () => void;
  locations: LocationOption[];
  preselectedLocationId?: string;
}) {
  const { org } = useRole();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [locationId, setLocationId] = useState(preselectedLocationId || "");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function generateUsername(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 50);
  }

  function handleNameChange(value: string) {
    setFullName(value);
    if (!username || username === generateUsername(fullName)) {
      setUsername(generateUsername(value));
    }
  }

  function toggleRole(role: string) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await createStaffUser({
      orgId: org.id,
      fullName,
      username,
      password,
      locationId,
      roles: selectedRoles,
    });

    if (!result.success) {
      setError(result.error || "Failed to create staff");
      setLoading(false);
      return;
    }

    setFullName("");
    setUsername("");
    setPassword("");
    setSelectedRoles([]);
    setLocationId(preselectedLocationId || "");
    setLoading(false);
    onClose();
    router.refresh();
  }

  function handleClose() {
    setFullName("");
    setUsername("");
    setPassword("");
    setError("");
    setSelectedRoles([]);
    setLocationId(preselectedLocationId || "");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-ink mb-4">Add Staff Member</h2>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              maxLength={100}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none"
              placeholder="John Smith"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              required
              maxLength={50}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none"
              placeholder="john_smith"
            />
            <p className="mt-1 text-xs text-slate">
              Login: {username || "username"}@{org.slug}.staff.hilt
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={72}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none pr-16"
                placeholder="Min 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate hover:text-ink"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {password.length > 0 && password.length < 8 && (
              <p className="mt-1 text-xs text-red-600">Min 8 characters</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none"
            >
              <option value="">Select location...</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Roles
            </label>
            <div className="flex flex-wrap gap-3">
              {["doctor", "receptionist", "manager"].map((role) => (
                <label key={role} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm capitalize">{role}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !fullName.trim() || !username.trim() || password.length < 8 || !locationId || selectedRoles.length === 0}
              className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Creating..." : "Add Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
