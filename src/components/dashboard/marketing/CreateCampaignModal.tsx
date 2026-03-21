"use client";

import { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createCampaign } from "@/app/(dashboard)/d/_actions/marketing";
import { MARKETING_SCAN_EXAMPLES } from "@/lib/constants";
import { X } from "lucide-react";
import { toast } from "sonner";

interface CreateCampaignModalProps {
  open: boolean;
  onClose: () => void;
  locations: { id: string; name: string }[];
  onCampaignCreated?: (campaignId: string) => void;
}

export default function CreateCampaignModal({
  open,
  onClose,
  locations,
  onCampaignCreated,
}: CreateCampaignModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname?.startsWith("/d/marketer") ? "/d/marketer" : "/d/owner/marketing";
  const [submitting, setSubmitting] = useState(false);

  // Structured filters
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [sex, setSex] = useState("");
  const [visitedAfter, setVisitedAfter] = useState("");
  const [visitedBefore, setVisitedBefore] = useState("");
  const [visitCountMin, setVisitCountMin] = useState("");
  const [visitCountMax, setVisitCountMax] = useState("");
  const [locationId, setLocationId] = useState("");

  // AI + message
  const [aiCriteria, setAiCriteria] = useState("");
  const [messageBody, setMessageBody] = useState("");

  const placeholder = useMemo(
    () =>
      MARKETING_SCAN_EXAMPLES[
        Math.floor(Math.random() * MARKETING_SCAN_EXAMPLES.length)
      ],
    []
  );

  const hasStructuredFilter =
    ageMin !== "" ||
    ageMax !== "" ||
    sex !== "" ||
    visitedAfter !== "" ||
    visitedBefore !== "" ||
    visitCountMin !== "" ||
    visitCountMax !== "";

  const isValid = hasStructuredFilter || aiCriteria.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    try {
      const filters: Record<string, unknown> = {};
      if (ageMin) filters.min_age = parseInt(ageMin, 10);
      if (ageMax) filters.max_age = parseInt(ageMax, 10);
      if (sex) filters.sex = sex;
      if (visitedAfter) filters.last_visit_after = visitedAfter;
      if (visitedBefore) filters.last_visit_before = visitedBefore;
      if (visitCountMin) filters.min_visits = parseInt(visitCountMin, 10);
      if (visitCountMax) filters.max_visits = parseInt(visitCountMax, 10);

      const result = await createCampaign(
        filters,
        aiCriteria.trim() || undefined,
        locationId || undefined,
      );

      if (result && "error" in result) {
        toast.error(result.error as string);
      } else if (result && "campaign_id" in result) {
        toast.success(result.status === "scanning" ? "Scanning patients..." : "Patients found");
        onClose();
        if (onCampaignCreated) {
          onCampaignCreated(result.campaign_id as string);
        } else {
          router.push(`${basePath}/${result.campaign_id}`);
        }
      } else {
        toast.error("Unexpected response");
      }
    } catch {
      toast.error("Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">New Campaign</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Structured Filters */}
          <div>
            <h3 className="text-sm font-medium text-ink mb-3">
              Patient Filters
            </h3>
            <div className="space-y-3">
              {/* Age range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ash mb-1">
                    Min age
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={ageMin}
                    onChange={(e) => setAgeMin(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 focus:border-hilt-blue"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ash mb-1">
                    Max age
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={ageMax}
                    onChange={(e) => setAgeMax(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 focus:border-hilt-blue"
                    placeholder="120"
                  />
                </div>
              </div>

              {/* Sex */}
              <div>
                <label className="block text-xs text-ash mb-1">Sex</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 focus:border-hilt-blue"
                >
                  <option value="">Any</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Last visit date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ash mb-1">
                    Visited after
                  </label>
                  <input
                    type="date"
                    value={visitedAfter}
                    onChange={(e) => setVisitedAfter(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 focus:border-hilt-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ash mb-1">
                    Visited before
                  </label>
                  <input
                    type="date"
                    value={visitedBefore}
                    onChange={(e) => setVisitedBefore(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 focus:border-hilt-blue"
                  />
                </div>
              </div>

              {/* Visit count */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ash mb-1">
                    Min visits
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={visitCountMin}
                    onChange={(e) => setVisitCountMin(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 focus:border-hilt-blue"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ash mb-1">
                    Max visits
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={visitCountMax}
                    onChange={(e) => setVisitCountMax(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 focus:border-hilt-blue"
                    placeholder="Any"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs text-ash mb-1">Location</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 focus:border-hilt-blue"
            >
              <option value="">All locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* AI Criteria */}
          <div>
            <label className="block text-xs text-ash mb-1">
              AI targeting criteria (optional)
            </label>
            <textarea
              value={aiCriteria}
              onChange={(e) => setAiCriteria(e.target.value)}
              placeholder={placeholder}
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 focus:border-hilt-blue"
            />
            <p className="text-xs text-ash mt-1">
              Describe who you want to reach. Leave empty to use only the
              filters above.
            </p>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs text-ash mb-1">
              Message body (optional, you can set this later)
            </label>
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 focus:border-hilt-blue"
            />
            <p className="text-xs text-ash mt-1">
              Use {"{first_name}"} and {"{clinic_name}"} as variables.
            </p>
          </div>

          {/* Validation hint */}
          {!isValid && (
            <p className="text-xs text-red-500">
              Set at least one patient filter or enter AI criteria.
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="w-full py-2.5 bg-hilt-blue text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Scanning..." : "Find Patients"}
          </button>
        </form>
      </div>
    </div>
  );
}
