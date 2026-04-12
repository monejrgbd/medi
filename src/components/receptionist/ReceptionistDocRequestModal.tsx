"use client";

import { useState, useEffect } from "react";
import {
  fetchDocumentTemplates,
  requestDocumentAsReceptionist,
} from "@/app/(dashboard)/d/_actions/documents";
import { toast } from "sonner";

interface Template {
  key: string;
  document_category: string;
  display_name: string;
  description: string;
  icon: string;
  input_schema: {
    type: string;
    properties: Record<
      string,
      {
        type: string;
        description?: string;
        minimum?: number;
        maximum?: number;
        enum?: string[];
        default?: unknown;
      }
    >;
    required?: string[];
  };
}

interface ReceptionistDocRequestModalProps {
  visitId: string;
  patientId: string;
  locationId: string;
  onClose: () => void;
  onComplete: () => void;
}

const STEP_LABELS = ["Template", "Details"];

export default function ReceptionistDocRequestModal({
  visitId,
  patientId,
  locationId,
  onClose,
  onComplete,
}: ReceptionistDocRequestModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [inputFields, setInputFields] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  // Load letter templates on mount
  useEffect(() => {
    (async () => {
      const result = await fetchDocumentTemplates();
      if (result.success && result.templates) {
        setTemplates(
          (result.templates as Template[]).filter(
            (t) => t.document_category === "letter"
          )
        );
      } else {
        setError("Failed to load templates");
      }
      setTemplatesLoading(false);
    })();
  }, []);

  // Initialize default input values when template is selected
  useEffect(() => {
    if (!selectedTemplate) return;
    const defaults: Record<string, unknown> = {};
    const props = selectedTemplate.input_schema.properties || {};
    for (const [key, schema] of Object.entries(props)) {
      if (schema.default !== undefined) {
        defaults[key] = schema.default;
      } else if (schema.type === "boolean") {
        defaults[key] = false;
      } else if (schema.type === "integer") {
        defaults[key] = schema.minimum ?? 0;
      } else if (schema.type === "string" && schema.enum?.length) {
        defaults[key] = schema.enum[0];
      } else {
        defaults[key] = "";
      }
    }
    setInputFields(defaults);
  }, [selectedTemplate]);

  function handleSelectTemplate(template: Template) {
    setSelectedTemplate(template);
    setError(null);
    setStep(2);
  }

  function updateField(key: string, value: unknown) {
    setInputFields((prev) => ({ ...prev, [key]: value }));
  }

  function formatFieldLabel(key: string): string {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  async function handleSubmit() {
    if (!selectedTemplate) return;
    setLoading(true);
    setError(null);

    // Validate required fields
    const required = selectedTemplate.input_schema.required || [];
    for (const key of required) {
      const val = inputFields[key];
      if (val === undefined || val === null || val === "") {
        const label = formatFieldLabel(key);
        setError(`${label} is required`);
        setLoading(false);
        return;
      }
    }

    try {
      const result = await requestDocumentAsReceptionist(
        visitId,
        patientId,
        locationId,
        selectedTemplate.key,
        Object.keys(inputFields).length > 0 ? inputFields : undefined
      );

      if (result.success) {
        toast.success("Sent to doctor for approval");
        onComplete();
      } else {
        setError(result.error || "Failed to send request");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    setError(null);
    if (step === 2) setStep(1);
  }

  function renderFieldInput(
    key: string,
    schema: Template["input_schema"]["properties"][string]
  ) {
    const value = inputFields[key];
    const label = formatFieldLabel(key);
    const description = schema.description;

    if (schema.type === "boolean") {
      return (
        <label
          key={key}
          className="flex items-start gap-3 py-2 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => updateField(key, e.target.checked)}
            className="mt-0.5 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
          />
          <div>
            <p className="text-sm font-medium text-ink">{label}</p>
            {description && (
              <p className="text-xs text-ash mt-0.5">{description}</p>
            )}
          </div>
        </label>
      );
    }

    if (schema.type === "integer") {
      return (
        <div key={key} className="mb-3">
          <label className="text-xs font-medium text-slate mb-1 block">
            {label}
            {(selectedTemplate?.input_schema.required || []).includes(key) && (
              <span className="text-red-400 ml-0.5">*</span>
            )}
          </label>
          {description && (
            <p className="text-xs text-ash mb-1">{description}</p>
          )}
          <input
            type="number"
            value={value as number}
            min={schema.minimum}
            max={schema.maximum}
            onChange={(e) =>
              updateField(key, parseInt(e.target.value, 10) || 0)
            }
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink focus:border-hilt-blue focus:outline-none"
          />
        </div>
      );
    }

    if (schema.type === "string" && schema.enum && schema.enum.length > 0) {
      return (
        <div key={key} className="mb-3">
          <label className="text-xs font-medium text-slate mb-1 block">
            {label}
            {(selectedTemplate?.input_schema.required || []).includes(key) && (
              <span className="text-red-400 ml-0.5">*</span>
            )}
          </label>
          {description && (
            <p className="text-xs text-ash mb-1">{description}</p>
          )}
          <select
            value={(value as string) || ""}
            onChange={(e) => updateField(key, e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink focus:border-hilt-blue focus:outline-none bg-white"
          >
            <option value="">Select...</option>
            {schema.enum.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    }

    // Default: string input. Use textarea for long-form fields.
    const isLong =
      key.includes("note") ||
      key.includes("reason") ||
      key.includes("detail") ||
      key.includes("description") ||
      key.includes("comment");

    return (
      <div key={key} className="mb-3">
        <label className="text-xs font-medium text-slate mb-1 block">
          {label}
          {(selectedTemplate?.input_schema.required || []).includes(key) && (
            <span className="text-red-400 ml-0.5">*</span>
          )}
        </label>
        {description && (
          <p className="text-xs text-ash mb-1">{description}</p>
        )}
        {isLong ? (
          <textarea
            value={(value as string) || ""}
            onChange={(e) => updateField(key, e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none resize-y"
          />
        ) : (
          <input
            type="text"
            value={(value as string) || ""}
            onChange={(e) => updateField(key, e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none"
          />
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={handleBack}
                disabled={loading}
                className="text-slate hover:text-ink disabled:opacity-50 transition-colors"
                aria-label="Go back"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            <h2 className="text-lg font-bold text-ink">Request a Letter</h2>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-2">
            {STEP_LABELS.map((label, i) => {
              const stepNum = i + 1;
              const isActive = step === stepNum;
              const isComplete = step > stepNum;
              return (
                <div key={label} className="flex items-center gap-1.5">
                  <div
                    className={`h-2.5 w-2.5 rounded-full transition-colors ${
                      isActive
                        ? "bg-hilt-blue"
                        : isComplete
                          ? "bg-hilt-blue/40"
                          : "bg-gray-200"
                    }`}
                    title={label}
                  />
                  {i < STEP_LABELS.length - 1 && (
                    <div
                      className={`h-px w-4 ${
                        isComplete ? "bg-hilt-blue/40" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate hover:text-ink disabled:opacity-50 transition-colors"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Step 1: Pick a letter template */}
          {step === 1 && (
            <div>
              <p className="text-sm text-slate mb-4">
                Select a letter type to request from the doctor.
              </p>
              {templatesLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-28 rounded-lg bg-gray-100 animate-pulse"
                    />
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <p className="text-sm text-ash text-center py-8">
                  No letter templates available.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {templates.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => handleSelectTemplate(t)}
                      className="rounded-lg border border-gray-200 p-4 text-left hover:border-hilt-blue hover:bg-blue-50/50 transition-colors group"
                    >
                      <div className="text-2xl mb-2">{t.icon}</div>
                      <p className="text-sm font-medium text-ink group-hover:text-hilt-blue transition-colors">
                        {t.display_name}
                      </p>
                      <p className="text-xs text-ash mt-1 line-clamp-2">
                        {t.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Fill inputs and submit to doctor */}
          {step === 2 && selectedTemplate && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{selectedTemplate.icon}</span>
                <h3 className="text-sm font-semibold text-ink">
                  {selectedTemplate.display_name}
                </h3>
              </div>
              <p className="text-sm text-slate mb-4">
                Fill in the details below. This will be sent to the doctor for
                review and approval.
              </p>

              {Object.entries(
                selectedTemplate.input_schema.properties || {}
              ).map(([key, schema]) => renderFieldInput(key, schema))}

              {/* Submit button */}
              <div className="mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    "Send to Doctor for Approval"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && <p className="mt-4 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
