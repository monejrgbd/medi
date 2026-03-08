"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrganization } from "@/app/(dashboard)/d/_actions/locations";
import { getPlanLabel, getTrialDaysLeft } from "@/lib/utils";

interface OrgOverview {
  org: {
    id: string;
    name: string;
    slug: string;
    subscription_plan: string;
    credits_total: number;
    credits_used: number;
    credits_remaining: number;
    trial_end_date: string | null;
  };
}

export default function OrgSettingsForm({
  overview,
}: {
  overview: OrgOverview;
}) {
  const router = useRouter();
  const [name, setName] = useState(overview.org.name);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const trialDays = getTrialDaysLeft(overview.org.trial_end_date);
  const creditPercent =
    overview.org.credits_total > 0
      ? Math.round((overview.org.credits_used / overview.org.credits_total) * 100)
      : 0;

  async function handleSave() {
    setLoading(true);
    setMessage(null);

    const result = await updateOrganization({ name });
    setLoading(false);

    if (result.success) {
      setMessage({ type: "success", text: "Organization name updated" });
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error || "Failed to save" });
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-8">Settings</h1>

      {message && (
        <div
          className={`mb-6 rounded-lg p-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            Organization Name
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setMessage(null);
              }}
              maxLength={100}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-hilt-blue focus:outline-none"
            />
            <button
              onClick={handleSave}
              disabled={loading || !name.trim() || name === overview.org.name}
              className="rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-hilt-blue-dark"
            >
              {loading ? "..." : "Save"}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Slug</label>
          <input
            type="text"
            value={overview.org.slug}
            readOnly
            className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-slate"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Plan</label>
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
            <p className="text-sm font-medium text-ink">
              {getPlanLabel(overview.org.subscription_plan)}
            </p>
            {trialDays && (
              <p className="text-xs text-amber-600 mt-1">
                {trialDays} days remaining in trial
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Credits</label>
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate">Used</span>
              <span className="font-medium text-ink">
                {overview.org.credits_used} / {overview.org.credits_total}
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-hilt-blue transition-all"
                style={{ width: `${Math.min(creditPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {overview.org.trial_end_date && (
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Trial End Date
            </label>
            <input
              type="text"
              value={new Date(overview.org.trial_end_date).toLocaleDateString()}
              readOnly
              className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-slate"
            />
          </div>
        )}
      </div>
    </div>
  );
}
