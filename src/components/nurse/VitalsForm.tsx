"use client";

import { useState, useEffect, useTransition } from "react";
import { recordVitals, fetchOrgVitalConfigs } from "@/app/(dashboard)/d/_actions/nurse";

interface VitalConfig {
  id: string;
  name: string;
  unit: string;
  min_value: number | null;
  max_value: number | null;
  step_value: number | null;
  display_order: number;
}

interface VitalsFormProps {
  patientId: string;
  visitId: string;
  onRecorded: () => void;
}

export default function VitalsForm({ patientId, visitId, onRecorded }: VitalsFormProps) {
  const [configs, setConfigs] = useState<VitalConfig[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loadingConfigs, setLoadingConfigs] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadConfigs() {
      setLoadingConfigs(true);
      const result = await fetchOrgVitalConfigs();
      if (result.success && result.configs) {
        const sorted = [...result.configs].sort(
          (a: VitalConfig, b: VitalConfig) => a.display_order - b.display_order
        );
        setConfigs(sorted);
      }
      setLoadingConfigs(false);
    }
    loadConfigs();
  }, []);

  function handleValueChange(configId: string, val: string) {
    setValues((prev) => ({ ...prev, [configId]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const readings: Array<{ vitalConfigId: string; value: number }> = [];
    for (const config of configs) {
      const raw = values[config.id];
      if (raw !== undefined && raw !== "") {
        const num = parseFloat(raw);
        if (isNaN(num)) {
          setError(`Invalid value for ${config.name}`);
          return;
        }
        if (config.min_value !== null && num < config.min_value) {
          setError(`${config.name} must be at least ${config.min_value} ${config.unit}`);
          return;
        }
        if (config.max_value !== null && num > config.max_value) {
          setError(`${config.name} must be at most ${config.max_value} ${config.unit}`);
          return;
        }
        readings.push({ vitalConfigId: config.id, value: num });
      }
    }

    if (readings.length === 0) {
      setError("Please enter at least one vital reading");
      return;
    }

    startTransition(async () => {
      const result = await recordVitals({
        patientId,
        visitId,
        readings,
      });

      if (result.success) {
        setSuccess(true);
        setValues({});
        onRecorded();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "Failed to record vitals");
      }
    });
  }

  if (loadingConfigs) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-ink mb-3">Record Vitals</h3>
        <div className="flex items-center justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-200 border-t-teal-600" />
          <span className="ml-2 text-sm text-slate">Loading vital types...</span>
        </div>
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
        <p className="text-sm text-slate">
          No vital types configured for this organization. An owner or manager can set them up in Vitals Configuration.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-ink mb-3">Record Vitals</h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          {configs.map((config) => (
            <div key={config.id} className="flex items-center gap-3">
              <label className="text-xs text-slate w-40 shrink-0 text-right">
                {config.name} ({config.unit})
              </label>
              <input
                type="number"
                step={config.step_value ?? "any"}
                min={config.min_value ?? undefined}
                max={config.max_value ?? undefined}
                value={values[config.id] || ""}
                onChange={(e) => handleValueChange(config.id, e.target.value)}
                placeholder={
                  config.min_value !== null && config.max_value !== null
                    ? `${config.min_value} - ${config.max_value}`
                    : ""
                }
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink placeholder:text-ash focus:border-teal-500 focus:outline-none"
              />
            </div>
          ))}
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
        {success && <p className="text-xs text-green-600">Vitals recorded successfully</p>}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Recording..." : "Record Vitals"}
        </button>
      </form>
    </div>
  );
}
