"use client";

interface AIDiagnosticPanelProps {
  diagnostic: string;
}

interface DiagnosticData {
  diagnosis: string;
  reasoning: string;
}

function parseDiagnostic(raw: string): DiagnosticData | null {
  try {
    const cleaned = raw.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.diagnosis && parsed.reasoning) return parsed;
  } catch {
    // not JSON
  }
  return null;
}

export default function AIDiagnosticPanel({
  diagnostic,
}: AIDiagnosticPanelProps) {
  const data = parseDiagnostic(diagnostic);

  return (
    <details open className="group rounded-lg border border-gray-200 bg-white">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-ink flex items-center justify-between">
        AI Diagnostic Suggestion
        <svg
          className="h-4 w-4 text-slate transition-transform group-open:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </summary>
      <div className="border-t border-gray-100 px-4 py-3">
        <p className="mb-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
          AI generated suggestion only. Refer to full transcript for accuracy.
        </p>
        {data ? (
          <div>
            <p className="text-lg font-bold text-ink">{data.diagnosis}</p>
            <p className="mt-1 text-sm text-slate">{data.reasoning}</p>
          </div>
        ) : (
          <div className="text-sm text-ink whitespace-pre-wrap">{diagnostic}</div>
        )}
      </div>
    </details>
  );
}
