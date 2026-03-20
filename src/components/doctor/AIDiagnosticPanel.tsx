"use client";

interface AIDiagnosticPanelProps {
  diagnostic?: string | null;
  loading?: boolean;
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

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0a.5.5 0 0 1 .473.338L9.82 4.18l3.842 1.347a.5.5 0 0 1 0 .946L9.82 7.82 8.473 11.662a.5.5 0 0 1-.946 0L6.18 7.82 2.338 6.473a.5.5 0 0 1 0-.946L6.18 4.18 7.527.338A.5.5 0 0 1 8 0Z" />
    </svg>
  );
}

export default function AIDiagnosticPanel({
  diagnostic,
  loading = false,
}: AIDiagnosticPanelProps) {
  if (!diagnostic && !loading) return null;

  // Loading skeleton
  if (loading && !diagnostic) {
    return (
      <div className="rounded-lg border border-violet-100 bg-gradient-to-r from-violet-50/60 to-transparent px-4 py-3.5">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-500" />
          <span className="text-xs font-medium text-violet-500">Analyzing patient data...</span>
        </div>
        <div className="space-y-2 animate-pulse">
          <div className="h-5 w-44 rounded-md bg-violet-100/80" />
          <div className="h-3.5 w-3/4 rounded-md bg-violet-50" />
        </div>
      </div>
    );
  }

  if (!diagnostic) return null;

  const data = parseDiagnostic(diagnostic);

  return (
    <div className="rounded-lg border border-violet-200/80 bg-gradient-to-r from-violet-50/80 to-white overflow-hidden">
      <div className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 mb-2">
          <SparkleIcon className="h-3.5 w-3.5 text-violet-500" />
          <span className="text-[11px] font-semibold text-violet-600 uppercase tracking-wider">
            AI Suggestion
          </span>
        </div>
        {data ? (
          <>
            <p className="text-lg font-bold text-ink leading-tight">{data.diagnosis}</p>
            <p className="mt-1.5 text-sm text-slate leading-relaxed">{data.reasoning}</p>
          </>
        ) : (
          <div className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{diagnostic}</div>
        )}
        <p className="mt-2.5 text-[11px] text-slate/50">
          AI makes mistakes. Use your own clinical judgement.
        </p>
      </div>
    </div>
  );
}
