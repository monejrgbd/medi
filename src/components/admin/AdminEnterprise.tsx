"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchOrganizations, setEnterprisePlan } from "@/app/(dashboard)/d/_actions/admin";
import { toast } from "sonner";

interface Org {
  id: string;
  name: string;
  slug: string;
  subscription_plan: string;
  credits_total: number;
  credits_used: number;
  recharge_limit: number | null;
  recharge_used: number;
  billing_cycle_start: string | null;
  created_at: string;
  cancelled_at: string | null;
  owner_email: string;
}

export default function AdminEnterprise() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null);
  const [credits, setCredits] = useState(5000);
  const [paypalSubId, setPaypalSubId] = useState("");
  const [saving, setSaving] = useState(false);

  const loadOrgs = useCallback(async (q?: string) => {
    setLoading(true);
    const res = await fetchOrganizations(q || undefined);
    if (res?.success && Array.isArray(res.data)) {
      setOrgs(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrgs();
  }, [loadOrgs]);

  function handleSearch() {
    loadOrgs(search);
  }

  async function handleAction(action: "activate" | "adjust_credits" | "revoke") {
    if (!selectedOrg || saving) return;

    if (action === "revoke") {
      if (!confirm(`Revoke enterprise plan for "${selectedOrg.name}"? This will set the plan to expired.`)) return;
    }

    setSaving(true);
    const res = await setEnterprisePlan({
      orgId: selectedOrg.id,
      creditsTotal: credits,
      action,
      paypalSubscriptionId: paypalSubId.trim() || undefined,
    });
    setSaving(false);

    if (res?.success) {
      toast.success(
        action === "activate"
          ? `Enterprise plan activated for ${selectedOrg.name}`
          : action === "adjust_credits"
          ? `Credits updated for ${selectedOrg.name}`
          : `Enterprise plan revoked for ${selectedOrg.name}`
      );
      setSelectedOrg(null);
      loadOrgs(search);
    } else {
      toast.error(res?.error || "Action failed");
    }
  }

  const enterpriseOrgs = orgs.filter((o) => o.subscription_plan === "enterprise");
  const nonEnterpriseOrgs = orgs.filter((o) => o.subscription_plan !== "enterprise");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold text-ink">Enterprise Plan Management</h1>

      {/* Enterprise customers */}
      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <h2 className="text-lg font-semibold text-ink mb-4">
          Active Enterprise Customers ({enterpriseOrgs.length})
        </h2>

        {enterpriseOrgs.length === 0 ? (
          <p className="text-sm text-slate">No enterprise customers yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-slate uppercase">
                  <th className="pb-2 pr-4">Organization</th>
                  <th className="pb-2 pr-4">Owner</th>
                  <th className="pb-2 pr-4">Credits</th>
                  <th className="pb-2 pr-4">Cycle Start</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enterpriseOrgs.map((org) => (
                  <tr key={org.id} className="border-b border-gray-50">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-ink">{org.name}</p>
                      <p className="text-xs text-slate">{org.slug}</p>
                    </td>
                    <td className="py-3 pr-4 text-slate">{org.owner_email}</td>
                    <td className="py-3 pr-4">
                      <span className="font-medium text-ink">
                        {Math.round(org.credits_used)} / {org.credits_total}
                      </span>
                      <span className="text-slate"> used</span>
                    </td>
                    <td className="py-3 pr-4 text-slate">
                      {org.billing_cycle_start
                        ? new Date(org.billing_cycle_start).toLocaleDateString()
                        : "Not set"}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrg(org);
                            setCredits(org.credits_total);
                            setPaypalSubId("");
                          }}
                          className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-ink hover:bg-gray-200 transition-colors"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrg(org);
                            handleAction("revoke");
                          }}
                          className="rounded-lg bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                        >
                          Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign enterprise */}
      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <h2 className="text-lg font-semibold text-ink mb-4">Assign Enterprise Plan</h2>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by name, slug, or email..."
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
          />
          <button
            onClick={handleSearch}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-ink hover:bg-gray-200 transition-colors"
          >
            Search
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-hilt-blue" />
          </div>
        ) : nonEnterpriseOrgs.length === 0 ? (
          <p className="text-sm text-slate py-4">No matching organizations found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-slate uppercase">
                  <th className="pb-2 pr-4">Organization</th>
                  <th className="pb-2 pr-4">Owner</th>
                  <th className="pb-2 pr-4">Current Plan</th>
                  <th className="pb-2 pr-4">Credits</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {nonEnterpriseOrgs.map((org) => (
                  <tr key={org.id} className="border-b border-gray-50">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-ink">{org.name}</p>
                      <p className="text-xs text-slate">{org.slug}</p>
                    </td>
                    <td className="py-3 pr-4 text-slate">{org.owner_email}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-ink capitalize">
                        {org.subscription_plan.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate">
                      {Math.round(org.credits_used)} / {org.credits_total}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => {
                          setSelectedOrg(org);
                          setCredits(5000);
                          setPaypalSubId("");
                        }}
                        className="rounded-lg bg-hilt-blue px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                      >
                        Set Enterprise
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for activate/adjust */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-ink mb-1">
              {selectedOrg.subscription_plan === "enterprise"
                ? "Adjust Enterprise Credits"
                : "Activate Enterprise Plan"}
            </h3>
            <p className="text-sm text-slate mb-4">
              {selectedOrg.name} ({selectedOrg.owner_email})
            </p>

            <label className="block text-sm font-medium text-ink mb-1">
              Monthly Credit Allocation
            </label>
            <input
              type="number"
              min={1}
              max={100000}
              value={credits}
              onChange={(e) =>
                setCredits(Math.max(1, Math.min(100000, parseInt(e.target.value) || 1)))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm mb-1 focus:border-hilt-blue focus:outline-none"
            />
            <p className="text-xs text-slate mb-4">
              Credits reset monthly. The cron will preserve this allocation on each cycle reset.
            </p>

            <label className="block text-sm font-medium text-ink mb-1">
              PayPal Subscription ID
              <span className="text-slate font-normal"> (optional)</span>
            </label>
            <input
              type="text"
              value={paypalSubId}
              onChange={(e) => setPaypalSubId(e.target.value)}
              placeholder="I-XXXXXXXXXX"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm mb-1 focus:border-hilt-blue focus:outline-none font-mono"
            />
            <p className="text-xs text-slate mb-4">
              Link a PayPal subscription so payment failures and cancellations are handled automatically.
              Create a custom subscription plan in PayPal, send the link to the customer, then paste the subscription ID here after they subscribe.
            </p>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSelectedOrg(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-slate hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleAction(
                    selectedOrg.subscription_plan === "enterprise"
                      ? "adjust_credits"
                      : "activate"
                  )
                }
                disabled={saving || credits < 1}
                className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving
                  ? "Saving..."
                  : selectedOrg.subscription_plan === "enterprise"
                  ? "Update Credits"
                  : "Activate Enterprise"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
