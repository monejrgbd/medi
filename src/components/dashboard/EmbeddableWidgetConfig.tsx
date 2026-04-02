"use client";

import { useState } from "react";
import { toast } from "sonner";

interface EmbeddableWidgetConfigProps {
  locations: { id: string; name: string }[];
  subscriptionPlan: string;
}

export default function EmbeddableWidgetConfig({
  locations,
  subscriptionPlan,
}: EmbeddableWidgetConfigProps) {
  const [selectedLocation, setSelectedLocation] = useState(
    locations[0]?.id || ""
  );

  if (subscriptionPlan !== "business" && subscriptionPlan !== "enterprise") {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6 text-center">
        <h2 className="text-lg font-semibold text-ink mb-2">Embeddable Check in Widget</h2>
        <p className="text-sm text-slate mb-4">Embed your check in form directly on your clinic website. Available on the Business plan.</p>
        <a href="/d/owner/billing" className="inline-block rounded-lg bg-hilt-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">Upgrade Plan</a>
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hilthealth.com";
  const iframeCode = `<iframe src="${baseUrl}/checkin/${selectedLocation}?embed=true" width="100%" height="600" style="border:none;border-radius:12px;" allow="microphone"></iframe>`;

  function handleCopy() {
    navigator.clipboard.writeText(iframeCode);
    toast.success("Embed code copied!");
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6">
      <h2 className="text-lg font-semibold text-ink mb-4">
        Embeddable Check in Widget
      </h2>

      {locations.length > 1 && (
        <div className="mb-4">
          <label htmlFor="embed-location" className="block text-sm font-medium text-ink mb-1">
            Location
          </label>
          <select
            id="embed-location"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-ink mb-1">
          Embed Code
        </label>
        <div className="relative">
          <pre className="rounded-lg bg-gray-50 p-3 text-xs text-slate overflow-x-auto">
            {iframeCode}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 rounded-md bg-white border border-gray-200 px-2 py-1 text-xs text-ink hover:bg-gray-50 transition-colors"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Live preview */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-ink">Preview</h3>
          <a
            href={`/checkin/${selectedLocation}?embed=true`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-hilt-blue hover:underline"
          >
            Open in new tab &rarr;
          </a>
        </div>
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
          <iframe
            src={`/checkin/${selectedLocation}?embed=true`}
            width="100%"
            height="600"
            style={{ border: "none" }}
            title="Check-in widget preview"
          />
        </div>
      </div>
    </div>
  );
}
