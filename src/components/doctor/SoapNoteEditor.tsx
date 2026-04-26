"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  createDocument,
  draftDocumentContent,
  fetchDocumentForStaff,
  saveDocumentEdit,
  savePhysicalExam,
  signAndDeliverDocument,
  voidDocument,
} from "@/app/(dashboard)/d/_actions/documents";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import PhysicalExamCapture from "./PhysicalExamCapture";

type ExamMode = "voice" | "buttons" | "text";
type DocStatus =
  | "draft"
  | "drafting"
  | "drafted"
  | "editing"
  | "signed"
  | "sent"
  | "void"
  | "failed";

interface VisitContext {
  patient_name: string;
  patient_dob: string;
  visit_date: string;
  diagnosis: string | null;
  medications: string[];
  allergies: string[];
  chronic_conditions: string[];
  vitals: Record<string, string | number> | null;
}

interface SoapNoteEditorProps {
  visitId: string;
  patientId: string;
  locationId: string;
  onClose: () => void;
  onComplete: () => void;
}

/* ── Status pill (reused from DocumentHistory) ── */
function StatusPill({ status }: { status: DocStatus | string }) {
  let className: string;

  switch (status) {
    case "draft":
      className = "bg-gray-100 text-gray-600";
      break;
    case "drafting":
      className = "bg-blue-100 text-blue-700 animate-pulse";
      break;
    case "drafted":
    case "editing":
      className = "bg-yellow-100 text-yellow-700";
      break;
    case "signed":
    case "sent":
      className = "bg-green-100 text-green-700";
      break;
    case "void":
    case "failed":
      className = "bg-red-100 text-red-700";
      break;
    default:
      className = "bg-gray-100 text-gray-600";
  }

  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

/* ── Shimmer placeholder ── */
function ShimmerBlock() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 w-1/4 rounded bg-gray-100" />
      <div className="h-4 w-full rounded bg-gray-100" />
      <div className="h-4 w-5/6 rounded bg-gray-100" />
      <div className="h-4 w-2/3 rounded bg-gray-100" />
      <div className="h-4 w-full rounded bg-gray-100" />
      <div className="h-4 w-4/5 rounded bg-gray-100" />
    </div>
  );
}

/* ── Spinner icon ── */
function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
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
  );
}

/* ── SOAP section parser ── */
const SOAP_LABELS = ["SUBJECTIVE", "OBJECTIVE", "ASSESSMENT", "PLAN"] as const;
type SoapSection = (typeof SOAP_LABELS)[number];

