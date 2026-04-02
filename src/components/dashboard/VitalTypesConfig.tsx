"use client";

import { useState, useEffect } from "react";
import {
  fetchVitalTypesMasterList,
  fetchOrgVitalConfigs,
  configureOrgVitals,
  initializeOrgDefaultVitals,
} from "@/app/(dashboard)/d/_actions/nurse";

interface VitalType {
  id: string;
  name: string;
  unit: string;
  category: string;
  default_min: number | null;
  default_max: number | null;
  default_step: number | null;
}

interface OrgVitalConfig {
  id: string;
  vital_type_id: string | null;
  name: string;
  unit: string;
  min_value: number | null;
  max_value: number | null;
  step_value: number | null;
  display_order: number;
  is_enabled: boolean;
  is_custom: boolean;
}

export default function VitalTypesConfig() {
  const [masterList, setMasterList] = useState<VitalType[]>([]);
  const [configs, setConfigs] = useState<OrgVitalConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customUnit, setCustomUnit] = useState("");
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [masterRes, configRes] = await Promise.all([
      fetchVitalTypesMasterList(),
      fetchOrgVitalConfigs(),
    ]);

    if (masterRes.success) setMasterList(masterRes.vital_types ?? []);
    if (configRes.success) setConfigs(configRes.configs ?? []);

    // If no configs exist, initialize defaults
    if (configRes.success && (configRes.configs ?? []).length === 0) {
      const initRes = await initializeOrgDefaultVitals();
      if (initRes.success) {
        const refreshRes = await fetchOrgVitalConfigs();
        if (refreshRes.success) setConfigs(refreshRes.configs ?? []);
      }
    }

    setLoading(false);
  }

  async function refreshConfigs() {
    const res = await fetchOrgVitalConfigs();
    if (res.success) setConfigs(res.configs ?? []);
  }

  function getConfigForType(vitalTypeId: string): OrgVitalConfig | undefined {
    return configs.find((c) => c.vital_type_id === vitalTypeId);
  }

  async function handleTogglePredefined(vitalTypeId: string, currentlyEnabled: boolean) {
    setSaving(vitalTypeId);
    setError(null);

    const result = await configureOrgVitals([
      { vital_type_id: vitalTypeId, enabled: !currentlyEnabled },
    ]);

    if (!result.success) {
      setError(result.error || "Failed to update configuration");
    } else {
      await refreshConfigs();
    }
    setSaving(null);
  }

  async function handleToggleCustom(configId: string, currentlyEnabled: boolean) {
    setSaving(configId);
    setError(null);

    const result = await configureOrgVitals([
      { config_id: configId, enabled: !currentlyEnabled },
    ]);

    if (!result.success) {
      setError(result.error || "Failed to update configuration");
    } else {
      await refreshConfigs();
    }
    setSaving(null);
  }

  async function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!customName.trim() || !customUnit.trim()) return;

    setAddingCustom(true);
    setError(null);

    const result = await configureOrgVitals([
      {
        custom_name: customName.trim(),
        custom_unit: customUnit.trim(),
        ...(customMin ? { custom_min: parseFloat(customMin) } : {}),
        ...(customMax ? { custom_max: parseFloat(customMax) } : {}),
        enabled: true,
      },
    ]);

    if (!result.success) {
      setError(result.error || "Failed to add custom vital");
    } else {
      await refreshConfigs();
      setCustomName("");
      setCustomUnit("");
      setCustomMin("");
      setCustomMax("");
      setShowAddForm(false);
    }
    setAddingCustom(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-200 border-t-teal-600" />
        <span className="ml-3 text-sm text-slate">Loading vital configurations...</span>
      </div>
    );
  }

  const predefined = masterList;
  const customConfigs = configs.filter((c) => c.is_custom);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Vitals Configuration</h1>
        <p className="mt-1 text-sm text-slate">
          Choose which vital signs your staff can record during patient visits.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Predefined vitals */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-sm font-semibold text-ink">Standard Vital Types</h2>
          <p className="text-xs text-slate mt-0.5">
            Toggle to enable or disable each vital type for your organization.
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {predefined.map((vt) => {
            const config = getConfigForType(vt.id);
            const isEnabled = config?.is_enabled ?? true;  // predefined vitals are enabled by default
            const isSaving = saving === vt.id;

            return (
              <div
                key={vt.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{vt.name}</p>
                  <p className="text-xs text-slate">
                    {vt.unit}
                    {vt.default_min !== null && vt.default_max !== null
                      ? ` (${vt.default_min} - ${vt.default_max})`
                      : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleTogglePredefined(vt.id, isEnabled)}
                  disabled={isSaving}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    isEnabled ? "bg-teal-600" : "bg-gray-300"
                  } ${isSaving ? "opacity-50" : ""}`}
                  role="switch"
                  aria-checked={isEnabled}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      isEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom vitals */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-sm font-semibold text-ink">Custom Vital Types</h2>
          <p className="text-xs text-slate mt-0.5">
            Add organization specific vital types that are not in the standard list.
          </p>
        </div>

        {customConfigs.length > 0 && (
          <div className="divide-y divide-gray-100">
            {customConfigs.map((config) => {
              const isSaving = saving === config.id;
              return (
                <div
                  key={config.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{config.name}</p>
                    <p className="text-xs text-slate">
                      {config.unit}
                      {config.min_value !== null && config.max_value !== null
                        ? ` (${config.min_value} - ${config.max_value})`
                        : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleCustom(config.id, config.is_enabled)}
                    disabled={isSaving}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      config.is_enabled ? "bg-teal-600" : "bg-gray-300"
                    } ${isSaving ? "opacity-50" : ""}`}
                    role="switch"
                    aria-checked={config.is_enabled}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        config.is_enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {customConfigs.length === 0 && !showAddForm && (
          <div className="px-4 pb-4">
            <p className="text-xs text-slate">No custom vital types configured.</p>
          </div>
        )}

        {/* Add custom form */}
        {showAddForm ? (
          <form onSubmit={handleAddCustom} className="border-t border-gray-100 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate">Name *</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Peak Flow"
                  required
                  maxLength={100}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink placeholder:text-ash focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate">Unit *</label>
                <input
                  type="text"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder="e.g. L/min"
                  required
                  maxLength={20}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink placeholder:text-ash focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate">Min Value</label>
                <input
                  type="number"
                  step="any"
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  placeholder="Optional"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink placeholder:text-ash focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate">Max Value</label>
                <input
                  type="number"
                  step="any"
                  value={customMax}
                  onChange={(e) => setCustomMax(e.target.value)}
                  placeholder="Optional"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink placeholder:text-ash focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addingCustom}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {addingCustom ? "Adding..." : "Add Vital Type"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setCustomName("");
                  setCustomUnit("");
                  setCustomMin("");
                  setCustomMax("");
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-slate hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="px-4 pb-4">
            <button
              onClick={() => setShowAddForm(true)}
              className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-slate hover:border-teal-400 hover:text-teal-600 transition-colors w-full"
            >
              + Add Custom Vital
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
