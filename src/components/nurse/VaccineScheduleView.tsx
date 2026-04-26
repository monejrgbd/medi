"use client";

import { useState, useEffect, useTransition } from "react";
import {
  fetchVaccineSchedule,
  addVaccineScheduleEntry,
  fetchVaccinesMasterList,
} from "@/app/(dashboard)/d/_actions/nurse";
import { DateInput } from "@/components/ui/DateInput";

interface ScheduleEntry {
  id: string;
  vaccine_name: string;
  vaccine_id: string;
  dose_number: number | null;
  due_date: string;
  status: string;
}

interface Vaccine {
  id: string;
  name: string;
  code: string;
}

interface VaccineScheduleViewProps {
  patientId: string;
}

export default function VaccineScheduleView({ patientId }: VaccineScheduleViewProps) {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [vaccineId, setVaccineId] = useState("");
  const [doseNumber, setDoseNumber] = useState("1");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function load() {
      const res = await fetchVaccineSchedule(patientId);
      if (res.success) setSchedule(res.schedule ?? []);
      setLoading(false);
    }
    load();
  }, [patientId]);

  async function openForm() {
    if (vaccines.length === 0) {
      const res = await fetchVaccinesMasterList();
      if (res.success) setVaccines(res.vaccines ?? []);
    }
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!vaccineId) {
      setError("Please select a vaccine");
      return;
    }
    if (!dueDate) {
      setError("Please select a due date");
      return;
    }

    startTransition(async () => {
      const result = await addVaccineScheduleEntry({
        patientId,
        vaccineId,
        doseNumber: doseNumber ? parseInt(doseNumber) : undefined,
        dueDate,
      });

      if (result.success) {
        setShowForm(false);
        setVaccineId("");
        setDoseNumber("1");
        setDueDate("");
        // Refresh schedule
        const res = await fetchVaccineSchedule(patientId);
        if (res.success) setSchedule(res.schedule ?? []);
      } else {
        setError(result.error || "Failed to add schedule entry");
      }
    });
  }

  const today = new Date().toISOString().split("T")[0];
  const overdue = schedule.filter((s) => s.due_date < today && s.status === "pending");
  const upcoming = schedule.filter((s) => s.due_date >= today || s.status !== "pending");

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs text-slate">Loading schedule...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-ink">Vaccine Schedule</h3>
        <button
          onClick={openForm}
          className="text-xs font-medium text-teal-600 hover:text-teal-800 transition-colors"
        >
          + Schedule Vaccine
        </button>
      </div>

      {schedule.length === 0 && !showForm ? (
        <p className="text-xs text-slate text-center py-4">No scheduled vaccines</p>
      ) : (
        <div className="space-y-2">
          {overdue.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-600 mb-1">Overdue</p>
              {overdue.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-red-200 bg-red-50 p-2 mb-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-red-800">
                      {entry.vaccine_name}
                      {entry.dose_number && (
                        <span className="text-xs text-red-600 ml-1">Dose #{entry.dose_number}</span>
                      )}
                    </p>
                    <span className="text-xs text-red-600">
                      Due {new Date(entry.due_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {upcoming.length > 0 && (
            <div>
              {overdue.length > 0 && <p className="text-xs font-medium text-slate mb-1 mt-2">Upcoming</p>}
              {upcoming.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-gray-100 bg-gray-50 p-2 mb-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink">
                      {entry.vaccine_name}
                      {entry.dose_number && (
                        <span className="text-xs text-slate ml-1">Dose #{entry.dose_number}</span>
                      )}
                    </p>
                    <span className="text-xs text-slate">
                      Due {new Date(entry.due_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inline add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-3 rounded-lg border border-teal-200 bg-teal-50 p-3 space-y-2">
          <div>
            <label className="text-xs text-slate">Vaccine</label>
            <select
              value={vaccineId}
              onChange={(e) => setVaccineId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink focus:border-teal-500 focus:outline-none bg-white"
            >
              <option value="">Select a vaccine...</option>
              {vaccines.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate">Dose Number</label>
              <input
                type="number"
                min="1"
                max="10"
                value={doseNumber}
                onChange={(e) => setDoseNumber(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink focus:border-teal-500 focus:outline-none bg-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate">Due Date</label>
              <DateInput
                value={dueDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink focus:border-teal-500 focus:outline-none bg-white"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Adding..." : "Add to Schedule"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); }}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-slate hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
