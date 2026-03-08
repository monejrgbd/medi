"use client";

import Link from "next/link";

interface LocationData {
  id: string;
  name: string;
  address?: string;
  specialty?: string;
  logo_url?: string;
  staff_count: number;
  checked_in_count: number;
}

export default function LocationCard({ location }: { location: LocationData }) {
  return (
    <Link
      href={`/d/owner/locations/${location.id}`}
      className="block rounded-xl border border-gray-100 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        {location.logo_url ? (
          <img
            src={location.logo_url}
            alt=""
            className="h-10 w-10 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-lg">
            📍
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-ink truncate">{location.name}</h3>
          {location.address && (
            <p className="text-sm text-slate truncate mt-0.5">{location.address}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        {location.specialty && (
          <span className="inline-block rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
            {location.specialty}
          </span>
        )}
        <span className="text-xs text-slate">
          {location.staff_count} staff
        </span>
        <span className="text-xs text-green-600">
          {location.checked_in_count} checked in
        </span>
      </div>
    </Link>
  );
}
