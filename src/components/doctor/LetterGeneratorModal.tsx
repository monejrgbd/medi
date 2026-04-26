"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchDocumentTemplates,
  createDocument,
  draftDocumentContent,
  fetchDocumentForStaff,
  saveDocumentEdit,
  signAndDeliverDocument,
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
  requires_attestation: boolean;
}

interface LetterGeneratorModalProps {
  visitId: string;
  patientId: string;
  locationId: string;
  initialTemplateKey?: string;
  onClose: () => void;
  onComplete: () => void;
  onRequestSoapEditor?: () => void;
}

const STEP_LABELS = ["Template", "Inputs", "Review", "Deliver"];

export default function LetterGeneratorModal({
  visitId,
  patientId,
  locationId,
  initialTemplateKey,
  onClose,
  onComplete,
  onRequestSoapEditor,
}: LetterGeneratorModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [inputFields, setInputFields] = useState<Record<string, unknown>>({});
  const [contentBody, setContentBody] = useState("");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  // Step 3 state
  const [missingContext, setMissingContext] = useState<string[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 4 state
  const [attested, setAttested] = useState(false);
  const [deliverySms, setDeliverySms] = useState(true);
  const [deliveryEmail, setDeliveryEmail] = useState(false);
  const [deliveryPrint, setDeliveryPrint] = useState(false);

  // Load templates on mount
  useEffect(() => {
    (async () => {
      const result = await fetchDocumentTemplates();
      if (result.success && result.templates) {
        setTemplates(result.templates as Template[]);
      } else {
        setError("Failed to load templates");
      }
      setTemplatesLoading(false);
    })();
  }, []);

  // Auto-select template if initialTemplateKey is provided
  useEffect(() => {
    if (initialTemplateKey && templates.length > 0 && !selectedTemplate) {
      const match = templates.find((t) => t.key === initialTemplateKey);
      if (match) {
        // SOAP routes to the dedicated editor, parent handles
        if (match.document_category === "clinical_note" && onRequestSoapEditor) {
          onRequestSoapEditor();
          return;
        }
        setSelectedTemplate(match);
        setStep(2);
      }
    }
  }, [initialTemplateKey, templates, selectedTemplate, onRequestSoapEditor]);

  // Cleanup save timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
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
    // SOAP notes use a dedicated full screen editor, not the modal wizard.
    // Close this modal and let the parent open SoapNoteEditor.
    if (template.document_category === "clinical_note" && onRequestSoapEditor) {
      onRequestSoapEditor();
      return;
    }
    setSelectedTemplate(template);
    setError(null);
    setStep(2);
  }

  function updateField(key: string, value: unknown) {
    setInputFields((prev) => ({ ...prev, [key]: value }));
  }

  // Poll for document status after drafting. The document row exists immediately
  // after createDocument, but the AI draft is generated asynchronously, so the
  // first few polls may race and return transient failures. Treat those as
  // retryable rather than terminal.
  const TERMINAL_DOC_ERRORS = new Set([
    "Document not found",
    "Not authorized",
    "Staff user not found",
  ]);
  const pollForDraft = useCallback(
    async (docId: string, attempts = 0): Promise<void> => {
      if (attempts > 30) {
        setLoading(false);
        setError("Draft generation timed out. Please try again.");
        return;
      }

      const result = await fetchDocumentForStaff(docId);
      if (!result.success || !result.document) {
        const isTerminal = result.error && TERMINAL_DOC_ERRORS.has(result.error);
        if (isTerminal) {
          setLoading(false);
          setError(result.error || "Failed to check document status");
          return;
        }
        // Transient — retry polling
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return pollForDraft(docId, attempts + 1);
      }

      const doc = result.document;

      if (doc.status === "drafted" || doc.status === "editing") {
        setContentBody(doc.content_body || "");
        if (doc.ai_draft?.missing_context) {
          setMissingContext(
            Array.isArray(doc.ai_draft.missing_context)
              ? doc.ai_draft.missing_context
              : []
          );
        }
        setLoading(false);
        setStep(3);
        return;
      }

      if (doc.status === "failed") {
        setLoading(false);
        setError(
          doc.ai_draft?.error || "AI draft generation failed. Please try again."
        );
        return;
      }

      // Still drafting, poll again
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return pollForDraft(docId, attempts + 1);
    },
    []
  );

  async function handleDraftWithAI() {
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
      let docId: string = documentId ?? "";

      // Create document if not yet created
      if (!docId) {
        const createResult = await createDocument(
          visitId,
          patientId,
          locationId,
          selectedTemplate.key,
          inputFields
        );
        if (!createResult.success || !createResult.document_id) {
          setError(createResult.error || "Failed to create document");
          setLoading(false);
          return;
        }
        docId = createResult.document_id;
        setDocumentId(docId);
      }

      // Trigger AI draft
      const draftResult = await draftDocumentContent(docId);
      if (!draftResult.success) {
        setError(draftResult.error || "Failed to start AI draft");
        setLoading(false);
        return;
      }

      // Poll for completion
      await pollForDraft(docId);
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    if (!documentId) return;
    setLoading(true);
    setError(null);

    try {
      const draftResult = await draftDocumentContent(documentId);
      if (!draftResult.success) {
        setError(draftResult.error || "Failed to regenerate draft");
        setLoading(false);
        return;
      }
      await pollForDraft(documentId);
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  }

  // Debounced auto-save for content edits
  function handleContentChange(value: string) {
    setContentBody(value);
    if (!documentId) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await saveDocumentEdit(documentId, value);
    }, 1500);
  }

  // Save on blur immediately
  async function handleContentBlur() {
    if (!documentId || !contentBody) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    await saveDocumentEdit(documentId, contentBody);
  }

  async function handleSignAndDeliver() {
    if (!documentId || !contentBody) return;
    setLoading(true);
    setError(null);

    const channels: string[] = [];
    if (deliverySms) channels.push("sms");
    if (deliveryEmail) channels.push("email");
    if (deliveryPrint) channels.push("print");

    try {
      const result = await signAndDeliverDocument(
        documentId,
        contentBody,
        channels.length > 0 ? channels : undefined
      );

      if (result.success) {
        toast.success("Document signed and sent to patient");
        onComplete();
      } else {
        toast.error(result.error || "Failed to sign and deliver document");
        setError(result.error || "Failed to sign and deliver document");
      }
    } catch {
      toast.error("An unexpected error occurred");
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    setError(null);
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
  }

  function formatFieldLabel(key: string): string {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function renderFieldInput(key: string, schema: Template["input_schema"]["properties"][string]) {
    const value = inputFields[key];
    const label = formatFieldLabel(key);
    const description = schema.description;

    if (schema.type === "boolean") {
      return (
        <label key={key} className="flex items-start gap-3 py-2 cursor-pointer">
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
            onChange={(e) => updateField(key, parseInt(e.target.value, 10) || 0)}
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

    // Default: string input. Use textarea if key hints at long content.
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
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-lg max-h-[90vh] flex flex-col">
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
            <h2 className="text-lg font-bold text-ink">Generate Letter</h2>
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
          {/* Step 1: Pick a template */}
          {step === 1 && (
            <div>
              <p className="text-sm text-slate mb-4">
                Select a letter type to get started.
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

          {/* Step 2: Fill inputs */}
          {step === 2 && selectedTemplate && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{selectedTemplate.icon}</span>
                <h3 className="text-sm font-semibold text-ink">
                  {selectedTemplate.display_name}
                </h3>
              </div>
              <p className="text-sm text-slate mb-4">
                Provide the details below. The AI will use these along with the
                patient record to draft the letter.
              </p>

              {Object.entries(
                selectedTemplate.input_schema.properties || {}
              ).map(([key, schema]) => renderFieldInput(key, schema))}

              {/* Draft with AI button */}
              <div className="mt-6">
                <button
                  onClick={handleDraftWithAI}
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
                      Drafting with AI...
                    </>
                  ) : (
                    "Draft with AI"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review AI draft */}
          {step === 3 && (
            <div>
              <h3 className="text-sm font-semibold text-ink mb-1">
                Review AI Draft
              </h3>
              <p className="text-xs text-slate mb-4">
                Edit the letter below. Changes are saved automatically.
              </p>

              {/* Missing context warnings */}
              {missingContext.length > 0 && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-medium text-amber-800 mb-1">
                    Missing context
                  </p>
                  <ul className="text-xs text-amber-700 list-disc list-inside space-y-0.5">
                    {missingContext.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              {loading ? (
                <div className="space-y-3">
                  <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
                  <div className="h-4 w-full rounded bg-gray-100 animate-pulse" />
                  <div className="h-4 w-5/6 rounded bg-gray-100 animate-pulse" />
                  <div className="h-4 w-2/3 rounded bg-gray-100 animate-pulse" />
                  <div className="h-4 w-full rounded bg-gray-100 animate-pulse" />
                  <div className="h-4 w-4/5 rounded bg-gray-100 animate-pulse" />
                </div>
              ) : (
                <textarea
                  value={contentBody}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onBlur={handleContentBlur}
                  rows={16}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-ink font-mono leading-relaxed focus:border-hilt-blue focus:outline-none resize-y"
                />
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleRegenerate}
                  disabled={loading}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-slate hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Regenerating..." : "Regenerate"}
                </button>
                <button
                  onClick={() => {
                    setError(null);
                    setStep(4);
                  }}
                  disabled={loading || !contentBody.trim()}
                  className="flex-1 rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Sign and Deliver
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Attest and deliver */}
          {step === 4 && (
            <div>
              <h3 className="text-sm font-semibold text-ink mb-4">
                Attestation and Delivery
              </h3>

              {/* Attestation */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-5">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attested}
                    onChange={(e) => setAttested(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
                  />
                  <p className="text-sm text-ink leading-relaxed">
                    I confirm this clinical document is accurate, complete, and
                    reflects my clinical judgment. I have reviewed the content
                    and accept responsibility for its use in patient care.
                  </p>
                </label>
              </div>

              {/* Delivery channels */}
              <div className="mb-5">
                <label className="text-xs font-medium text-slate mb-2 block">
                  Delivery Channels
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deliverySms}
                      onChange={(e) => setDeliverySms(e.target.checked)}
                      className="rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
                    />
                    <span className="text-sm text-ink">SMS</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deliveryEmail}
                      onChange={(e) => setDeliveryEmail(e.target.checked)}
                      className="rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
                    />
                    <span className="text-sm text-ink">Email</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deliveryPrint}
                      onChange={(e) => setDeliveryPrint(e.target.checked)}
                      className="rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
                    />
                    <span className="text-sm text-ink">Print</span>
                  </label>
                </div>
              </div>

              {/* Sign and deliver */}
              <button
                onClick={handleSignAndDeliver}
                disabled={loading || !attested}
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
                    Signing...
                  </>
                ) : (
                  "Sign and Deliver"
                )}
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="mt-4 text-xs text-red-600">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