function parseSoapSections(body: string): Record<SoapSection, string> {
  const sections: Record<SoapSection, string> = {
    SUBJECTIVE: "",
    OBJECTIVE: "",
    ASSESSMENT: "",
    PLAN: "",
  };

  // Try to parse by headers like "SUBJECTIVE:" or "## SUBJECTIVE"
  const pattern =
    /(?:^|\n)(?:#{0,3}\s*)?(?:SUBJECTIVE|Subjective)\s*:?\s*\n?([\s\S]*?)(?=(?:\n(?:#{0,3}\s*)?(?:OBJECTIVE|Objective)\s*:?)|\n*$)/;
  const objPattern =
    /(?:^|\n)(?:#{0,3}\s*)?(?:OBJECTIVE|Objective)\s*:?\s*\n?([\s\S]*?)(?=(?:\n(?:#{0,3}\s*)?(?:ASSESSMENT|Assessment)\s*:?)|\n*$)/;
  const assPattern =
    /(?:^|\n)(?:#{0,3}\s*)?(?:ASSESSMENT|Assessment)\s*:?\s*\n?([\s\S]*?)(?=(?:\n(?:#{0,3}\s*)?(?:PLAN|Plan)\s*:?)|\n*$)/;
  const planPattern =
    /(?:^|\n)(?:#{0,3}\s*)?(?:PLAN|Plan)\s*:?\s*\n?([\s\S]*?)$/;

  const subjMatch = body.match(pattern);
  const objMatch = body.match(objPattern);
  const assMatch = body.match(assPattern);
  const planMatch = body.match(planPattern);

  if (subjMatch) sections.SUBJECTIVE = subjMatch[1]?.trim() ?? "";
  if (objMatch) sections.OBJECTIVE = objMatch[1]?.trim() ?? "";
  if (assMatch) sections.ASSESSMENT = assMatch[1]?.trim() ?? "";
  if (planMatch) sections.PLAN = planMatch[1]?.trim() ?? "";

  // If no sections found, put everything in SUBJECTIVE
  if (!subjMatch && !objMatch && !assMatch && !planMatch && body.trim()) {
    sections.SUBJECTIVE = body.trim();
  }

  return sections;
}

function buildSoapBody(sections: Record<SoapSection, string>): string {
  return SOAP_LABELS.map(
    (label) => `${label}:\n${sections[label]}`
  ).join("\n\n");
}

/* ── Main component ── */
export default function SoapNoteEditor({
  visitId,
  patientId,
  locationId,
  onClose,
  onComplete,
}: SoapNoteEditorProps) {
  /* ── Core state ── */
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [status, setStatus] = useState<DocStatus>("draft");
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── Physical exam ── */
  const [examValue, setExamValue] = useState("");
  const [examMode, setExamMode] = useState<ExamMode>("buttons");

  /* ── SOAP content ── */
  const [sections, setSections] = useState<Record<SoapSection, string>>({
    SUBJECTIVE: "",
    OBJECTIVE: "",
    ASSESSMENT: "",
    PLAN: "",
  });
  const [missingContext, setMissingContext] = useState<string[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Visit context (left column) ── */
  const [context, setContext] = useState<VisitContext | null>(null);

  /* ── Sign/deliver state ── */
  const [attested, setAttested] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  /* ── Void state ── */
  const [voidConfirm, setVoidConfirm] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);

  /* ── Create document on mount ── */
  useEffect(() => {
    (async () => {
      try {
        const result = await createDocument(
          visitId,
          patientId,
          locationId,
          "clinical_note_soap",
          {}
        );
        if (result.success && result.document_id) {
          setDocumentId(result.document_id);
          // Fetch initial document state to get visit context
          const docResult = await fetchDocumentForStaff(result.document_id);
          if (docResult.success && docResult.document) {
            const doc = docResult.document;
            setStatus(doc.status ?? "draft");
            if (doc.content_body) {
              setSections(parseSoapSections(doc.content_body));
            }
            if (doc.visit_context) {
              setContext(doc.visit_context);
            }
            if (doc.physical_exam_raw) {
              setExamValue(doc.physical_exam_raw);
            }
            if (doc.pdf_url) {
              setPdfUrl(doc.pdf_url);
            }
          }
        } else {
          setError(result.error || "Failed to create SOAP note document");
        }
      } catch {
        setError("An unexpected error occurred");
      } finally {
        setInitLoading(false);
      }
    })();
  }, [visitId, patientId, locationId]);

  // Cleanup save timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  /* ── Poll for draft completion ──
     Transient failures are retried; only terminal RPC errors surface to the user. */
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
        setStatus("draft");
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
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return pollForDraft(docId, attempts + 1);
      }

      const doc = result.document;
      setStatus(doc.status ?? "draft");

      if (doc.visit_context && !context) {
        setContext(doc.visit_context);
      }

      if (doc.status === "drafted" || doc.status === "editing") {
        if (doc.content_body) {
          setSections(parseSoapSections(doc.content_body));
        }
        if (doc.ai_draft?.missing_context) {
          setMissingContext(
            Array.isArray(doc.ai_draft.missing_context)
              ? doc.ai_draft.missing_context
              : []
          );
        }
        setLoading(false);
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
    [context]
  );

  /* ── Draft SOAP note ── */
  async function handleDraft() {
    if (!documentId) return;
    if (!examValue.trim()) {
      setError("Physical exam findings are required before drafting.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Save physical exam first
      const examResult = await savePhysicalExam(documentId, examValue, examMode);
      if (!examResult.success) {
        setError(examResult.error || "Failed to save physical exam");
        setLoading(false);
        return;
      }

      // Trigger AI draft
      const draftResult = await draftDocumentContent(documentId);
      if (!draftResult.success) {
        setError(draftResult.error || "Failed to start AI draft");
        setLoading(false);
        return;
      }

      setStatus("drafting");
      await pollForDraft(documentId);
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  }

  /* ── Regenerate ── */
  async function handleRegenerate() {
    if (!documentId) return;

    // Save updated physical exam if changed
    if (examValue.trim()) {
      await savePhysicalExam(documentId, examValue, examMode);
    }

    setLoading(true);
    setError(null);

    try {
      const draftResult = await draftDocumentContent(documentId);
      if (!draftResult.success) {
        setError(draftResult.error || "Failed to regenerate draft");
        setLoading(false);
        return;
      }

      setStatus("drafting");
      await pollForDraft(documentId);
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  }

  /* ── Section editing with debounced auto-save ── */
  function handleSectionChange(section: SoapSection, value: string) {
    const updated = { ...sections, [section]: value };
    setSections(updated);

    if (!documentId) return;
    const fullBody = buildSoapBody(updated);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await saveDocumentEdit(documentId, fullBody);
    }, 1500);
  }

  function handleSectionBlur() {
    if (!documentId) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const fullBody = buildSoapBody(sections);
    saveDocumentEdit(documentId, fullBody);
  }

  /* ── Copy to EMR ── */
  function handleCopyToEMR() {
    const fullBody = buildSoapBody(sections);
    navigator.clipboard.writeText(fullBody).then(
      () => toast.success("SOAP note copied to clipboard"),
      () => toast.error("Failed to copy to clipboard")
    );
  }

  /* ── Sign and deliver ── */
  async function handleSign() {
    if (!documentId || !attested) return;
    setLoading(true);
    setError(null);

    const fullBody = buildSoapBody(sections);

    try {
      const result = await signAndDeliverDocument(documentId, fullBody, [
        "print",
      ]);
      if (result.success) {
        toast.success("SOAP note signed successfully");
        setStatus("signed");
        // Fetch updated doc to get pdf_url
        const docResult = await fetchDocumentForStaff(documentId);
        if (docResult.success && docResult.document?.pdf_url) {
          setPdfUrl(docResult.document.pdf_url);
        }
      } else {
        toast.error(result.error || "Failed to sign document");
        setError(result.error || "Failed to sign document");
      }
    } catch {
      toast.error("An unexpected error occurred");
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  /* ── Download PDF ── */
  async function handleDownloadPdf() {
    if (!pdfUrl) return;
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("clinical-documents")
      .createSignedUrl(pdfUrl, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    } else {
      toast.error("Failed to open PDF");
    }
  }

  /* ── Void ── */
  async function handleVoid() {
    if (!documentId || !voidReason.trim()) return;
    setVoiding(true);

    const result = await voidDocument(documentId, voidReason.trim());
    if (result.success) {
      toast.success("Document voided");
      setStatus("void");
      setVoidConfirm(false);
      setVoidReason("");
    } else {
      toast.error(result.error || "Failed to void document");
    }
    setVoiding(false);
  }

  /* ── Derived state ── */
  const hasDraft =
    status === "drafted" || status === "editing" || status === "signed" || status === "sent";
  const isSigned = status === "signed" || status === "sent";
  const isVoid = status === "void";
  const isDrafting = status === "drafting" || (loading && !hasDraft);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-ink">SOAP Note</h1>
          <StatusPill status={status} />
        </div>
        <button
          onClick={onClose}
          className="text-slate hover:text-ink transition-colors"
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

      {/* ── Init loading ── */}
      {initLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Spinner className="h-8 w-8 mx-auto mb-3 text-hilt-blue" />
            <p className="text-sm text-slate">Preparing SOAP note...</p>
          </div>
        </div>
      ) : error && !documentId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-slate hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        /* ── 3-column layout ── */
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          {/* ── Left column: visit context ── */}
          <div className="lg:col-span-3 overflow-y-auto p-5">
            <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-4">
              Visit Context
            </h2>

            {context ? (
              <div className="space-y-4">
                {/* Patient info */}
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {context.patient_name}
                  </p>
                  {context.patient_dob && (
                    <p className="text-xs text-slate">
                      DOB:{" "}
                      {new Date(context.patient_dob).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  {context.visit_date && (
                    <p className="text-xs text-slate">
                      Visit:{" "}
                      {new Date(context.visit_date).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>

                {/* Diagnosis */}
                {context.diagnosis && (
                  <div>
                    <h4 className="text-xs font-medium text-slate mb-1">
                      Diagnosis
                    </h4>
                    <p className="text-sm text-ink">{context.diagnosis}</p>
                  </div>
                )}

                {/* Medications */}
                <div>
                  <h4 className="text-xs font-medium text-slate mb-1">
                    Medications ({context.medications?.length ?? 0})
                  </h4>
                  {context.medications?.length > 0 ? (
                    <ul className="space-y-0.5">
                      {context.medications.map((m, i) => (
                        <li key={i} className="text-xs text-ink">
                          {m}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-ash">None reported</p>
                  )}
                </div>

                {/* Allergies */}
                <div>
                  <h4 className="text-xs font-medium text-slate mb-1">
                    Allergies ({context.allergies?.length ?? 0})
                  </h4>
                  {context.allergies?.length > 0 ? (
                    <ul className="space-y-0.5">
                      {context.allergies.map((a, i) => (
                        <li
                          key={i}
                          className="text-xs text-red-600 font-medium"
                        >
                          {a}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-ash">None reported</p>
                  )}
                </div>

                {/* Chronic conditions */}
                <div>
                  <h4 className="text-xs font-medium text-slate mb-1">
                    Chronic Conditions ({context.chronic_conditions?.length ?? 0})
                  </h4>
                  {context.chronic_conditions?.length > 0 ? (
                    <ul className="space-y-0.5">
                      {context.chronic_conditions.map((c, i) => (
                        <li key={i} className="text-xs text-ink">
                          {c}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-ash">None reported</p>
                  )}
                </div>

                {/* Vitals */}
                {context.vitals && Object.keys(context.vitals).length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-slate mb-1">
                      Vitals
                    </h4>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(context.vitals).map(([key, val]) => (
                        <div key={key} className="text-xs">
                          <span className="text-slate">
                            {key.replace(/_/g, " ")}:
                          </span>{" "}
                          <span className="text-ink font-medium">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 w-2/3 rounded bg-gray-100" />
                <div className="h-3 w-1/2 rounded bg-gray-100" />
                <div className="h-3 w-3/4 rounded bg-gray-100" />
                <div className="h-3 w-1/3 rounded bg-gray-100" />
              </div>
            )}

            <p className="mt-6 text-[10px] text-ash leading-relaxed">
              This data feeds the AI draft. If anything is missing or incorrect,
              update the patient record before drafting.
            </p>
          </div>

          {/* ── Center column: editor ── */}
          <div className="lg:col-span-5 overflow-y-auto p-5">
            {/* Physical Exam Capture */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-ink mb-2">
                Physical Exam Findings
              </h3>
              <PhysicalExamCapture
                value={examValue}
                mode={examMode}
                onModeChange={setExamMode}
                onChange={setExamValue}
                disabled={loading || isSigned || isVoid}
              />
            </div>

            {/* Draft button */}
            {!hasDraft && !isDrafting && (
              <button
                onClick={handleDraft}
                disabled={loading || !examValue.trim()}
                className="w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mb-5"
              >
                {loading ? (
                  <>
                    <Spinner />
                    Saving exam...
                  </>
                ) : (
                  "Draft SOAP Note"
                )}
              </button>
            )}

            {/* Drafting shimmer */}
            {isDrafting && (
              <div className="mb-5">
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 mb-4 flex items-center gap-2">
                  <Spinner className="h-4 w-4 text-hilt-blue" />
                  <p className="text-xs font-medium text-blue-700">
                    AI is drafting your SOAP note...
                  </p>
                </div>
                <ShimmerBlock />
              </div>
            )}

            {/* Missing context warnings */}
            {missingContext.length > 0 && hasDraft && (
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

            {/* SOAP sections editor */}
            {hasDraft && !isDrafting && (
              <div className="space-y-4">
                {SOAP_LABELS.map((label) => (
                  <div key={label}>
                    <label className="text-xs font-semibold text-slate uppercase tracking-wider mb-1.5 block">
                      {label}
                    </label>
                    <textarea
                      value={sections[label]}
                      onChange={(e) =>
                        handleSectionChange(label, e.target.value)
                      }
                      onBlur={handleSectionBlur}
                      rows={
                        label === "PLAN" ? 6 : label === "SUBJECTIVE" ? 5 : 4
                      }
                      disabled={loading || isSigned || isVoid}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink font-mono leading-relaxed focus:border-hilt-blue focus:outline-none resize-y disabled:bg-gray-50 disabled:opacity-70"
                    />
                  </div>
                ))}

                {/* Regenerate button */}
                {!isSigned && !isVoid && (
                  <button
                    onClick={handleRegenerate}
                    disabled={loading}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-slate hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Regenerating..." : "Regenerate draft"}
                  </button>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="mt-4 text-xs text-red-600">{error}</p>
            )}
          </div>

          {/* ── Right column: actions ── */}
          <div className="lg:col-span-4 overflow-y-auto p-5">
            <h2 className="text-xs font-semibold text-slate uppercase tracking-wider mb-4">
              Actions
            </h2>

            <div className="space-y-5">
              {/* Copy to EMR */}
              <div>
                <button
                  onClick={handleCopyToEMR}
                  disabled={!hasDraft || isDrafting}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-ink hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy to EMR
                </button>
                <p className="text-[10px] text-ash mt-1 text-center">
                  Copies the full SOAP note as plain text
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Sign and export */}
              {!isSigned && !isVoid && (
                <div>
                  <h3 className="text-sm font-semibold text-ink mb-3">
                    Sign and Export PDF
                  </h3>

                  {/* Attestation */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 mb-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attested}
                        onChange={(e) => setAttested(e.target.checked)}
                        disabled={!hasDraft || isDrafting || loading}
                        className="mt-0.5 rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
                      />
                      <p className="text-xs text-ink leading-relaxed">
                        I confirm this clinical document is accurate, complete,
                        and reflects my clinical judgment. I have reviewed the
                        content and accept responsibility for its use in patient
                        care.
                      </p>
                    </label>
                  </div>

                  <button
                    onClick={handleSign}
                    disabled={!attested || loading || !hasDraft || isDrafting}
                    className="w-full rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Spinner />
                        Signing...
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Sign
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Signed: download PDF */}
              {isSigned && (
                <div>
                  <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4 text-center mb-4">
                    <svg
                      className="h-8 w-8 mx-auto mb-2 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm font-semibold text-green-800">
                      SOAP note signed
                    </p>
                  </div>

                  {pdfUrl && (
                    <button
                      onClick={handleDownloadPdf}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-hilt-blue hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Download PDF
                    </button>
                  )}

                  <button
                    onClick={onComplete}
                    className="w-full mt-3 rounded-lg bg-hilt-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}

              {/* Void button (for signed docs) */}
              {isSigned && !voidConfirm && (
                <div>
                  <div className="border-t border-gray-100 my-4" />
                  <button
                    onClick={() => setVoidConfirm(true)}
                    className="w-full rounded-lg border border-red-200 px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                      />
                    </svg>
                    Void Document
                  </button>
                </div>
              )}

              {/* Void confirmation */}
              {voidConfirm && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-medium text-red-800 mb-2">
                    Void this SOAP note? This cannot be undone.
                  </p>
                  <input
                    type="text"
                    placeholder="Reason for voiding"
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm text-ink placeholder:text-ash focus:border-red-400 focus:outline-none mb-2"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleVoid}
                      disabled={voiding || !voidReason.trim()}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {voiding ? "Voiding..." : "Confirm Void"}
                    </button>
                    <button
                      onClick={() => {
                        setVoidConfirm(false);
                        setVoidReason("");
                      }}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-slate hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Voided state */}
              {isVoid && (
                <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 text-center">
                  <p className="text-sm font-semibold text-red-800">
                    Document voided
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-3 rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-slate hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
