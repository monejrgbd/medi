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
  operating_hours: Record<string, string> | null;
  specialty: string | null;
  logo_url: string | null;
  qr_code_url: string | null;
  ai_model: string;
  display_format: string;
  referral_email: string | null;
  tablet_count: number;
  timezone: string;
  nurse_enabled?: boolean;
  skip_ai?: boolean;
  ai_custom_instructions?: string | null;
  ai_message_limit?: number | null;
  review_sms_enabled?: boolean;
  diagnostic_enabled?: boolean;
  queue_type?: string;
  raven_api_key?: string | null;
  ask_referral_source?: boolean;
  ask_discovery_source?: boolean;
  queue_display_enabled?: boolean;
  show_doctor_room_to_patients?: boolean;
  preset_rooms?: string[];
  tv_display_mode?: "none" | "alternating" | "batched";
  tv_overlay_position?: "top-left" | "top-right";
  tv_overlay_visible?: boolean;
  tv_queue_duration_seconds?: number;
  tv_audio_muted?: boolean;
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
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="text-lg font-semibold text-ink">{location.name}</p>
        {location.address && (
          <p className="text-sm text-slate mt-0.5">{location.address}</p>
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
          queueDisplayEnabled={location.queue_display_enabled ?? false}
          orgId={location.org_id}
          tvConfig={{
            mode: location.tv_display_mode ?? "none",
            position: location.tv_overlay_position ?? "top-left",
            overlayVisible: location.tv_overlay_visible ?? true,
            queueDurationSeconds: location.tv_queue_duration_seconds ?? 10,
            audioMuted: location.tv_audio_muted ?? true,
          }}
        />
      )}
    </div>
  );
}
