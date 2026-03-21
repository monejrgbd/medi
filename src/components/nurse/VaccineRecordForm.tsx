"use client";

import { useState, useEffect, useTransition } from "react";
import { recordVaccine, fetchVaccinesMasterList } from "@/app/(dashboard)/d/_actions/nurse";
import { INJECTION_SITES } from "@/lib/constants";

interface VaccineRecordFormProps {
  patientId: string;
  visitId: string;
  onRecorded: () => void;
}

interface Vaccine {
  id: string;
  name: string;
  code: string;
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

export default function VaccineRecordForm({ patientId, visitId, onRecorded }: VaccineRecordFormProps) {
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loadingVaccines, setLoadingVaccines] = useState(true);
  const [vaccineId, setVaccineId] = useState("");
  const [doseNumber, setDoseNumber] = useState("1");
  const [lotNumber, setLotNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [site, setSite] = useState("");
  const [refused, setRefused] = useState(false);
  const [refusalReason, setRefusalReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadVaccines() {
      const res = await fetchVaccinesMasterList();
      if (res.success) setVaccines(res.vaccines ?? []);
      setLoadingVaccines(false);
    }
    loadVaccines();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!vaccineId) {
      setError("Please select a vaccine");
      return;
    }

    if (refused && !refusalReason.trim()) {
      setError("Please provide a reason for refusal");
      return;
    }

    startTransition(async () => {
      const result = await recordVaccine({
        patientId,
        visitId,
        vaccineId,
        doseNumber: doseNumber ? parseInt(doseNumber) : undefined,
        lotNumber: refused ? undefined : lotNumber.trim() || undefined,
        manufacturer: refused ? undefined : manufacturer.trim() || undefined,
        site: refused ? undefined : site || undefined,
        refused,
        refusalReason: refused ? refusalReason.trim() : undefined,
        notes: notes.trim() || undefined,
      });

      if (result.success) {
        setSuccess(true);
        setVaccineId("");
        setDoseNumber("1");
        setLotNumber("");
        setManufacturer("");
        setSite("");
        setRefused(false);
        setRefusalReason("");
        setNotes("");
        onRecorded();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "Failed to record vaccine");
      }
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-ink mb-3">Record Vaccine</h3>

      {loadingVaccines ? (
        <p className="text-xs text-slate">Loading vaccines...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-slate">Vaccine</label>
            <select
              value={vaccineId}
              onChange={(e) => setVaccineId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink focus:border-teal-500 focus:outline-none"
            >
              <option value="">Select a vaccine...</option>
              {vaccines.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate">Dose Number</label>
              <input
                type="number"
                min="1"
                max="10"
                value={doseNumber}
                onChange={(e) => setDoseNumber(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Refusal toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={refused}
              onChange={(e) => setRefused(e.target.checked)}
              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm text-ink">Record Refusal</span>
          </label>

          {refused ? (
            <div>
              <label className="text-xs text-slate">Refusal Reason</label>
              <textarea
                value={refusalReason}
                onChange={(e) => setRefusalReason(e.target.value)}
                placeholder="Reason for refusal..."
                rows={2}
                maxLength={1000}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink placeholder:text-ash focus:border-teal-500 focus:outline-none resize-y"
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate">Lot Number (optional)</label>
                  <input
                    type="text"
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    placeholder="e.g. AB1234"
                    maxLength={100}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink placeholder:text-ash focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate">Manufacturer (optional)</label>
                  <input
                    type="text"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    placeholder="e.g. Pfizer"
                    maxLength={200}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink placeholder:text-ash focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate">Injection Site (optional)</label>
                <select
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink focus:border-teal-500 focus:outline-none"
                >
                  <option value="">Select site...</option>
                  {INJECTION_SITES.map((s) => (
                    <option key={s} value={s}>
                      {SITE_LABELS[s] || s}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="text-xs text-slate">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
              maxLength={2000}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink placeholder:text-ash focus:border-teal-500 focus:outline-none resize-y"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {success && <p className="text-xs text-green-600">Vaccine recorded successfully</p>}

          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Recording..." : refused ? "Record Refusal" : "Record Vaccine"}
          </button>
        </form>
      )}
    </div>
  );
}
