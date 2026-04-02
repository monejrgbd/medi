"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRole } from "@/contexts/RoleContext";
import {
  updateCampaignMessage,
  excludeRecipient,
  sendCampaign,
  cancelCampaign,
} from "@/app/(dashboard)/d/_actions/marketing";
import { MARKETING_SMS_CREDIT_COST } from "@/lib/constants";
import { toast } from "sonner";

interface Recipient {
  id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  match_reason: string | null;
  excluded: boolean;
}

interface CampaignReviewProps {
  campaign: Record<string, unknown>;
  campaignId: string;
  onStatusChange: () => void;
}

const OPT_OUT_FOOTER = "\nReply STOP to opt out";

export default function CampaignReview({
  campaign,
  campaignId,
  onStatusChange,
}: CampaignReviewProps) {
  const { org } = useRole();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const recipients = (campaign.recipients as Recipient[]) || [];
  const scannedCount = (campaign.total_scanned as number) || 0;
  const matchedCount = (campaign.matched_count as number) || 0;

  const [messageBody, setMessageBody] = useState(
    (campaign.message_body as string) || ""
  );
  const [excludedIds, setExcludedIds] = useState<Set<string>>(
    new Set(recipients.filter((r) => r.excluded).map((r) => r.id))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);
  const [cancellingCampaign, setCancellingCampaign] = useState(false);
  const [togglingExclude, setTogglingExclude] = useState<string | null>(null);
  const initialMessageRef = useRef(messageBody);

  // Debounced auto-save: wait 800ms after typing stops
  useEffect(() => {
    // Skip auto-save if message is unchanged from initial or empty
    if (!messageBody.trim() || messageBody === initialMessageRef.current) return;

    setSaved(false);
    const timer = setTimeout(() => {
      handleSaveMessage();
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageBody]);

  const isPAyG = org?.subscription_plan === "pay_as_you_go";
  const isTrial = org?.subscription_plan?.includes("trial");
  const isCreditsMode = isPAyG || isTrial;
  const budgetLabel = isCreditsMode ? "credits" : "from marketing budget";

  const activeCount = recipients.filter((r) => !excludedIds.has(r.id)).length;
  const creditsCost = activeCount * MARKETING_SMS_CREDIT_COST;

  // Character counting
  const fullMessage = messageBody + OPT_OUT_FOOTER;
  const footerLen = OPT_OUT_FOOTER.length;
  const totalLen = fullMessage.length;
  const segments = Math.ceil(totalLen / 160) || 1;

  // Preview with variable substitution
  const previewMessage =
    messageBody
      .replace(/\{first_name\}/g, "Sarah")
      .replace(/\{clinic_name\}/g, org.name) + OPT_OUT_FOOTER;

  function insertVariable(variable: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = messageBody.slice(0, start);
    const after = messageBody.slice(end);
    const newValue = before + variable + after;
    setMessageBody(newValue);

    // Restore cursor after the inserted variable
    requestAnimationFrame(() => {
      textarea.focus();
      const pos = start + variable.length;
      textarea.setSelectionRange(pos, pos);
    });
  }

  const handleExclude = useCallback(
    async (recipientId: string, excluded: boolean) => {
      setTogglingExclude(recipientId);
      try {
        const result = await excludeRecipient(campaignId, recipientId, excluded);
        if (result && "error" in result) {
          toast.error(result.error as string);
        } else {
          setExcludedIds((prev) => {
            const next = new Set(prev);
            if (excluded) {
              next.add(recipientId);
            } else {
              next.delete(recipientId);
            }
            return next;
          });
        }
      } catch {
        toast.error("Failed to update recipient");
      } finally {
        setTogglingExclude(null);
      }
    },
    [campaignId]
  );

  async function handleSaveMessage() {
    if (!messageBody.trim()) {
      toast.error("Message body cannot be empty");
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      const result = await updateCampaignMessage(campaignId, messageBody.trim());
      if (result && "error" in result) {
        toast.error(result.error as string);
      } else {
        initialMessageRef.current = messageBody;
        setSaved(true);
      }
    } catch {
      toast.error("Failed to save message");
    } finally {
      setSaving(false);
    }
  }

  async function handleSend() {
    if (!messageBody.trim()) {
      toast.error("Please write a message before sending");
      return;
    }
    if (activeCount === 0) {
      toast.error("No recipients to send to");
      return;
    }

    const costLabel = isCreditsMode
      ? `This will use ${creditsCost.toFixed(1)} credits.`
      : `This will use ${activeCount} SMS from your marketing budget.`;
    const confirmed = window.confirm(
      `Send this campaign to ${activeCount} patient${activeCount !== 1 ? "s" : ""}? ${costLabel}`
    );
    if (!confirmed) return;

    setSending(true);
    try {
      const result = await sendCampaign(campaignId);
      if (result && "error" in result) {
        toast.error(result.error as string);
      } else {
        toast.success("Campaign is sending");
        onStatusChange();
      }
    } catch {
      toast.error("Failed to send campaign");
    } finally {
      setSending(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm("Cancel this campaign? It has not been sent yet.")) return;
    setCancellingCampaign(true);
    try {
      const result = await cancelCampaign(campaignId);
      if (result && "error" in result) {
        toast.error(result.error as string);
      } else {
        toast.success("Campaign cancelled");
        onStatusChange();
      }
    } catch {
      toast.error("Failed to cancel campaign");
    } finally {
      setCancellingCampaign(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <h2 className="text-lg font-semibold text-ink mb-2">Scan Results</h2>
        <p className="text-sm text-slate">
          <span className="font-semibold text-ink">{matchedCount}</span>{" "}
          patients matched out of{" "}
          <span className="font-medium">{scannedCount}</span> scanned
        </p>
      </div>

      {/* Patient list */}
      <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-medium text-ink">
            Matched Patients ({recipients.length})
          </h3>
          <span className="text-xs text-ash">{activeCount} will receive SMS</span>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {/* Mobile: card layout */}
          <div className="sm:hidden divide-y divide-gray-50">
            {recipients.map((r) => {
              const isExcluded = excludedIds.has(r.id);
              return (
                <div key={r.id} className={`px-4 py-3 ${isExcluded ? "opacity-50 bg-gray-50/50" : ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-ink">{r.first_name} {r.last_name}</span>
                    <label className="flex items-center gap-1.5 text-xs text-ash">
                      <input
                        type="checkbox"
                        checked={isExcluded}
                        disabled={togglingExclude === r.id}
                        onChange={(e) => handleExclude(r.id, e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue/20"
                      />
                      Exclude
                    </label>
                  </div>
                  <p className="text-xs text-slate">{r.phone}</p>
                  {r.match_reason && <p className="text-xs text-ash mt-1">{r.match_reason}</p>}
                </div>
              );
            })}
          </div>
          {/* Desktop: table layout */}
          <table className="hidden sm:table w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-100">
                <th className="text-left py-2.5 px-4 text-xs font-medium text-ash uppercase tracking-wide">Name</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-ash uppercase tracking-wide">Phone</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-ash uppercase tracking-wide">Match Reason</th>
                <th className="text-center py-2.5 px-4 text-xs font-medium text-ash uppercase tracking-wide">Exclude</th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((r) => {
                const isExcluded = excludedIds.has(r.id);
                return (
                  <tr key={r.id} className={`border-b border-gray-50 ${isExcluded ? "opacity-50" : ""}`}>
                    <td className="py-2.5 px-4 text-ink">{r.first_name} {r.last_name}</td>
                    <td className="py-2.5 px-4 text-slate">{r.phone}</td>
                    <td className="py-2.5 px-4 text-slate text-xs">{r.match_reason || "\u2014"}</td>
                    <td className="py-2.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isExcluded}
                        disabled={togglingExclude === r.id}
                        onChange={(e) => handleExclude(r.id, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue/20"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {recipients.length === 0 && (
            <p className="py-8 text-center text-sm text-slate">No recipients found.</p>
          )}
        </div>
      </div>

      {/* Message composer */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 space-y-4">
        <h3 className="text-sm font-medium text-ink">Message</h3>

        <div>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => insertVariable("{first_name}")}
              className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-slate hover:border-hilt-blue hover:text-hilt-blue transition-colors"
            >
              {"{first_name}"}
            </button>
            <button
              type="button"
              onClick={() => insertVariable("{clinic_name}")}
              className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-slate hover:border-hilt-blue hover:text-hilt-blue transition-colors"
            >
              {"{clinic_name}"}
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            rows={4}
            maxLength={500}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 focus:border-hilt-blue"
            placeholder="Hi {first_name}, this is a message from {clinic_name}..."
          />

          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-ash">
              {messageBody.length} + {footerLen} footer = {totalLen}/160 ({segments}{" "}
              {segments === 1 ? "segment" : "segments"})
            </p>
            <span className="text-xs text-ash">
              {saving ? "Saving..." : saved ? "Saved" : ""}
            </span>
          </div>
        </div>

        {/* Preview */}
        {messageBody.trim() && (
          <div>
            <p className="text-xs text-ash mb-1.5">Preview</p>
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
              <p className="text-sm text-ink whitespace-pre-wrap">
                {previewMessage}
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-amber-600">
          Do not include specific health information in the message. SMS is
          not encrypted.
        </p>
      </div>

      {/* Send section */}
      <div className="rounded-xl border border-gray-100 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ink font-medium">
              Send to {activeCount} patient{activeCount !== 1 ? "s" : ""}{isCreditsMode ? ` (${creditsCost.toFixed(1)} credits)` : ""}
            </p>
            <p className="text-xs text-ash mt-0.5">
              {isCreditsMode
                ? `${MARKETING_SMS_CREDIT_COST} credits per SMS`
                : `${activeCount} SMS ${budgetLabel}`}
            </p>
          </div>
          <button
            onClick={handleSend}
            disabled={sending || !messageBody.trim() || activeCount === 0}
            className="px-6 py-2.5 bg-hilt-blue text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Sending..." : "Send Campaign"}
          </button>
        </div>
      </div>

      {/* Cancel */}
      <div className="text-center">
        <button
          onClick={handleCancel}
          disabled={cancellingCampaign}
          className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
        >
          {cancellingCampaign ? "Cancelling..." : "Cancel Campaign"}
        </button>
      </div>
    </div>
  );
}
