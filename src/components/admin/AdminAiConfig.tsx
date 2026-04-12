"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  fetchAiModelConfig, updateAiModelConfig, type AiComboInput,
  fetchAiPlanConfig, updateAiPlanConfig, type AiPlanComboInput,
} from "@/app/(dashboard)/d/_actions/admin";

type Provider = "anthropic" | "google_vertex" | "openai";
type Task = "intake" | "summary" | "diagnostic";
type PlanTask = "document" | "scan";

interface Combo {
  tier: string;
  display_name: string;
  credit_cost: number;
  intake_provider: Provider;
  intake_model: string;
  intake_model_display: string;
  intake_max_tokens: number;
  intake_temperature: number;
  summary_provider: Provider;
  summary_model: string;
  summary_model_display: string;
  summary_max_tokens: number;
  summary_temperature: number;
  diagnostic_provider: Provider;
  diagnostic_model: string;
  diagnostic_model_display: string;
  diagnostic_max_tokens: number;
  diagnostic_temperature: number;
  notes: string | null;
  updated_at: string;
}

const TIER_ORDER: Record<string, number> = {
  standard: 0,
  advanced: 1,
  precision: 2,
  premium: 3,
};

const PROVIDERS: { value: Provider; label: string }[] = [
  { value: "anthropic", label: "Anthropic" },
  { value: "google_vertex", label: "Google Vertex AI" },
  { value: "openai", label: "OpenAI" },
];

const TASKS: { key: Task; label: string; desc: string }[] = [
  { key: "intake", label: "Intake", desc: "Patient-facing conversation, streaming" },
  { key: "summary", label: "Summary", desc: "JSON extraction after conversation" },
  { key: "diagnostic", label: "Diagnostic", desc: "Doctor-facing diagnostic suggestion" },
];

const PLAN_TASKS: { key: PlanTask; label: string; desc: string }[] = [
  { key: "document", label: "Document", desc: "SOAP notes, letters, clinical docs" },
  { key: "scan", label: "Marketing Scan", desc: "AI patient targeting for campaigns" },
];

interface PlanCombo {
  plan: string;
  document_provider: Provider;
  document_model: string;
  document_model_display: string;
  document_max_tokens: number;
  document_temperature: number;
  scan_provider: Provider;
  scan_model: string;
  scan_model_display: string;
  scan_max_tokens: number;
  scan_temperature: number;
  updated_at: string;
}

