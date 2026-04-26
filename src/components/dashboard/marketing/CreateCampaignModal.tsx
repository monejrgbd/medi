"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createCampaign } from "@/app/(dashboard)/d/_actions/marketing";
import { MARKETING_SCAN_EXAMPLES } from "@/lib/constants";
import { X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { DateInput } from "@/components/ui/DateInput";

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

  // AI criteria
  const [aiCriteria, setAiCriteria] = useState("");

  // Live patient count preview
  const [patientCount, setPatientCount] = useState<number | null>(null);
  const [scanCredits, setScanCredits] = useState<number>(0);
  const [countLoading, setCountLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const buildFilters = useCallback(() => {
    const filters: Record<string, unknown> = {};
    if (ageMin) filters.min_age = parseInt(ageMin, 10);
    if (ageMax) filters.max_age = parseInt(ageMax, 10);
    if (sex) filters.sex = sex;
    if (visitedAfter) filters.last_visit_after = visitedAfter;
    if (visitedBefore) filters.last_visit_before = visitedBefore;
    if (visitCountMin) filters.min_visits = parseInt(visitCountMin, 10);
    if (visitCountMax) filters.max_visits = parseInt(visitCountMax, 10);
    return filters;
  }, [ageMin, ageMax, sex, visitedAfter, visitedBefore, visitCountMin, visitCountMax]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCountLoading(true);
      try {
        const supabase = createClient();
        const filters = buildFilters();
        const { data } = await supabase.rpc("get_campaign_patient_count", {
          p_structured_filters: Object.keys(filters).length > 0 ? filters : null,
          p_location_id: locationId || null,
        });
        if (data?.success) {
          setPatientCount(data.count);
          setScanCredits(data.scan_credits);
        }
      } catch {
        // ignore
      } finally {
        setCountLoading(false);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [open, ageMin, ageMax, sex, visitedAfter, visitedBefore, visitCountMin, visitCountMax, locationId, buildFilters]);

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
      const filters = buildFilters();

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

  const inputClass = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 focus:border-hilt-blue";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-ink">New Campaign</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-slate" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Location — top-level scope choice */}
          {locations.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">Location</label>
              <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className={inputClass}>
                <option value="">All locations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Demographics section */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-ash uppercase tracking-wider">Demographics</legend>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-ash mb-1">Min age</label>
                <input type="number" min={0} max={120} value={ageMin} onChange={(e) => setAgeMin(e.target.value)} className={inputClass} placeholder="Any" />
              </div>
              <div>
                <label className="block text-[11px] text-ash mb-1">Max age</label>
                <input type="number" min={0} max={120} value={ageMax} onChange={(e) => setAgeMax(e.target.value)} className={inputClass} placeholder="Any" />
              </div>
              <div>
                <label className="block text-[11px] text-ash mb-1">Sex</label>
                <select value={sex} onChange={(e) => setSex(e.target.value)} className={inputClass}>
                  <option value="">Any</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
          </fieldset>

          {/* Visit history section */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-ash uppercase tracking-wider">Visit History</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-ash mb-1">Visited after</label>
                <DateInput value={visitedAfter} onChange={(e) => setVisitedAfter(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-[11px] text-ash mb-1">Visited before</label>
                <DateInput value={visitedBefore} onChange={(e) => setVisitedBefore(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-ash mb-1">Min visits</label>
                <input type="number" min={0} value={visitCountMin} onChange={(e) => setVisitCountMin(e.target.value)} className={inputClass} placeholder="Any" />
              </div>
              <div>
                <label className="block text-[11px] text-ash mb-1">Max visits</label>
                <input type="number" min={0} value={visitCountMax} onChange={(e) => setVisitCountMax(e.target.value)} className={inputClass} placeholder="Any" />
              </div>
            </div>
          </fieldset>

          {/* AI criteria section — visually distinct */}
          <fieldset>
            <legend className="text-xs font-semibold text-ash uppercase tracking-wider mb-2">AI Search</legend>
            <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-hilt-blue" />
                <span className="text-xs font-medium text-hilt-blue">Describe who you want to reach</span>
              </div>
              <textarea
                value={aiCriteria}
                onChange={(e) => setAiCriteria(e.target.value)}
                placeholder={placeholder}
                rows={2}
                maxLength={500}
                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 focus:border-hilt-blue"
              />
              <p className="text-[11px] text-ash mt-1.5">
                AI scans visit summaries, diagnoses, medications, and conditions. Leave empty to use only the filters above (free, instant).
              </p>
              {patientCount !== null && (
                <div className="mt-2 rounded-lg bg-white border border-blue-100 px-3 py-2 text-xs">
                  <span className="text-ink font-medium">
                    {countLoading ? "Counting..." : `${patientCount.toLocaleString()} patients`}
                  </span>
                  <span className="text-ash"> match your filters</span>
                  {aiCriteria.trim() ? (
                    <span className="text-blue-600 font-medium"> · {scanCredits} credit{scanCredits === 1 ? "" : "s"} for AI scan</span>
                  ) : (
                    <span className="text-green-600 font-medium"> · free (no AI)</span>
                  )}
                </div>
              )}
            </div>
          </fieldset>

          {/* Validation hint */}
          {!isValid && (
            <p className="text-xs text-red-500">
              Set at least one filter or enter AI criteria.
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="w-full py-2.5 bg-hilt-blue text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Scanning..." : aiCriteria.trim() ? "Scan with AI" : "Find Patients"}
          </button>
        </form>
      </div>
    </div>
  );
}
