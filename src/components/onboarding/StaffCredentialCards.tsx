"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, Copy, Mail } from "lucide-react";

export interface AddedStaff {
  name: string;
  username: string;
  password: string;
  roles: string[];
  notificationEmail?: string;
  emailSent?: boolean;
}

export default function StaffCredentialCards({
  addedStaff,
  orgSlug,
  heading = "Just added",
}: {
  addedStaff: AddedStaff[];
  orgSlug: string;
  heading?: string;
}) {
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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
      setVisiblePasswords((prev) => new Set(prev).add(index));
    }
  }

  if (addedStaff.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      <p className="text-xs font-semibold text-ash uppercase tracking-wider">
        {heading} ({addedStaff.length})
      </p>
      {addedStaff.map((staff, i) => (
        <div
          key={i}
          className="rounded-xl border border-green-200 bg-green-50 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-ink">{staff.name}</span>
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
                  : "•".repeat(8)}
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
                  <span className="text-green-600 text-[10px]">Copied</span>
                )}
              </button>
            </div>
            {staff.emailSent && staff.notificationEmail && (
              <p className="flex items-center gap-1.5 text-[11px] text-green-700 mt-1">
                <Mail className="h-3 w-3" />
                Sent to {staff.notificationEmail}
              </p>
            )}
            {!staff.emailSent && staff.notificationEmail && (
              <p className="text-[11px] text-amber-700 mt-1">
                Email not sent. Share credentials manually with {staff.notificationEmail}.
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
