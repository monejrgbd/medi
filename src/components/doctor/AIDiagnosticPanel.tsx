"use client";

interface AIDiagnosticPanelProps {
  diagnostic: string;
}

export default function AIDiagnosticPanel({
  diagnostic,
}: AIDiagnosticPanelProps) {
  return (
    <details className="rounded-lg border border-gray-200 bg-white">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-ink">
        AI Diagnostic Analysis
      </summary>
      <div className="border-t border-gray-100 px-4 py-3">
        <p className="mb-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
          AI-generated analysis — refer to full transcript for accuracy.
        </p>
        <div className="text-sm text-ink whitespace-pre-wrap">{diagnostic}</div>
      </div>
    </details>
  );
}
