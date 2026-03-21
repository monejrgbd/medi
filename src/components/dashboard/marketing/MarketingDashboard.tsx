"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useRole } from "@/contexts/RoleContext";
import { createClient } from "@/lib/supabase/client";
import { getCampaignList } from "@/app/(dashboard)/d/_actions/marketing";
import { MARKETING_SMS_CREDIT_COST } from "@/lib/constants";
import { Plus, Megaphone } from "lucide-react";
import { toast } from "sonner";
import CreateCampaignModal from "./CreateCampaignModal";

interface Campaign {
  id: string;
  created_at: string;
  ai_criteria: string | null;
  status: string;
  matched_count: number;
  excluded_count: number;
  sent_count: number;
  failed_count: number;
  credits_charged: number;
}

interface CampaignListData {
  campaigns: Campaign[];
  has_more: boolean;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  scanning: { bg: "bg-blue-100", text: "text-blue-700" },
  ready: { bg: "bg-amber-100", text: "text-amber-700" },
  sending: { bg: "bg-blue-100", text: "text-blue-700" },
  completed: { bg: "bg-green-100", text: "text-green-700" },
  cancelled: { bg: "bg-gray-100", text: "text-gray-700" },
  failed: { bg: "bg-red-100", text: "text-red-700" },
};

export default function MarketingDashboard({
  initialData,
  onCampaignSelect,
  demoScanLimitReached,
}: {
  initialData: CampaignListData | null;
  onCampaignSelect?: (campaignId: string) => void;
  demoScanLimitReached?: boolean;
}) {
  const { org, roles, isOwner } = useRole();
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname?.startsWith("/d/marketer") ? "/d/marketer" : "/d/owner/marketing";
  const [addonEnabled, setAddonEnabled] = useState(
    !!(org as unknown as Record<string, unknown>).marketing_sms_addon
  );
  const [enabling, setEnabling] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>(
    initialData?.campaigns ?? []
  );
  const [hasMore, setHasMore] = useState(initialData?.has_more ?? false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [locations, setLocations] = useState<
    { id: string; name: string }[]
  >([]);

  const loadLocations = useCallback(() => {
    const supabase = createClient();
    supabase.rpc("get_locations").then(({ data }) => {
      if (data) {
        setLocations(
          (data as { id: string; name: string }[]).map((l) => ({
            id: l.id,
            name: l.name,
          }))
        );
      }
    });
  }, []);

  useEffect(() => {
    if (addonEnabled) {
      loadLocations();
    }
  }, [addonEnabled, loadLocations]);

  async function handleEnableAddon() {
    setEnabling(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("toggle_addon", {
        p_addon_type: "marketing_sms",
        p_enabled: true,
      });
      if (error) {
        toast.error(error.message);
      } else {
        setAddonEnabled(true);
        toast.success("Marketing SMS enabled");
        router.refresh();
      }
    } catch {
      toast.error("Failed to enable addon");
    } finally {
      setEnabling(false);
    }
  }

  async function handleLoadMore() {
    if (campaigns.length === 0) return;
    setLoadingMore(true);
    try {
      const result = await getCampaignList(campaigns.length);
      if (result && !("error" in result)) {
        const data = result as CampaignListData;
        setCampaigns((prev) => [...prev, ...data.campaigns]);
        setHasMore(data.has_more);
      }
    } catch {
      toast.error("Failed to load more campaigns");
    } finally {
      setLoadingMore(false);
    }
  }

  // Filter locations for marketers (owners see all)
  const filteredLocations = isOwner
    ? locations
    : locations.filter((loc: { id: string }) =>
        roles.some((r) => r.role === "marketer" && r.location_id === loc.id)
      );

  if (!addonEnabled) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <Megaphone className="w-6 h-6 text-hilt-blue" />
          </div>
          <h2 className="text-lg font-semibold text-ink mb-2">
            AI Targeted Marketing SMS
          </h2>
          <p className="text-sm text-slate max-w-md mx-auto mb-2">
            Reach the right patients with smart, targeted text campaigns.
            Describe who you want to contact and let AI find the matches in
            your patient database.
          </p>
          <p className="text-xs text-ash mb-6">
            {MARKETING_SMS_CREDIT_COST} credits per SMS sent
          </p>
          {isOwner ? (
            <button
              onClick={handleEnableAddon}
              disabled={enabling}
              className="inline-flex items-center px-5 py-2.5 bg-hilt-blue text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {enabling ? "Enabling..." : "Enable Marketing SMS"}
            </button>
          ) : (
            <p className="text-sm text-slate">
              Marketing SMS is not enabled for this organization. Ask your administrator to enable it.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">
          Marketing Campaigns
        </h1>
        <button
          onClick={() => setModalOpen(true)}
          disabled={demoScanLimitReached}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-hilt-blue text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
          <Megaphone className="w-10 h-10 text-ash mx-auto mb-3" />
          <p className="text-sm font-medium text-ink mb-1">No campaigns yet</p>
          <p className="text-xs text-slate mb-4">
            Create your first campaign to find and reach the right patients.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            disabled={demoScanLimitReached}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-hilt-blue text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="sm:hidden space-y-3">
            {campaigns.map((c) => {
              const colors = STATUS_COLORS[c.status] ?? STATUS_COLORS.cancelled;
              return (
                <div
                  key={c.id}
                  onClick={() => onCampaignSelect ? onCampaignSelect(c.id) : router.push(`${basePath}/${c.id}`)}
                  className="rounded-xl border border-gray-100 bg-white p-4 cursor-pointer hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-ash">{new Date(c.created_at).toLocaleDateString()}</span>
                    <span className={`rounded-full ${colors.bg} px-2 py-0.5 text-[10px] font-medium ${colors.text}`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-sm text-ink mb-2 line-clamp-2">
                    {c.ai_criteria || "Structured filters only"}
                  </p>
                  <div className="flex gap-4 text-xs text-ash">
                    <span>{c.matched_count} matched</span>
                    <span>{c.sent_count} sent</span>
                    {c.credits_charged > 0 && <span>{c.credits_charged.toFixed(1)} credits</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden sm:block rounded-xl border border-gray-100 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-ash uppercase tracking-wide">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-ash uppercase tracking-wide">Criteria</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-ash uppercase tracking-wide">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-ash uppercase tracking-wide">Matched</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-ash uppercase tracking-wide">Sent</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-ash uppercase tracking-wide">Credits</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const colors = STATUS_COLORS[c.status] ?? STATUS_COLORS.cancelled;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => onCampaignSelect ? onCampaignSelect(c.id) : router.push(`${basePath}/${c.id}`)}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 text-ink">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-slate max-w-[200px] truncate">
                        {c.ai_criteria
                          ? c.ai_criteria.length > 60 ? c.ai_criteria.slice(0, 60) + "..." : c.ai_criteria
                          : "Structured filters only"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block rounded-full ${colors.bg} px-2 py-0.5 text-[10px] font-medium ${colors.text}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-ink">{c.matched_count}</td>
                      <td className="py-3 px-4 text-right text-ink">{c.sent_count}</td>
                      <td className="py-3 px-4 text-right text-ink">
                        {c.credits_charged > 0 ? c.credits_charged.toFixed(1) : "\u2014"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {hasMore && (
              <div className="p-4 text-center border-t border-gray-50">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="text-sm text-hilt-blue hover:text-blue-700 font-medium disabled:opacity-50"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <CreateCampaignModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        locations={filteredLocations}
        onCampaignCreated={onCampaignSelect}
      />
    </div>
  );
}
