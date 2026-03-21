"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  getCampaignDetail,
  cancelCampaign,
} from "@/app/(dashboard)/d/_actions/marketing";
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import CampaignReview from "./CampaignReview";

interface CampaignDetailProps {
  initialData: Record<string, unknown>;
  campaignId: string;
  onBack?: () => void;
}

export default function CampaignDetail({
  initialData,
  campaignId,
  onBack,
}: CampaignDetailProps) {
  const router = useRouter();
  const pathname = usePathname();
  const listPath = pathname?.startsWith("/d/marketer") ? "/d/marketer" : "/d/owner/marketing";
  const [data, setData] = useState(initialData);
  const [cancelling, setCancelling] = useState(false);

  const campaign = (data.campaign || data) as Record<string, unknown>;
  const recipients = (data.recipients || []) as Record<string, unknown>[];
  const creditCostPreview = (data.credit_cost_preview || 0) as number;
  const status = campaign.status as string;

  const refresh = useCallback(async () => {
    const result = await getCampaignDetail(campaignId);
    if (result && !("error" in result)) {
      setData(result as Record<string, unknown>);
    }
  }, [campaignId]);

  // Poll while scanning or sending
  useEffect(() => {
    if (status !== "scanning" && status !== "sending") return;

    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [status, refresh]);

  function goBack() {
    if (onBack) {
      onBack();
    } else {
      router.push(listPath);
    }
  }

  async function handleCancel() {
    if (!window.confirm("Are you sure you want to cancel this campaign?")) return;
    setCancelling(true);
    try {
      const result = await cancelCampaign(campaignId);
      if (result && "error" in result) {
        toast.error(result.error as string);
      } else {
        toast.success("Campaign cancelled");
        refresh();
      }
    } catch {
      toast.error("Failed to cancel campaign");
    } finally {
      setCancelling(false);
    }
  }

  // Scanning
  if (status === "scanning") {
    const scanStarted = campaign.scan_started_at
      ? new Date(campaign.scan_started_at as string)
      : new Date(campaign.created_at as string);
    const elapsedMs = Date.now() - scanStarted.getTime();
    const elapsedMin = Math.floor(elapsedMs / 60000);
    const elapsedSec = Math.floor((elapsedMs % 60000) / 1000);
    const timedOut = elapsedMs > 10 * 60 * 1000;

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1 text-sm text-slate hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
          {timedOut ? (
            <>
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-ink mb-2">
                Scan timed out
              </h2>
              <p className="text-sm text-slate">
                The patient scan has been running for over 10 minutes. This
                may indicate an issue with the criteria or data volume. Please
                go back and try again with different filters.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-hilt-blue" />
                </span>
                <h2 className="text-lg font-semibold text-ink">
                  Scanning patients...
                </h2>
              </div>
              <p className="text-sm text-slate">
                Elapsed: {elapsedMin}m {elapsedSec}s
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Ready
  if (status === "ready") {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1 text-sm text-slate hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <CampaignReview
          campaign={{ ...campaign, recipients, credit_cost_preview: creditCostPreview }}
          campaignId={campaignId}
          onStatusChange={refresh}
        />
      </div>
    );
  }

  // Sending
  if (status === "sending") {
    const sent = (campaign.sent_count as number) || 0;
    const failed = (campaign.failed_count as number) || 0;
    const pendingRecipients = recipients.filter((r) => (r as Record<string,unknown>).status === "pending").length;
    const total = sent + failed + pendingRecipients;
    const processed = sent + failed;
    const pct = total > 0 ? Math.round((processed / total) * 100) : 0;

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1 text-sm text-slate hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="rounded-xl border border-gray-100 bg-white p-8">
          <div className="flex items-center gap-2 mb-4">
            <Loader2 className="w-5 h-5 text-hilt-blue animate-spin" />
            <h2 className="text-lg font-semibold text-ink">Sending...</h2>
          </div>

          <p className="text-sm text-slate mb-3">
            {processed} / {total} messages processed
          </p>

          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden mb-4">
            <div
              className="h-full rounded-full bg-hilt-blue transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex gap-4 text-xs text-slate mb-6">
            <span>Sent: {sent}</span>
            {failed > 0 && (
              <span className="text-red-500">Failed: {failed}</span>
            )}
          </div>

          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
          >
            {cancelling ? "Cancelling..." : "Cancel Campaign"}
          </button>
        </div>
      </div>
    );
  }

  // Completed
  if (status === "completed") {
    const sent = (campaign.sent_count as number) || 0;
    const failed = (campaign.failed_count as number) || 0;
    const credits = (campaign.credits_charged as number) || 0;
    const startedAt = campaign.send_started_at
      ? new Date(campaign.send_started_at as string)
      : null;
    const completedAt = campaign.completed_at
      ? new Date(campaign.completed_at as string)
      : null;
    let durationStr = "";
    if (startedAt && completedAt) {
      const durationSec = Math.round(
        (completedAt.getTime() - startedAt.getTime()) / 1000
      );
      durationStr =
        durationSec >= 60
          ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`
          : `${durationSec}s`;
    }

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1 text-sm text-slate hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="rounded-xl border border-gray-100 bg-white p-8">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-ink">
              Campaign Completed
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{sent}</p>
              <p className="text-xs text-green-600">Sent</p>
            </div>
            {failed > 0 && (
              <div className="rounded-lg bg-red-50 p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{failed}</p>
                <p className="text-xs text-red-600">Failed</p>
              </div>
            )}
            <div className="rounded-lg bg-blue-50 p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">
                {credits.toFixed(1)}
              </p>
              <p className="text-xs text-blue-600">Credits charged</p>
            </div>
            {durationStr && (
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <p className="text-2xl font-bold text-ink">{durationStr}</p>
                <p className="text-xs text-ash">Duration</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Failed
  if (status === "failed") {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1 text-sm text-slate hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
          <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-ink mb-2">Scan Failed</h2>
          <p className="text-sm text-slate mb-6">
            The patient scan could not be completed. This may be a temporary
            issue. Please try again with adjusted criteria.
          </p>
          <button
            onClick={goBack}
            className="inline-flex items-center px-5 py-2.5 bg-hilt-blue text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Cancelled (fallback)
  const sent = (campaign.sent_count as number) || 0;
  const credits = (campaign.credits_charged as number) || 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button
        onClick={goBack}
        className="inline-flex items-center gap-1 text-sm text-slate hover:text-ink transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="rounded-xl border border-gray-100 bg-white p-8">
        <div className="flex items-center gap-2 mb-4">
          <XCircle className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-ink">
            Campaign Cancelled
          </h2>
        </div>

        {sent > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-ink">{sent}</p>
              <p className="text-xs text-ash">Sent before cancellation</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-ink">
                {credits.toFixed(1)}
              </p>
              <p className="text-xs text-ash">Credits charged</p>
            </div>
          </div>
        )}
        {sent === 0 && (
          <p className="text-sm text-slate">
            No messages were sent before the campaign was cancelled.
          </p>
        )}
      </div>
    </div>
  );
}
