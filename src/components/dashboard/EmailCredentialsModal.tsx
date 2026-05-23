"use client";

import { useState } from "react";
import { Copy, Mail } from "lucide-react";
import { emailStaffCredentials } from "@/app/(dashboard)/d/_actions/staff";

export default function EmailCredentialsModal({
  open,
  staffUserId,
  staffName,
  currentNotificationEmail,
  onClose,
  onSuccess,
}: {
  open: boolean;
  staffUserId: string;
  staffName: string;
  currentNotificationEmail: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [overrideEmail, setOverrideEmail] = useState(currentNotificationEmail || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    newPassword: string;
    emailSent: boolean;
    emailError: string | null;
    sentTo: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const isEditingEmail = !currentNotificationEmail;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const target = overrideEmail.trim();
    if (!target) {
      setError("Enter an email address");
      setLoading(false);
      return;
    }

    const response = await emailStaffCredentials(staffUserId, target);
    if (!response.success) {
      setError(response.error || "Failed to send credentials");
      setLoading(false);
      return;
    }

    setResult({
      newPassword: response.newPassword,
      emailSent: response.emailSent,
      emailError: response.emailError,
      sentTo: target,
    });
    setLoading(false);
    onSuccess();
  }

  async function copyPassword() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  function handleClose() {
    setOverrideEmail(currentNotificationEmail || "");
    setError("");
    setResult(null);
    setCopied(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        {!result ? (
          <>
            <h2 className="text-lg font-semibold text-ink mb-1">Email new login</h2>
            <p className="text-sm text-slate mb-4">
              This resets {staffName}&rsquo;s password and emails the new login.
              They will be signed out within an hour.
            </p>

            {error && (
              <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-ink mb-1">
                Send to
              </label>
              <input
                type="email"
                value={overrideEmail}
                onChange={(e) => setOverrideEmail(e.target.value)}
                placeholder="staff@example.com"
                required
                maxLength={254}
                autoFocus={isEditingEmail}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
              />
              {!isEditingEmail && (
                <p className="mt-1 text-xs text-slate">
                  Edit to send to a different address.
                </p>
              )}

              <div className="mt-5 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || overrideEmail.trim().length === 0}
                  className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Reset and send"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50">
                <Mail className="h-4 w-4 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-ink">
                {result.emailSent ? "Email sent" : "Password reset"}
              </h2>
            </div>
            <p className="text-sm text-slate mb-4">
              {result.emailSent
                ? `New login details were sent to ${result.sentTo}.`
                : `Could not send the email${
                    result.emailError ? ` (${result.emailError})` : ""
                  }. Share this password manually.`}
            </p>

            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ash mb-1">
                New password
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-sm text-ink break-all">
                  {result.newPassword}
                </code>
                <button
                  type="button"
                  onClick={copyPassword}
                  className="rounded p-1 text-slate hover:bg-white hover:text-ink"
                  title="Copy"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              {copied && (
                <p className="mt-1 text-[10px] text-green-600">Copied</p>
              )}
            </div>

            <p className="mt-3 text-xs text-ash">
              Keep this safe. After closing this dialog the password cannot be retrieved.
            </p>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-semibold text-white"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
