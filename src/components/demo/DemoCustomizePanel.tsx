"use client";

import { useState } from "react";
import { Settings, X } from "lucide-react";
import { useDemoFeatures, type DemoFeatures } from "@/contexts/DemoFeatureContext";

const TOGGLES: { key: keyof DemoFeatures; label: string; desc: string; inverted?: boolean }[] = [
  { key: "nurseEnabled", label: "Nurse Triage", desc: "Nurses screen patients before the doctor" },
  { key: "skipAi", label: "AI Intake", desc: "AI screens patients before the doctor. Turn off to skip.", inverted: true },
  { key: "reviewCollection", label: "Review Collection", desc: "Collect patient feedback after visits" },
  { key: "askReferralSource", label: "Referral Tracking", desc: "Ask patients if they were referred by another provider" },
  { key: "askDiscoverySource", label: "Discovery Source", desc: "Ask new patients how they found your clinic" },
  { key: "queueDisplayEnabled", label: "Queue Display", desc: "Show queue numbers and waiting room TV preview" },
];

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-hilt-blue focus:ring-offset-2 ${
        checked ? "bg-hilt-blue" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function ToggleList() {
  const { features, setFeature } = useDemoFeatures();

  return (
    <div className="space-y-4">
      {TOGGLES.map(({ key, label, desc, inverted }) => (
        <div key={key} className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">{label}</p>
            <p className="text-xs text-slate mt-0.5">{desc}</p>
          </div>
          <ToggleSwitch
            checked={inverted ? !features[key] : features[key]}
            onChange={(val) => setFeature(key, inverted ? !val : val)}
          />
        </div>
      ))}
    </div>
  );
}

/** Full screen intro card shown before the demo starts. */
export function DemoIntroCard() {
  const { markCustomized } = useDemoFeatures();

  return (
    <div className="min-h-screen bg-snow flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl p-6">
        <h2 className="text-xl font-bold text-ink text-center">Customize Your Demo</h2>
        <p className="text-sm text-slate text-center mt-2 mb-6">
          Toggle the features you want to see. You can change these at any time during the demo using the gear button.
        </p>

        <ToggleList />

        <button
          onClick={markCustomized}
          className="mt-8 w-full rounded-lg bg-hilt-blue px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Start Demo
        </button>
      </div>
    </div>
  );
}

/** Gear button + slide out panel shown during the demo. */
export function DemoGearButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Gear button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-lg hover:bg-gray-50 transition-colors"
        aria-label="Customize demo features"
      >
        <Settings className="h-5 w-5 text-slate" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/20"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide out panel */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-80 max-w-[90vw] bg-white shadow-2xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-ink">Demo Features</h3>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close panel"
          >
            <X className="h-4 w-4 text-slate" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-52px)]">
          <ToggleList />
          <p className="mt-6 text-xs text-ash text-center">
            Changes apply immediately. Some features only affect new visits.
          </p>
        </div>
      </div>
    </>
  );
}
