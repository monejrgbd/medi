"use client";

import { useState, useEffect } from "react";
import {
  fetchReviewPlatforms,
  saveReviewPlatforms,
  saveReviewCycle,
} from "@/app/(dashboard)/d/_actions/reviews";
import { REVIEW_PLATFORMS } from "@/lib/constants";

interface Platform {
  platform_name: string;
  platform_url: string;
}

interface ReviewPlatformConfigProps {
  locationId: string;
}

export default function ReviewPlatformConfig({
  locationId,
}: ReviewPlatformConfigProps) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [cycleDays, setCycleDays] = useState(7);
  const [currentPlatformId, setCurrentPlatformId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const result = await fetchReviewPlatforms(locationId);
      setLoading(false);

      if (result?.success) {
        const existingPlatforms = (result.platforms || []).map(
          (p: { platform_name: string; platform_url: string }) => ({
            platform_name: p.platform_name,
            platform_url: p.platform_url,
          })
        );
        setPlatforms(existingPlatforms);

        if (result.rotation) {
          setCycleDays(result.rotation.cycle_days || 7);
          setCurrentPlatformId(result.rotation.current_platform_id || null);
        }
      }
    })();
  }, [locationId]);

  function addPlatform() {
    setPlatforms((prev) => [
      ...prev,
      { platform_name: "", platform_url: "" },
    ]);
  }

  function removePlatform(index: number) {
    setPlatforms((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePlatform(index: number, field: keyof Platform, value: string) {
    setPlatforms((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  async function handleSave() {
    setError("");
    setSuccess("");

    // Filter out empty rows
    const validPlatforms = platforms.filter(
      (p) => p.platform_name && p.platform_url
    );

    // Validate
    for (const p of validPlatforms) {
      if (!p.platform_url.startsWith("https://")) {
        setError("All platform URLs must start with https://");
        return;
      }
    }

    setSaving(true);

    const result = await saveReviewPlatforms(locationId, validPlatforms);

    if (!result?.success) {
      setError(result?.error || "Failed to save platforms");
      setSaving(false);
      return;
    }

    // Save cycle days
    const cycleResult = await saveReviewCycle(locationId, cycleDays);
    setSaving(false);

    if (!cycleResult?.success && cycleResult?.error !== "No review rotation configured. Add platforms first.") {
      setError(cycleResult?.error || "Failed to save cycle");
      return;
    }

    // Refresh data from server after save
    const refreshed = await fetchReviewPlatforms(locationId);
    if (refreshed?.success) {
      const existingPlatforms = (refreshed.platforms || []).map(
        (p: { platform_name: string; platform_url: string }) => ({
          platform_name: p.platform_name,
          platform_url: p.platform_url,
        })
      );
      setPlatforms(existingPlatforms);
      if (refreshed.rotation) {
        setCycleDays(refreshed.rotation.cycle_days || 7);
        setCurrentPlatformId(refreshed.rotation.current_platform_id || null);
      }
    }

    setSuccess("Platforms saved successfully");
    setTimeout(() => setSuccess(""), 3000);
  }

  // Available platforms not yet added
  const usedNames = new Set(platforms.map((p) => p.platform_name));

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Review Platforms
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Configure where 5-star reviewers are directed. Platforms rotate
        automatically.
      </p>

      <div className="space-y-3 mb-4">
        {platforms.map((platform, index) => (
          <div key={index} className="flex gap-2 items-start">
            <select
              value={platform.platform_name}
              onChange={(e) =>
                updatePlatform(index, "platform_name", e.target.value)
              }
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none w-40"
            >
              <option value="">Select...</option>
              {REVIEW_PLATFORMS.map((name) => (
                <option
                  key={name}
                  value={name}
                  disabled={usedNames.has(name) && platform.platform_name !== name}
                >
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </option>
              ))}
            </select>
            <input
              type="url"
              value={platform.platform_url}
              onChange={(e) =>
                updatePlatform(index, "platform_url", e.target.value)
              }
              placeholder="https://..."
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={() => removePlatform(index)}
              className="shrink-0 rounded-lg p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addPlatform}
        className="text-sm text-blue-600 font-medium hover:text-blue-700 mb-6"
      >
        + Add platform
      </button>

      {/* Rotation cycle */}
      <div className="border-t border-gray-100 pt-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rotation cycle (days)
        </label>
        <p className="text-xs text-gray-500 mb-2">
          How often to rotate which platform gets the 5-star redirect.
        </p>
        <input
          type="number"
          value={cycleDays}
          onChange={(e) =>
            setCycleDays(Math.max(1, Math.min(90, parseInt(e.target.value) || 7)))
          }
          min={1}
          max={90}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-24 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-3">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-600 mb-3">{success}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving..." : "Save Platforms"}
      </button>
    </div>
  );
}
