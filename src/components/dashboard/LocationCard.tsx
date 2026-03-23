"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Upload, Loader2 } from "lucide-react";
import { uploadLocationLogo } from "@/app/(dashboard)/d/_actions/locations";

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
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", file);

      const result = await uploadLocationLogo(location.id, fd);

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || "Upload failed");
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white transition-all hover:border-gray-300 hover:shadow-sm">
      <Link
        href={`/d/owner/locations/${location.id}`}
        className="block p-5"
      >
        <div className="flex items-start gap-3">
          {location.logo_url ? (
            <img
              src={location.logo_url}
              alt=""
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <MapPin className="h-5 w-5 text-hilt-blue" />
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

      {!location.logo_url && (
        <div className="border-t border-gray-100 px-5 py-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs font-medium text-hilt-blue hover:text-hilt-blue-dark disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {uploading ? "Uploading..." : "Upload Logo"}
          </button>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
