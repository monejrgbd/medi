"use client";

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

