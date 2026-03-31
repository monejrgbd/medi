"use client";

interface Props {
  data: {
    total_sent: number;
    total_received: number;
    by_status: Record<string, number>;
    by_specialty: Record<string, number>;
    by_source?: Record<string, number>;
    top_sending_clinics: { org_name: string; count: number; arrived: number; pending: number }[];
  };
}

const statusColors: Record<string, string> = {
  sent: "bg-slate-500",
  viewed: "bg-blue-400",
  patient_arrived: "bg-green-500",
  completed: "bg-purple-500",
  expired: "bg-red-400",
};

const statusLabels: Record<string, string> = {
  sent: "Sent",
  viewed: "Viewed",
  patient_arrived: "Arrived",
  completed: "Completed",
  expired: "Expired",
};

export default function ReferralAnalyticsChart({ data }: Props) {
  const statusEntries = Object.entries(data.by_status).sort(
    ([, a], [, b]) => b - a
  );
  const specialtyEntries = Object.entries(data.by_specialty).sort(
    ([, a], [, b]) => b - a
  );
  const maxStatus = Math.max(...statusEntries.map(([, v]) => v), 1);
  const maxSpecialty = Math.max(...specialtyEntries.map(([, v]) => v), 1);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-slate uppercase">Total sent</p>
          <p className="mt-1 text-2xl font-bold text-ink">{data.total_sent}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-slate uppercase">Total received</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{data.total_received}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-slate uppercase">Specialties</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{specialtyEntries.length}</p>
        </div>
      </div>

      {/* By source */}
      {data.by_source && Object.keys(data.by_source).length > 1 && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate">Referral Sources:</span>
          {Object.entries(data.by_source).map(([source, count]) => (
            <span
              key={source}
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                source === "self_reported"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {source === "self_reported" ? "Self Reported" : "Hilt"}: {count}
            </span>
          ))}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* By status */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold text-ink mb-4">By status</p>
          {statusEntries.length === 0 ? (
            <p className="text-sm text-slate">No referrals in this period</p>
          ) : (
            <div className="space-y-3">
              {statusEntries.map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="w-20 text-sm text-slate shrink-0">
                    {statusLabels[status] || status}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded overflow-hidden">
                    <div
                      className={`h-8 rounded flex items-center px-3 text-white text-sm font-medium ${statusColors[status] || "bg-gray-400"}`}
                      style={{ width: `${(count / maxStatus) * 100}%`, minWidth: "40px" }}
                    >
                      {count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By specialty + top clinics */}
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm font-semibold text-ink mb-4">By specialty</p>
            {specialtyEntries.length === 0 ? (
              <p className="text-sm text-slate">No referrals in this period</p>
            ) : (
              <div className="space-y-3">
                {specialtyEntries.map(([specialty, count]) => (
                  <div key={specialty} className="flex items-center gap-3">
                    <span className="w-28 text-sm text-slate shrink-0 truncate">{specialty}</span>
                    <div className="flex-1 bg-gray-100 rounded overflow-hidden">
                      <div
                        className="h-8 rounded bg-hilt-blue flex items-center px-3 text-white text-sm font-medium"
                        style={{ width: `${(count / maxSpecialty) * 100}%`, minWidth: "40px" }}
                      >
                        {count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top referring clinics */}
          {data.top_sending_clinics.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <div className="p-4 pb-0">
                <p className="text-sm font-semibold text-ink mb-4">Top referring clinics</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate uppercase">Clinic</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate uppercase">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate uppercase">Arrived</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate uppercase">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_sending_clinics.map((c) => (
                    <tr key={c.org_name} className="border-b border-gray-50">
                      <td className="px-4 py-3 font-medium text-ink">{c.org_name}</td>
                      <td className="px-4 py-3 text-right text-slate">{c.count}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">{c.arrived}</td>
                      <td className="px-4 py-3 text-right text-amber-600 font-medium">{c.pending}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
