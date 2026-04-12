"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchDocumentsForVisit,
  voidDocument,
} from "@/app/(dashboard)/d/_actions/documents";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Document {
  id: string;
  document_type: string;
  template_key: string;
  display_name: string;
  status: string;
  content_body: string | null;
  pdf_url: string | null;
  created_at: string;
  creator_name: string | null;
}

interface DocumentHistoryProps {
  visitId: string;
}

const TYPE_ICONS: Record<string, string> = {
  letter: "\u2709\uFE0F",
  soap_note: "\uD83D\uDCCB",
  prescription: "\uD83D\uDC8A",
  referral: "\uD83D\uDD17",
  lab_order: "\uD83E\uDDEA",
  imaging_order: "\uD83D\uDCF7",
};

function StatusPill({ status }: { status: string }) {
  let className: string;

  switch (status) {
    case "draft":
      className = "bg-gray-100 text-gray-600";
      break;
    case "drafted":
    case "editing":
      className = "bg-yellow-100 text-yellow-700";
      break;
    case "signed":
      className = "bg-green-100 text-green-700";
      break;
    case "sent":
      className = "bg-blue-100 text-blue-700";
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
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

function ShimmerRow() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-gray-100" />
          <div className="h-4 w-32 rounded bg-gray-100" />
          <div className="h-5 w-16 rounded-full bg-gray-100" />
        </div>
        <div className="h-3 w-24 rounded bg-gray-100" />
      </div>
      <div className="mt-2 h-3 w-3/4 rounded bg-gray-100" />
    </div>
  );
}

export default function DocumentHistory({
  visitId,
}: DocumentHistoryProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voidConfirmId, setVoidConfirmId] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    const result = await fetchDocumentsForVisit(visitId);
    if (result.success) {
      setDocuments((result.documents as Document[]) ?? []);
    }
    setLoading(false);
  }, [visitId]);

  // Initial fetch
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Poll every 10s
  useEffect(() => {
    const interval = setInterval(() => {
      loadDocuments();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadDocuments]);

  async function handleViewPdf(pdfUrl: string) {
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

  async function handleVoid(documentId: string) {
    if (!voidReason.trim()) {
      toast.error("Please provide a reason for voiding");
      return;
    }

    setVoidingId(documentId);
    const result = await voidDocument(documentId, voidReason.trim());

    if (result.success) {
      toast.success("Document voided");
      setVoidConfirmId(null);
      setVoidReason("");
      await loadDocuments();
    } else {
      toast.error(result.error || "Failed to void document");
    }
    setVoidingId(null);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <ShimmerRow />
        <ShimmerRow />
        <ShimmerRow />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-slate text-center py-8">
        No documents yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => {
        const icon =
          TYPE_ICONS[doc.document_type] || TYPE_ICONS[doc.template_key?.split("_")[0] ?? ""] || "\uD83D\uDCC4";
        const preview =
          doc.content_body && doc.content_body.length > 100
            ? doc.content_body.slice(0, 100) + "..."
            : doc.content_body;
        const canVoid = doc.status === "signed" || doc.status === "sent";

        return (
          <div
            key={doc.id}
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="text-base flex-shrink-0">{icon}</span>
                <h3 className="text-sm font-semibold text-ink">
                  {doc.display_name || doc.template_key}
                </h3>
                <StatusPill status={doc.status} />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate flex-shrink-0 ml-3">
                {doc.creator_name && (
                  <span>{doc.creator_name}</span>
                )}
                <span>
                  {new Date(doc.created_at).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Content preview */}
            {preview && (
              <p className="mt-2 text-xs text-ash line-clamp-2 leading-relaxed">
                {preview}
              </p>
            )}

            {/* Actions */}
            <div className="mt-3 flex items-center gap-3">
              {doc.pdf_url && (
                <button
                  onClick={() => handleViewPdf(doc.pdf_url!)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-hilt-blue hover:underline"
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
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  View PDF
                </button>
              )}

              {canVoid && voidConfirmId !== doc.id && (
                <button
                  onClick={() => {
                    setVoidConfirmId(doc.id);
                    setVoidReason("");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:underline"
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
                  Void
                </button>
              )}
            </div>

            {/* Void confirmation */}
            {voidConfirmId === doc.id && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-xs font-medium text-red-800 mb-2">
                  Void this document? This cannot be undone.
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
                    onClick={() => handleVoid(doc.id)}
                    disabled={voidingId === doc.id || !voidReason.trim()}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {voidingId === doc.id ? "Voiding..." : "Confirm Void"}
                  </button>
                  <button
                    onClick={() => {
                      setVoidConfirmId(null);
                      setVoidReason("");
                    }}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-slate hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
