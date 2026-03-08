"use client";

import { useRouter, useSearchParams } from "next/navigation";
import LocationSettingsForm from "./LocationSettingsForm";
import StaffTable from "./StaffTable";
import QRCodeManager from "./QRCodeManager";

interface LocationData {
  id: string;
  org_id: string;
  name: string;
  address: string | null;
  operating_hours: Record<string, unknown> | null;
  specialty: string | null;
  logo_url: string | null;
  qr_code_url: string | null;
  ai_model: string;
  display_format: string;
  referral_email: string | null;
  tablet_count: number;
  timezone: string;
  created_at: string;
}

interface StaffMember {
  id: string;
  full_name: string;
  username: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  roles: { role: string; location_id: string; location_name: string }[];
}

interface LocationOption {
  id: string;
  name: string;
}

const TABS = [
  { key: "general", label: "General" },
  { key: "staff", label: "Staff" },
  { key: "qr", label: "QR Code" },
];

export default function LocationDetail({
  location,
  staff,
  locations,
}: {
  location: LocationData;
  staff: StaffMember[];
  locations: LocationOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "general";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">{location.name}</h1>
        {location.address && (
          <p className="text-sm text-slate mt-1">{location.address}</p>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-100 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => router.push(`?tab=${tab.key}`)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-hilt-blue text-hilt-blue"
                : "border-transparent text-slate hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "general" && (
        <LocationSettingsForm location={location} />
      )}

      {activeTab === "staff" && (
        <StaffTable
          staff={staff}
          locations={locations}
          preselectedLocationId={location.id}
        />
      )}

      {activeTab === "qr" && (
        <QRCodeManager
          locationId={location.id}
          locationName={location.name}
          logoUrl={location.logo_url}
        />
      )}
    </div>
  );
}
