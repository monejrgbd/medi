"use client";

import StructuredCard from "@/components/patient/StructuredCard";

interface SummaryDisplayProps {
  summary: string | null;
  structuredCard: Record<string, unknown> | null;
}

export default function SummaryDisplay({
  summary,
  structuredCard,
}: SummaryDisplayProps) {
  if (!summary && !structuredCard) {
    return (
      <p className="text-sm text-slate text-center py-8">
        No summary available.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {summary && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-ink mb-2">AI Summary</h3>
          <p className="text-sm text-ink whitespace-pre-wrap">{summary}</p>
        </div>
      )}

      {structuredCard && (
        <StructuredCard
          data={structuredCard as Parameters<typeof StructuredCard>[0]["data"]}
        />
      )}

      <p className="text-xs text-slate italic">
        AI-generated summary approved by patient. Refer to full transcript for accuracy.
      </p>
    </div>
  );
}