export default function AdminAiConfig() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [planCombos, setPlanCombos] = useState<PlanCombo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Combo | null>(null);
  const [editingPlan, setEditingPlan] = useState<PlanCombo | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [res, planRes] = await Promise.all([fetchAiModelConfig(), fetchAiPlanConfig()]);
    if (planRes.success && Array.isArray(planRes.data)) {
      setPlanCombos(planRes.data);
    }
    if (res.success && Array.isArray(res.data)) {
      const sorted = [...res.data].sort(
        (a: Combo, b: Combo) => (TIER_ORDER[a.tier] ?? 99) - (TIER_ORDER[b.tier] ?? 99)
      );
      setCombos(sorted);
    } else {
      toast.error(res.error || "Failed to load AI config");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    const input: AiComboInput = {
      tier: editing.tier,
      display_name: editing.display_name,
      credit_cost: editing.credit_cost,
      intake_provider: editing.intake_provider,
      intake_model: editing.intake_model,
      intake_model_display: editing.intake_model_display,
      intake_max_tokens: editing.intake_max_tokens,
      intake_temperature: editing.intake_temperature,
      summary_provider: editing.summary_provider,
      summary_model: editing.summary_model,
      summary_model_display: editing.summary_model_display,
      summary_max_tokens: editing.summary_max_tokens,
      summary_temperature: editing.summary_temperature,
      diagnostic_provider: editing.diagnostic_provider,
      diagnostic_model: editing.diagnostic_model,
      diagnostic_model_display: editing.diagnostic_model_display,
      diagnostic_max_tokens: editing.diagnostic_max_tokens,
      diagnostic_temperature: editing.diagnostic_temperature,
      notes: editing.notes,
    };
    const res = await updateAiModelConfig(input);
    setSaving(false);
    if (res?.success) {
      toast.success(`${editing.tier} combo saved`);
      setEditing(null);
      await load();
    } else {
      toast.error(res?.error || "Save failed");
    }
  }

  function updateField<K extends keyof Combo>(key: K, value: Combo[K]) {
    if (!editing) return;
    setEditing({ ...editing, [key]: value });
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-ink mb-2">AI Config</h1>
        <p className="text-slate">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">AI Config</h1>
        <p className="mt-1 text-sm text-slate">
          Four tier combos. Each combo bundles the model used for intake, summary, and diagnostic.
          Editing a combo updates all three models together. Changes apply to new conversations immediately.
        </p>
      </header>

      <div className="grid gap-4">
        {combos.map((combo) => (
          <article
            key={combo.tier}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ink capitalize">{combo.display_name}</h2>
                <p className="text-xs text-slate">
                  Tier: <span className="font-mono">{combo.tier}</span> · Credit cost: {combo.credit_cost}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(combo)}
                className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-medium text-white hover:bg-hilt-blue/90"
              >
                Edit
              </button>
            </div>

            <div className="grid gap-2 text-sm">
              <TaskRow label="Intake" model={combo.intake_model_display} provider={combo.intake_provider} />
              <TaskRow label="Summary" model={combo.summary_model_display} provider={combo.summary_provider} />
              <TaskRow label="Diagnostic" model={combo.diagnostic_model_display} provider={combo.diagnostic_provider} />
            </div>

            {combo.notes && (
              <p className="mt-3 rounded-lg bg-snow px-3 py-2 text-xs text-slate">{combo.notes}</p>
            )}
          </article>
        ))}
      </div>

      {/* ─── Plan-Level AI Config ─── */}
      <header className="mt-10 mb-6">
        <h2 className="text-xl font-semibold text-ink">Plan Level AI</h2>
        <p className="mt-1 text-sm text-slate">
          Per plan models for document generation and marketing scans. These are org level tasks, not per visit.
        </p>
      </header>

      <div className="grid gap-4">
        {planCombos.map((pc) => (
          <article key={pc.plan} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink capitalize">{pc.plan.replace(/_/g, " ")}</h2>
              <button
                type="button"
                onClick={() => setEditingPlan(pc)}
                className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-medium text-white hover:bg-hilt-blue/90"
              >
                Edit
              </button>
            </div>
            <div className="grid gap-2 text-sm">
              <TaskRow label="Document" model={pc.document_model_display} provider={pc.document_provider} />
              <TaskRow label="Scan" model={pc.scan_model_display} provider={pc.scan_provider} />
            </div>
          </article>
        ))}
      </div>

      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-ink capitalize">Edit {editingPlan.plan.replace(/_/g, " ")}</h2>
              <button type="button" onClick={() => setEditingPlan(null)} className="text-slate hover:text-ink" aria-label="Close">✕</button>
            </div>
            <div className="space-y-4">
              {PLAN_TASKS.map((task) => (
                <fieldset key={task.key} className="rounded-lg border border-gray-200 p-4">
                  <legend className="px-2 text-sm font-semibold text-ink">{task.label}</legend>
                  <p className="mb-3 text-xs text-slate">{task.desc}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <LabeledSelect
                      label="Provider"
                      value={editingPlan[`${task.key}_provider`] as Provider}
                      options={PROVIDERS}
                      onChange={(v) => setEditingPlan({ ...editingPlan, [`${task.key}_provider`]: v as Provider })}
                    />
                    <LabeledInput label="Model ID" value={editingPlan[`${task.key}_model`] as string} onChange={(v) => setEditingPlan({ ...editingPlan, [`${task.key}_model`]: v })} />
                    <LabeledInput label="Display name" value={editingPlan[`${task.key}_model_display`] as string} onChange={(v) => setEditingPlan({ ...editingPlan, [`${task.key}_model_display`]: v })} />
                    <div className="grid grid-cols-2 gap-2">
                      <LabeledNumber label="Max tokens" value={editingPlan[`${task.key}_max_tokens`] as number} onChange={(v) => setEditingPlan({ ...editingPlan, [`${task.key}_max_tokens`]: v })} />
                      <LabeledNumber label="Temp" value={editingPlan[`${task.key}_temperature`] as number} onChange={(v) => setEditingPlan({ ...editingPlan, [`${task.key}_temperature`]: v })} step={0.1} />
                    </div>
                  </div>
                </fieldset>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setEditingPlan(null)} disabled={saving} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-slate hover:bg-gray-50">Cancel</button>
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  const input: AiPlanComboInput = {
                    plan: editingPlan.plan,
                    document_provider: editingPlan.document_provider,
                    document_model: editingPlan.document_model,
                    document_model_display: editingPlan.document_model_display,
                    document_max_tokens: editingPlan.document_max_tokens,
                    document_temperature: editingPlan.document_temperature,
                    scan_provider: editingPlan.scan_provider,
                    scan_model: editingPlan.scan_model,
                    scan_model_display: editingPlan.scan_model_display,
                    scan_max_tokens: editingPlan.scan_max_tokens,
                    scan_temperature: editingPlan.scan_temperature,
                  };
                  const res = await updateAiPlanConfig(input);
                  setSaving(false);
                  if (res?.success) {
                    toast.success(`${editingPlan.plan} plan config saved`);
                    setEditingPlan(null);
                    await load();
                  } else {
                    toast.error(res?.error || "Save failed");
                  }
                }}
                className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-medium text-white hover:bg-hilt-blue/90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Plan Config"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-ink capitalize">Edit {editing.tier} Combo</h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-slate hover:text-ink"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-xs text-amber-700">
              Changes apply to new conversations immediately. In-flight visits may switch models on their next message.
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <LabeledInput
                  label="Display name"
                  value={editing.display_name}
                  onChange={(v) => updateField("display_name", v)}
                />
                <LabeledNumber
                  label="Credit cost"
                  value={editing.credit_cost}
                  onChange={(v) => updateField("credit_cost", v)}
                  step={0.1}
                />
              </div>

              {TASKS.map((task) => (
                <fieldset key={task.key} className="rounded-lg border border-gray-200 p-4">
                  <legend className="px-2 text-sm font-semibold text-ink">{task.label}</legend>
                  <p className="mb-3 text-xs text-slate">{task.desc}</p>

                  <div className="grid grid-cols-2 gap-3">
                    <LabeledSelect
                      label="Provider"
                      value={editing[`${task.key}_provider`] as Provider}
                      options={PROVIDERS}
                      onChange={(v) => updateField(`${task.key}_provider`, v as Provider)}
                    />
                    <LabeledInput
                      label="Model ID"
                      value={editing[`${task.key}_model`] as string}
                      onChange={(v) => updateField(`${task.key}_model`, v)}
                    />
                    <LabeledInput
                      label="Display name"
                      value={editing[`${task.key}_model_display`] as string}
                      onChange={(v) => updateField(`${task.key}_model_display`, v)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <LabeledNumber
                        label="Max tokens"
                        value={editing[`${task.key}_max_tokens`] as number}
                        onChange={(v) => updateField(`${task.key}_max_tokens`, v)}
                      />
                      <LabeledNumber
                        label="Temp"
                        value={editing[`${task.key}_temperature`] as number}
                        onChange={(v) => updateField(`${task.key}_temperature`, v)}
                        step={0.1}
                      />
                    </div>
                  </div>
                </fieldset>
              ))}

              <LabeledInput
                label="Notes (optional)"
                value={editing.notes ?? ""}
                onChange={(v) => updateField("notes", v || null)}
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={saving}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-slate hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-medium text-white hover:bg-hilt-blue/90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Combo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({ label, model, provider }: { label: string; model: string; provider: Provider }) {
  const providerLabel = PROVIDERS.find((p) => p.value === provider)?.label ?? provider;
  return (
    <div className="flex items-center justify-between rounded-lg bg-snow px-3 py-2">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-ash">{label}</span>
        <p className="text-sm font-medium text-ink">{model}</p>
      </div>
      <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate border border-gray-200">
        {providerLabel}
      </span>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
      />
    </label>
  );
}

function LabeledNumber({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate">{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
      />
    </label>
  );
}

function LabeledSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
