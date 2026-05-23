"use client";

import { useState, useEffect } from "react";
import StatCard from "./StatCard";
import LocationCard from "./LocationCard";
import LocationFormModal from "./LocationFormModal";
import { fetchDiscoveryStats } from "@/app/(dashboard)/d/_actions/analytics";
import { getPlanLabel, getTrialDaysLeft } from "@/lib/utils";
import { MapPin, Users, CreditCard, ClipboardList, Phone, MessageSquare, PhoneForwarded, ListChecks, ExternalLink } from "lucide-react";

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
  location_count: number;
  staff_count: number;
  active_staff_count: number;
}

interface LocationSummary {
  id: string;
  name: string;
  address?: string;
  specialty?: string;
  logo_url?: string;
  staff_count: number;
  checked_in_count: number;
}

export default function OwnerOverview({
  overview,
  locations,
}: {
  overview: OrgOverview;
  locations: LocationSummary[];
}) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [discoveryData, setDiscoveryData] = useState<any>(null);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    fetchDiscoveryStats(null, overview.org.id, thirtyAgo, today)
      .then((d) => { if (d?.success) setDiscoveryData(d); })
      .catch(() => {});
  }, [overview.org.id]);

  const trialDays = getTrialDaysLeft(overview.org.trial_end_date);
  const creditPercent =
    overview.org.credits_total > 0
      ? Math.round((overview.org.credits_used / overview.org.credits_total) * 100)
      : 0;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          label="Locations"
          value={overview.location_count}
          icon={<MapPin className="h-5 w-5 text-hilt-blue" />}
        />
        <StatCard
          label="Staff Members"
          value={overview.staff_count}
          icon={<Users className="h-5 w-5 text-hilt-blue" />}
        />
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate">Credits</p>
            <CreditCard className="h-5 w-5 text-hilt-blue" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">
            {overview.org.credits_used}/{overview.org.credits_total}
          </p>
          <div className="mt-2 h-2 rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-hilt-blue transition-all"
              style={{ width: `${Math.min(creditPercent, 100)}%` }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate">Plan</p>
            <ClipboardList className="h-5 w-5 text-hilt-blue" />
          </div>
          <p className="mt-2 text-lg font-bold text-ink">
            {getPlanLabel(overview.org.subscription_plan)}
          </p>
          {trialDays && (
            <p className="mt-1 text-sm text-amber-600">
              {trialDays} days remaining
            </p>
          )}
        </div>
      </div>

      {discoveryData && discoveryData.total_new_patients > 0 && Object.keys(discoveryData.by_source).length > 0 && (
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5">
          <h3 className="text-sm font-semibold text-ink mb-3">Patient Discovery (last 30 days)</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(discoveryData.by_source as Record<string, number>)
              .sort((a, b) => (b[1] as number) - (a[1] as number))
              .slice(0, 3)
              .map(([source, count]) => (
                <span key={source} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
                  {source}: {count as number}
                </span>
              ))}
            <span className="text-xs text-ash self-center">{discoveryData.total_new_patients} new patients total</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ink">Locations</h2>
        <button
          onClick={() => setAddModalOpen(true)}
          className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-semibold text-white hover:bg-hilt-blue-dark"
        >
          + Add Location
        </button>
      </div>

      {locations.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-ink mb-2">No locations yet</p>
          <p className="text-sm text-slate mb-4">
            Add your first location to get started
          </p>
          <button
            onClick={() => setAddModalOpen(true)}
            className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-semibold text-white hover:bg-hilt-blue-dark"
          >
            Add Location
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <LocationCard key={loc.id} location={loc} />
          ))}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-ink mb-3">Recommended Integrations</h2>
        <div className="grid gap-4 sm:grid-cols-1">
          <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-5">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100">
                <Phone className="h-5 w-5 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-ink">Raven Scheduler</h3>
                  <span className="text-[10px] font-medium text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">AI receptionist</span>
                </div>
                <p className="text-sm text-slate">
                  An AI phone line that books appointments, sends reminders, and recovers no shows. Works directly with Hilt queues, so scheduled patients are prioritized automatically.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-start gap-2">
                <Phone className="h-3.5 w-3.5 text-violet-600 mt-0.5 shrink-0" />
                <span className="text-xs text-slate">24/7 call answering</span>
              </div>
              <div className="flex items-start gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-violet-600 mt-0.5 shrink-0" />
                <span className="text-xs text-slate">SMS automation</span>
              </div>
              <div className="flex items-start gap-2">
                <PhoneForwarded className="h-3.5 w-3.5 text-violet-600 mt-0.5 shrink-0" />
                <span className="text-xs text-slate">No show recovery</span>
              </div>
              <div className="flex items-start gap-2">
                <ListChecks className="h-3.5 w-3.5 text-violet-600 mt-0.5 shrink-0" />
                <span className="text-xs text-slate">Waitlist management</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://ravenscheduler.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 inline-flex items-center gap-1.5"
              >
                Connect Raven
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://ravenscheduler.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-violet-600 hover:text-violet-800 font-medium"
              >
                Learn more at ravenscheduler.com
              </a>
            </div>
          </div>
        </div>
      </div>

      <LocationFormModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
    </div>
  );
}
