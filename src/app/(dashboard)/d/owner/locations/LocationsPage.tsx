"use client";

import { useState } from "react";
import LocationCard from "@/components/dashboard/LocationCard";
import LocationFormModal from "@/components/dashboard/LocationFormModal";

interface LocationSummary {
  id: string;
  name: string;
  address?: string;
  specialty?: string;
  logo_url?: string;
  staff_count: number;
  checked_in_count: number;
}

export default function LocationsPage({
  locations,
}: {
  locations: LocationSummary[];
}) {
  const [addModalOpen, setAddModalOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-end mb-6">
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
