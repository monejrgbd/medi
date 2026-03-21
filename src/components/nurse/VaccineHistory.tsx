"use client";

interface VaccineRecord {
  id: string;
  vaccine_name: string;
  dose_number: number | null;
  lot_number: string | null;
  manufacturer: string | null;
  site: string | null;
  refused: boolean;
  refusal_reason: string | null;
  notes: string | null;
  administered_at: string;
  administered_by_name: string;
}

interface VaccineHistoryProps {
  records: VaccineRecord[];
}

const SITE_LABELS: Record<string, string> = {
  left_deltoid: "Left Deltoid",
  right_deltoid: "Right Deltoid",
  left_thigh: "Left Thigh",
  right_thigh: "Right Thigh",
  left_gluteal: "Left Gluteal",
  right_gluteal: "Right Gluteal",
  subcutaneous: "Subcutaneous",
  intranasal: "Intranasal",
  oral: "Oral",
};

export default function VaccineHistory({ records }: VaccineHistoryProps) {
  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-8 text-center">
        <p className="text-sm text-slate">No vaccine records yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <h3 className="text-sm font-semibold text-ink px-4 pt-4 pb-2">Vaccine History</h3>
      <div className="space-y-2 px-4 pb-4">
        {records.map((r) => (
          <div
            key={r.id}
            className={`rounded-lg border p-3 ${
              r.refused
                ? "border-amber-200 bg-amber-50"
                : "border-gray-100 bg-gray-50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-ink">
                  {r.vaccine_name}
                  {r.dose_number && (
                    <span className="text-xs text-slate ml-2">Dose #{r.dose_number}</span>
                  )}
                </p>
                {r.refused ? (
                  <p className="mt-1 text-xs text-amber-700">
                    Refused: {r.refusal_reason || "No reason provided"}
                  </p>
                ) : (
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate">
                    {r.lot_number && <span>Lot: {r.lot_number}</span>}
                    {r.manufacturer && <span>{r.manufacturer}</span>}
                    {r.site && <span>{SITE_LABELS[r.site] || r.site}</span>}
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-slate">
                  {new Date(r.administered_at).toLocaleDateString()}
                </p>
                <p className="text-[10px] text-ash">{r.administered_by_name}</p>
              </div>
            </div>
            {r.notes && (
              <p className="mt-1.5 text-[10px] text-slate border-t border-gray-100 pt-1.5">{r.notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
