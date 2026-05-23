"use client";

import { useState, useEffect } from "react";
import { createStaffUser } from "@/app/(dashboard)/d/_actions/staff";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";
import StaffCredentialCards, { type AddedStaff } from "./StaffCredentialCards";

interface ExistingStaff {
  id: string;
  full_name: string;
  username: string;
  roles: { role: string; location_id: string }[];
}

export default function AddStaffStep({
  orgId,
  orgSlug,
  locationId,
  locationName,
  nurseEnabled,
  addedStaff,
  onStaffAdded,
  onContinue,
  onBack,
}: {
  orgId: string;
  orgSlug: string;
  locationId: string;
  locationName: string;
  nurseEnabled?: boolean;
  addedStaff: AddedStaff[];
  onStaffAdded: (staff: AddedStaff) => void;
  onContinue: () => void;
  onBack?: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingStaff, setExistingStaff] = useState<ExistingStaff[]>([]);

  // Fetch existing staff for this location on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("get_staff_list", { p_org_id: orgId, p_location_id: locationId }).then(({ data }) => {
      if (data && Array.isArray(data)) {
        setExistingStaff(data as ExistingStaff[]);
      }
    });
  }, [orgId, locationId]);

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

    const trimmedEmail = notificationEmail.trim();
    const wantsEmail = trimmedEmail.length > 0;

    const result = await createStaffUser({
      orgId,
      fullName,
      username,
      password,
      locationId,
      roles: selectedRoles,
      notificationEmail: trimmedEmail || null,
      sendCredentialsEmail: wantsEmail,
    });

    if (!result.success) {
      setError(result.error || "Failed to create staff member");
      setLoading(false);
      return;
    }

    onStaffAdded({
      name: fullName.trim(),
      username,
      password,
      roles: [...selectedRoles],
      notificationEmail: trimmedEmail || undefined,
      emailSent: Boolean(result.emailSent),
    });
    setFullName("");
    setUsername("");
    setPassword("");
    setShowPassword(false);
    setNotificationEmail("");
    setSelectedRoles([]);
    setLoading(false);
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
          addedStaff.length > 0 || existingStaff.length > 0
            ? "bg-hilt-blue hover:bg-hilt-blue-dark"
            : "bg-gray-300 hover:bg-gray-400"
        }`}
      >
        {addedStaff.length > 0 || existingStaff.length > 0 ? "Continue" : "Skip for now"}
      </button>

      {/* Existing staff from DB */}
      {existingStaff.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-semibold text-ash uppercase tracking-wider">
            Current staff ({existingStaff.length})
          </p>
          {existingStaff.map((staff) => (
            <div
              key={staff.id}
              className="rounded-xl border border-gray-200 bg-gray-50 p-3 flex items-center gap-3"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200">
                <Check className="h-3.5 w-3.5 text-gray-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink truncate">{staff.full_name}</p>
                <p className="text-xs text-slate">{staff.username}@{orgSlug}.staff.hilt</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {staff.roles
                  .filter((r) => r.location_id === locationId)
                  .map((r) => (
                    <span
                      key={r.role}
                      className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate ring-1 ring-gray-200 capitalize"
                    >
                      {r.role}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <StaffCredentialCards addedStaff={addedStaff} orgSlug={orgSlug} />


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
            {password.length > 0 && password.length < 8 && (
              <p className="mt-1 text-xs text-red-600">Min 8 characters</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Email login details to staff member
            </label>
            <input
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              maxLength={254}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
              placeholder="staff@example.com"
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-ash">
              Leave blank to share the login yourself.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Roles
            </label>
            <div className="flex flex-wrap gap-3">
              {["doctor", "receptionist", "nurse", "manager"].map((role) => (
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

      {/* Continue / Skip — mirror of the top button so users do not have to scroll back up */}
      <button
        onClick={onContinue}
        className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white mt-4 ${
          addedStaff.length > 0 || existingStaff.length > 0
            ? "bg-hilt-blue hover:bg-hilt-blue-dark"
            : "bg-gray-300 hover:bg-gray-400"
        }`}
      >
        {addedStaff.length > 0 || existingStaff.length > 0 ? "Continue" : "Skip for now"}
      </button>

      {onBack && (
        <button
          onClick={onBack}
          className="w-full flex items-center justify-center gap-1 text-sm text-slate hover:text-ink transition-colors py-2 mt-1"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back
        </button>
      )}
    </div>
  );
}
