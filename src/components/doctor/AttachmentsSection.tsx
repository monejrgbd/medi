"use client";

import { useState, useRef } from "react";
import {
  uploadAttachment,
  fetchAttachmentUrl,
} from "@/app/(dashboard)/d/_actions/doctor";

interface Attachment {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploader_name: string;
  created_at: string;
  signed_url?: string;
}

interface AttachmentsSectionProps {
  visitId: string;
  initialAttachments: Attachment[];
  canUpload: boolean;
}

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_SIZE = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export default function AttachmentsSection({
  visitId,
  initialAttachments,
  canUpload,
}: AttachmentsSectionProps) {
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleViewFile(att: Attachment) {
    if (att.signed_url) {
      window.open(att.signed_url, "_blank");
      return;
    }
    if (!att.file_url) return;

    const result = await fetchAttachmentUrl(att.file_url);
    if (result.success && result.url) {
      setAttachments((prev) =>
        prev.map((a) => (a.id === att.id ? { ...a, signed_url: result.url } : a))
      );
      window.open(result.url, "_blank");
    }
  }

  async function handleUpload(file: File) {
    if (file.size === 0) {
      setError("File is empty");
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("File type not allowed. Supported: JPEG, PNG, GIF, WebP, PDF, DOC, DOCX");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("File exceeds 10MB limit");
      return;
    }

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadAttachment(visitId, formData);
    if (result.success) {
      setAttachments((prev) => [
        ...prev,
        {
          id: result.attachment_id || crypto.randomUUID(),
          file_url: result.file_url || "",
          file_name: file.name.replace(/[^a-zA-Z0-9._-]/g, "_"),
          file_size: file.size,
          mime_type: file.type,
          uploader_name: "You",
          created_at: new Date().toISOString(),
          signed_url: result.signed_url || undefined,
        },
      ]);
    } else {
      setError(result.error || "Failed to upload");
    }
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  }

  return (
    <div>
      {attachments.length === 0 && !canUpload ? (
        <p className="text-sm text-ash text-center py-4">No attachments.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-4">
          {attachments.map((att) => (
            <button
              key={att.id}
              onClick={() => handleViewFile(att)}
              disabled={!att.file_url}
              className="rounded-lg border border-gray-200 bg-white p-3 text-left hover:border-hilt-blue hover:bg-blue-50/30 transition-colors disabled:opacity-60 disabled:cursor-default"
            >
              <div className="flex items-start gap-3">
                {isImage(att.mime_type) && att.signed_url ? (
                  <img
                    src={att.signed_url}
                    alt={att.file_name}
                    className="h-12 w-12 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="shrink-0 rounded-lg bg-gray-100 p-2">
                    {isImage(att.mime_type) ? (
                      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">{att.file_name}</p>
                  <p className="text-xs text-ash">
                    {formatFileSize(att.file_size)} &middot; {att.uploader_name}
                  </p>
                  <p className="text-[10px] text-ash">
                    {new Date(att.created_at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {att.file_url && (
                    <p className="text-[10px] text-hilt-blue mt-0.5">Click to view/download</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {canUpload && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragOver
              ? "border-hilt-blue bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-hilt-blue" />
              <span className="text-sm text-slate">Uploading...</span>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate mb-2">
                Drag and drop a file or{" "}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-hilt-blue font-medium hover:underline"
                >
                  browse files
                </button>
              </p>
              <p className="text-xs text-ash">
                JPEG, PNG, GIF, WebP, PDF, DOC, DOCX &middot; Max 10MB
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
