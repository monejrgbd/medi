"use client";

import { useState } from "react";
import StatCard from "./StatCard";
import LocationCard from "./LocationCard";
import LocationFormModal from "./LocationFormModal";
import PatientSearch from "./PatientSearch";
import { getPlanLabel, getTrialDaysLeft } from "@/lib/utils";
import { MapPin, Users, CreditCard, ClipboardList } from "lucide-react";

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

  const trialDays = getTrialDaysLeft(overview.org.trial_end_date);
  const creditPercent =
    overview.org.credits_total > 0
      ? Math.round((overview.org.credits_used / overview.org.credits_total) * 100)
      : 0;

  return (
    <div>
      <div className="mb-6">
        <PatientSearch />
      </div>

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

      <LocationFormModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
    </div>
  );
}
