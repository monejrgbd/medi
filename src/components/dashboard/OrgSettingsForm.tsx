"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrganization, deactivateAccount } from "@/app/(dashboard)/d/_actions/locations";
import { getPlanLabel, getTrialDaysLeft } from "@/lib/utils";
import { toast } from "sonner";

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
    skip_ai?: boolean;
  };
}

export default function OrgSettingsForm({
  overview,
}: {
  overview: OrgOverview;
}) {
  const router = useRouter();
  const [name, setName] = useState(overview.org.name);
  const [skipAi, setSkipAi] = useState(overview.org.skip_ai ?? false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deactivateStep, setDeactivateStep] = useState<"idle" | "confirm">("idle");
  const [deactivating, setDeactivating] = useState(false);

  const trialDays = getTrialDaysLeft(overview.org.trial_end_date);
  const creditPercent =
    overview.org.credits_total > 0
      ? Math.round((overview.org.credits_used / overview.org.credits_total) * 100)
      : 0;

  async function handleSave() {
    setLoading(true);
    setMessage(null);

    const result = await updateOrganization({ name, skipAi });
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

        <div className="pt-5 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-ink mb-3">AI Settings</h3>
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm text-ink">Skip AI for All Locations</span>
              <p className="text-xs text-ash">When enabled, no patients at any location will go through AI intake. This overrides individual location settings.</p>
            </div>
            <input
              type="checkbox"
              checked={skipAi}
              onChange={(e) => setSkipAi(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
            />
          </label>
        </div>

        {overview.org.subscription_plan !== "expired" && (
          <div className="mt-10 pt-6 border-t border-red-200">
            <h3 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h3>
            {deactivateStep === "idle" ? (
              <>
                <p className="text-xs text-slate mb-3">
                  Deactivating your account will immediately stop all AI sessions,
                  remove staff access, and set a 90-day data retention window.
                </p>
                <button
                  onClick={() => setDeactivateStep("confirm")}
                  className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Deactivate Account
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg bg-red-100 border border-red-200 p-3">
                  <p className="text-sm text-red-700 font-medium">
                    This action is immediate and cannot be undone easily.
                  </p>
                  <ul className="text-xs text-red-600 mt-2 space-y-1 list-disc list-inside">
                    <li>All AI sessions stop immediately</li>
                    <li>Staff lose access</li>
                    <li>Data retained for 90 days</li>
                    <li>You can reactivate by resubscribing</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      setDeactivating(true);
                      const result = await deactivateAccount(overview.org.id);
                      setDeactivating(false);
                      if (result?.success) {
                        toast.success("Account deactivated");
                        router.refresh();
                      } else {
                        toast.error(result?.error || "Failed to deactivate");
                      }
                      setDeactivateStep("idle");
                    }}
                    disabled={deactivating}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {deactivating ? "Deactivating..." : "Yes, Deactivate"}
                  </button>
                  <button
                    onClick={() => setDeactivateStep("idle")}
                    disabled={deactivating}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-ink hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
