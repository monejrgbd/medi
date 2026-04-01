"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { fetchPatientHistory } from "@/app/(dashboard)/d/_actions/doctor";
import {
  createReferral,
  searchLocations,
} from "@/app/(dashboard)/d/_actions/referral";
import { ALLOWED_SPECIALTIES } from "@/lib/constants";
import { toast } from "sonner";

interface HistoryVisit {
  visit_id: string;
  date: string;
  location_name: string;
  summary: string | null;
  diagnosis: string | null;
  doctor_name: string | null;
  status: string;
}

interface LocationResult {
  location_id: string;
  location_name: string;
  org_name: string;
  address: string | null;
}

interface ReferralFormProps {
  visitId: string;
  patientId: string;
  onClose: () => void;
  onComplete: () => void;
}

export default function ReferralForm({
  visitId,
  patientId,
  onClose,
  onComplete,
}: ReferralFormProps) {
  // Form state
  const [specialty, setSpecialty] = useState("");
  const [selectedVisitIds, setSelectedVisitIds] = useState<Set<string>>(
    new Set([visitId])
  );
  const [referralNote, setReferralNote] = useState("");
  const [destinationType, setDestinationType] = useState<"clinic" | "email">(
    "clinic"
  );
  const [selectedLocation, setSelectedLocation] =
    useState<LocationResult | null>(null);
  const [externalEmail, setExternalEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Past visits
  const [pastVisits, setPastVisits] = useState<HistoryVisit[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(true);

  // Location search
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPending, startTransition] = useTransition();

  // Load past visits on mount
  useEffect(() => {
    (async () => {
      const result = await fetchPatientHistory(patientId);
      if (result.success) {
        setPastVisits(result.visits ?? []);
      }
      setVisitsLoading(false);
    })();
  }, [patientId]);

  // Debounced location search
  const handleLocationSearch = useCallback(
    (query: string) => {
      setLocationQuery(query);
      setSelectedLocation(null);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (query.trim().length < 2) {
        setLocationResults([]);
        setLocationSearching(false);
        return;
      }

      setLocationSearching(true);
      debounceRef.current = setTimeout(async () => {
        const result = await searchLocations(query.trim());
        if (result.success) {
          setLocationResults(result.locations ?? []);
        } else {
          setLocationResults([]);
        }
        setLocationSearching(false);
      }, 300);
    },
    []
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function toggleVisit(vid: string) {
    setSelectedVisitIds((prev) => {
      const next = new Set(prev);
      if (next.has(vid)) {
        next.delete(vid);
      } else {
        next.add(vid);
      }
      return next;
    });
  }

  function handleSubmit() {
    if (!specialty) {
      setError("Please select a specialty");
      return;
    }
    if (selectedVisitIds.size === 0) {
      setError("At least one visit must be included");
      return;
    }
    if (!referralNote.trim()) {
      setError("Referral note is required");
      return;
    }
    if (destinationType === "clinic" && !selectedLocation) {
      setError("Please select a destination clinic");
      return;
    }
    if (destinationType === "email") {
      const emailTrimmed = externalEmail.trim().toLowerCase();
      if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
        setError("Please enter a valid email address");
        return;
      }
    }

    setError(null);
    startTransition(async () => {
      const result = await createReferral(
        patientId,
        specialty,
        referralNote.trim(),
        Array.from(selectedVisitIds),
        {
          toLocationId:
            destinationType === "clinic"
              ? selectedLocation?.location_id
              : undefined,
          toEmail:
            destinationType === "email"
              ? externalEmail.trim().toLowerCase()
              : undefined,
        }
      );

      if (result.success) {
        toast.success("Referral sent successfully");
        onComplete();
      } else {
        toast.error(result.error || "Failed to send referral");
        setError(result.error || "Failed to send referral");
      }
    });
  }

  const emailValid =
    externalEmail.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(externalEmail.trim());

  const canSubmit =
    !!specialty &&
    selectedVisitIds.size > 0 &&
    !!referralNote.trim() &&
    (destinationType === "clinic" ? !!selectedLocation : emailValid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-ink mb-4">Send Referral</h2>

        {/* 1. Specialty Picker */}
        <div className="mb-4">
          <label className="text-xs font-medium text-slate mb-1 block">
            Specialty
          </label>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink focus:border-hilt-blue focus:outline-none bg-white"
          >
            <option value="">Select a specialty...</option>
            {ALLOWED_SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Visit Selector */}
        <div className="mb-4">
          <label className="text-xs font-medium text-slate mb-1 block">
            Include Visits
          </label>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
            {/* Current visit - always first, pre-checked */}
            <label className="flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selectedVisitIds.has(visitId)}
                onChange={() => toggleVisit(visitId)}
                className="mt-0.5 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">
                  Current visit
                </p>
              </div>
            </label>

            {visitsLoading ? (
              <div className="px-3 py-2 text-xs text-slate">
                Loading past visits...
              </div>
            ) : (
              pastVisits
                .filter((v) => v.visit_id !== visitId)
                .map((v) => (
                  <label
                    key={v.visit_id}
                    className="flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedVisitIds.has(v.visit_id)}
                      onChange={() => toggleVisit(v.visit_id)}
                      className="mt-0.5 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">
                        {new Date(v.date).toLocaleDateString()} &mdash;{" "}
                        {v.summary
                          ? v.summary.length > 80
                            ? v.summary.slice(0, 80) + "..."
                            : v.summary
                          : v.diagnosis
                            ? v.diagnosis.length > 80
                              ? v.diagnosis.slice(0, 80) + "..."
                              : v.diagnosis
                            : "No summary"}
                      </p>
                    </div>
                  </label>
                ))
            )}
          </div>
        </div>

        {/* 3. Referral Note */}
        <div className="mb-4">
          <label className="text-xs font-medium text-slate mb-1 block">
            Referral Note
          </label>
          <textarea
            value={referralNote}
            onChange={(e) => setReferralNote(e.target.value.slice(0, 5000))}
            placeholder="Describe why you are referring this patient..."
            rows={5}
            maxLength={5000}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none resize-y"
          />
          <p className="mt-0.5 text-right text-[10px] text-ash">
            {referralNote.length.toLocaleString()} / 5,000
          </p>
        </div>

        {/* 4. Destination */}
        <div className="mb-4">
          <label className="text-xs font-medium text-slate mb-2 block">
            Destination
          </label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                setDestinationType("clinic");
                setExternalEmail("");
              }}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                destinationType === "clinic"
                  ? "bg-hilt-blue text-white"
                  : "bg-gray-100 text-slate hover:bg-gray-200"
              }`}
            >
              Hilt Clinic
            </button>
            <button
              type="button"
              onClick={() => {
                setDestinationType("email");
                setSelectedLocation(null);
                setLocationQuery("");
                setLocationResults([]);
              }}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                destinationType === "email"
                  ? "bg-hilt-blue text-white"
                  : "bg-gray-100 text-slate hover:bg-gray-200"
              }`}
            >
              Email
            </button>
          </div>

          {destinationType === "clinic" ? (
            <div>
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => handleLocationSearch(e.target.value)}
                placeholder="Search clinic name or address..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none"
              />

              {locationSearching && (
                <p className="mt-2 text-xs text-slate">Searching...</p>
              )}

              {!locationSearching &&
                locationResults.length > 0 &&
                !selectedLocation && (
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                    {locationResults.map((loc) => (
                      <button
                        key={loc.location_id}
                        type="button"
                        onClick={() => {
                          setSelectedLocation(loc);
                          setLocationQuery(loc.location_name);
                          setLocationResults([]);
                        }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left hover:border-hilt-blue hover:bg-blue-50 transition-colors"
                      >
                        <p className="text-sm font-medium text-ink">
                          {loc.location_name}
                        </p>
                        <p className="text-xs text-slate">
                          {loc.org_name}
                          {loc.address ? ` — ${loc.address}` : ""}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

              {!locationSearching &&
                locationQuery.trim().length >= 2 &&
                locationResults.length === 0 &&
                !selectedLocation && (
                  <p className="mt-2 text-xs text-ash">No clinics found.</p>
                )}

              {selectedLocation && (
                <div className="mt-2 rounded-lg border-2 border-hilt-blue bg-blue-50 px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {selectedLocation.location_name}
                    </p>
                    <p className="text-xs text-slate">
                      {selectedLocation.org_name}
                      {selectedLocation.address
                        ? ` — ${selectedLocation.address}`
                        : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLocation(null);
                      setLocationQuery("");
                    }}
                    className="ml-2 text-xs text-slate hover:text-ink"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          ) : (
            <input
              type="email"
              value={externalEmail}
              onChange={(e) => setExternalEmail(e.target.value)}
              placeholder="recipient@example.com"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-ink placeholder:text-ash focus:outline-none ${
                externalEmail.trim() && !emailValid
                  ? "border-red-300 focus:border-red-400"
                  : "border-gray-200 focus:border-hilt-blue"
              }`}
            />
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="mb-3 text-xs text-red-600">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-slate hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !canSubmit}
            className="flex-1 rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Sending..." : "Send Referral"}
          </button>
        </div>
      </div>
    </div>
  );
}
