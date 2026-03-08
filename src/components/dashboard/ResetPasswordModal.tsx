"use client";

import { useState } from "react";
import { resetStaffPassword } from "@/app/(dashboard)/d/_actions/staff";

export default function ResetPasswordModal({
  open,
  staffUserId,
  staffName,
  onClose,
  onSuccess,
}: {
  open: boolean;
  staffUserId: string;
  staffName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await resetStaffPassword(staffUserId, password);
    if (!result.success) {
      setError(result.error || "Failed to reset password");
      setLoading(false);
      return;
    }

    setPassword("");
    setLoading(false);
    onSuccess();
    onClose();
  }

  function handleClose() {
    setPassword("");
    setError("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-ink mb-1">Reset Password</h2>
        <p className="text-sm text-slate mb-4">
          Set a new password for {staffName}
        </p>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (min 8, max 72)"
              required
              minLength={8}
              maxLength={72}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate hover:text-ink"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div className="mt-4 flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || password.length < 8}
              className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
