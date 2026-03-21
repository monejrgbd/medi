"use client";

import { useState } from "react";
import { createStaffUser } from "@/app/(dashboard)/d/_actions/staff";
import { Check, Eye, EyeOff, Copy } from "lucide-react";

interface AddedStaff {
  name: string;
  username: string;
  password: string;
  roles: string[];
}

export default function AddStaffStep({
  orgId,
  orgSlug,
  locationId,
  locationName,
  nurseEnabled,
  onContinue,
}: {
  orgId: string;
  orgSlug: string;
  locationId: string;
  locationName: string;
  nurseEnabled?: boolean;
  onContinue: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [addedStaff, setAddedStaff] = useState<AddedStaff[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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
      orgId,
      fullName,
      username,
      password,
      locationId,
      roles: selectedRoles,
    });

    if (!result.success) {
      setError(result.error || "Failed to create staff member");
      setLoading(false);
      return;
    }

    setAddedStaff((prev) => [
      ...prev,
      { name: fullName.trim(), username, password, roles: [...selectedRoles] },
    ]);
    setFullName("");
    setUsername("");
    setPassword("");
    setShowPassword(false);
    setSelectedRoles([]);
    setLoading(false);
  }

  function toggleCredentialPassword(index: number) {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function copyCredentials(staff: AddedStaff, index: number) {
    try {
      const text = `Login: ${staff.username}@${orgSlug}.staff.hilt\nPassword: ${staff.password}`;
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Clipboard API unavailable — toggle password visible as fallback
      setVisiblePasswords((prev) => new Set(prev).add(index));
    }
  }

  const canSubmit =
    fullName.trim().length > 0 &&
    username.trim().length > 0 &&
    password.length >= 8 &&
    selectedRoles.length > 0;

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold text-ink mb-1 text-center">
        Add Your Team
      </h2>
      <p className="text-sm text-slate mb-6 text-center">
        Create accounts for the people who will use Hilt Health at{" "}
        <span className="font-medium">{locationName}</span>.
      </p>

      {/* Continue / Skip — always visible at top */}
      <button
        onClick={onContinue}
        className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white mb-6 ${
          addedStaff.length > 0
            ? "bg-hilt-blue hover:bg-hilt-blue-dark"
            : "bg-gray-300 hover:bg-gray-400"
        }`}
      >
        {addedStaff.length > 0 ? "Continue" : "Skip for now"}
      </button>

      {/* Added staff credential cards */}
      {addedStaff.length > 0 && (
        <div className="mb-6 space-y-3">
          <p className="text-xs font-semibold text-ash uppercase tracking-wider">
            Staff added ({addedStaff.length})
          </p>
          {addedStaff.map((staff, i) => (
            <div
              key={i}
              className="rounded-xl border border-green-200 bg-green-50 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-ink">
                  {staff.name}
                </span>
                <div className="flex gap-1.5 ml-auto">
                  {staff.roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate ring-1 ring-green-200 capitalize"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-xs text-slate space-y-1">
                <p>
                  Login:{" "}
                  <span className="font-mono text-ink">
                    {staff.username}@{orgSlug}.staff.hilt
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <span>Password:</span>
                  <span className="font-mono text-ink">
                    {visiblePasswords.has(i)
                      ? staff.password
                      : "\u2022".repeat(8)}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleCredentialPassword(i)}
                    className="text-slate hover:text-ink"
                  >
                    {visiblePasswords.has(i) ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyCredentials(staff, i)}
                    className="text-slate hover:text-ink flex items-center gap-1"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedIndex === i && (
                      <span className="text-green-600 text-[10px]">
                        Copied
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add staff form */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-semibold text-ink mb-4">
          {addedStaff.length > 0 ? "Add another" : "Add a staff member"}
        </p>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => handleNameChange(e.target.value)}
              maxLength={100}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
              placeholder="John Smith"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                )
              }
              maxLength={50}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
              placeholder="john_smith"
            />
            <p className="mt-1 text-xs text-slate">
              Login: {username || "username"}@{orgSlug}.staff.hilt
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                maxLength={72}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue pr-16"
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
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Roles
            </label>
            <div className="flex flex-wrap gap-3">
              {["doctor", "receptionist", ...(nurseEnabled ? ["nurse"] : []), "manager"].map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-2 cursor-pointer"
                >
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

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Creating..." : "Add Staff"}
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-ash">
        You can always add more from the dashboard later.
      </p>
    </div>
  );
}
