"use client";

interface CheckinEntry {
  staff_user_id: string;
  full_name: string;
  checked_in_at: string;
  checked_out_at: string | null;
}

interface TimeSlot {
  staff_user_id: string;
  visit_id: string;
  patient_name: string;
  entered_queue_at: string | null;
  claimed_at: string | null;
  completed_at: string | null;
}

interface Props {
  checkinLog: CheckinEntry[];
  timeSlots: TimeSlot[];
}

function fmtTime(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function durationMins(start: string | null, end: string | null) {
  if (!start || !end) return "—";
  const mins = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60000
  );
  return `${mins}m`;
}

export default function EmployeeDetail({ checkinLog, timeSlots }: Props) {
  return (
    <div className="space-y-4 px-4 pb-4">
      {/* Check-in log */}
      {checkinLog.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate uppercase mb-2">
            Check-in / Check-out Log
          </h4>
          <div className="space-y-1">
            {checkinLog.map((entry, i) => {
              const hasGap =
                i > 0 &&
                checkinLog[i - 1].checked_out_at &&
                entry.checked_in_at &&
                new Date(entry.checked_in_at).getTime() -
                  new Date(checkinLog[i - 1].checked_out_at!).getTime() >
                  15 * 60000;
              return (
                <div key={`${entry.checked_in_at}-${i}`}>
                  {hasGap && (
                    <div className="text-xs text-amber-600 italic pl-2">
                      gap
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span>{fmtTime(entry.checked_in_at)}</span>
                    <span className="text-slate">&rarr;</span>
                    <span>
                      {entry.checked_out_at
                        ? fmtTime(entry.checked_out_at)
                        : "Active"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Patient time slots */}
      {timeSlots.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate uppercase mb-2">
            Patient Visits
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate border-b border-gray-100">
                  <th className="pb-2 pr-4">Patient</th>
                  <th className="pb-2 pr-4">Queued</th>
                  <th className="pb-2 pr-4">Claimed</th>
                  <th className="pb-2 pr-4">Completed</th>
                  <th className="pb-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot) => (
                  <tr
                    key={slot.visit_id}
                    className="border-b border-gray-50"
                  >
                    <td className="py-1.5 pr-4">{slot.patient_name}</td>
                    <td className="py-1.5 pr-4">
                      {fmtTime(slot.entered_queue_at)}
                    </td>
                    <td className="py-1.5 pr-4">
                      {fmtTime(slot.claimed_at)}
                    </td>
                    <td className="py-1.5 pr-4">
                      {fmtTime(slot.completed_at)}
                    </td>
                    <td className="py-1.5">
                      {durationMins(slot.claimed_at, slot.completed_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {checkinLog.length === 0 && timeSlots.length === 0 && (
        <p className="text-sm text-slate">No detailed data available.</p>
      )}
    </div>
  );
}
