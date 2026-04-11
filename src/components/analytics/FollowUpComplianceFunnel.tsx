"use client";

import { useState } from "react";

interface Funnel {
  tagged: number;
  returned: number;
  overdue: number;
  reminded: number;
  returned_after_reminder: number;
  expired: number;
}

interface PerDoctor {
  staff_user_id: string;
  full_name: string;
  tagged: number;
  returned: number;
  compliance_rate: number;
}

interface ComplianceData {
  funnel?: Funnel;
  per_doctor?: PerDoctor[];
}

interface Props {
  data: ComplianceData;
}

type SortKey = "full_name" | "tagged" | "returned" | "compliance_rate";

export default function FollowUpComplianceFunnel({ data }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("compliance_rate");
  const [sortAsc, setSortAsc] = useState(false);

  if (!data.funnel || data.funnel.tagged === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-slate">
        No follow-ups created in this date range.
      </div>
    );
  }

  const { funnel } = data;
  const total = funnel.tagged;
  const totalReturned = funnel.returned + funnel.returned_after_reminder;
  const complianceRate = total > 0 ? (totalReturned / total) * 100 : 0;

  const bars = [
    { label: "Tagged for Follow-up", value: funnel.tagged, color: "#3b82f6" },
    { label: "Returned (Completed)", value: funnel.returned, color: "#10b981" },
    { label: "Overdue", value: funnel.overdue, color: "#f59e0b" },
    { label: "Reminded (SMS sent)", value: funnel.reminded, color: "#8b5cf6" },
    {
      label: "Returned After Reminder",
      value: funnel.returned_after_reminder,
      color: "#06b6d4",
    },
  ];

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "full_name");
    }
  }

  const doctors = data.per_doctor ? [...data.per_doctor].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  }) : [];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-slate uppercase">Compliance rate</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{complianceRate.toFixed(0)}%</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-slate uppercase">Tagged</p>
          <p className="mt-1 text-2xl font-bold text-ink">{funnel.tagged}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-slate uppercase">Returned</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{totalReturned}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-slate uppercase">Overdue</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{funnel.overdue}</p>
        </div>
      </div>

      {/* Funnel */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-ink mb-4">
          Follow-up Funnel
        </h3>
        <div className="space-y-3">
          {bars.map((bar) => {
            const pct = total > 0 ? (bar.value / total) * 100 : 0;
            const width = Math.max(pct, 4);
            return (
              <div key={bar.label} className="flex items-center gap-3">
                <div className="w-28 sm:w-44 text-xs sm:text-sm text-slate flex-shrink-0 text-right">
                  {bar.label}
                </div>
                <div className="flex-1">
                  <div
                    className="h-8 rounded flex items-center px-3 text-white text-sm font-medium transition-all"
                    style={{
                      width: `${width}%`,
                      backgroundColor: bar.color,
                      minWidth: "40px",
                    }}
                  >
                    {bar.value}
                  </div>
                </div>
                <div className="w-12 text-xs text-slate text-right">
                  {pct.toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
          <div className="w-28 sm:w-44 text-xs sm:text-sm text-slate text-right">Expired</div>
          <div className="text-sm font-medium text-red-600">
            {funnel.expired}
          </div>
          <div className="text-xs text-slate">
            ({total > 0 ? ((funnel.expired / total) * 100).toFixed(0) : 0}%)
          </div>
        </div>
      </div>

      {/* Per-doctor table */}
      {doctors.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {(
                  [
                    { key: "full_name" as SortKey, label: "Doctor" },
                    { key: "tagged" as SortKey, label: "Tagged" },
                    { key: "returned" as SortKey, label: "Returned" },
                    { key: "compliance_rate" as SortKey, label: "Compliance %" },
                  ] as const
                ).map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate uppercase cursor-pointer hover:text-ink select-none"
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span className="ml-1">{sortAsc ? "↑" : "↓"}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc) => (
                <tr key={doc.staff_user_id} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-medium">{doc.full_name}</td>
                  <td className="px-4 py-3">{doc.tagged}</td>
                  <td className="px-4 py-3">{doc.returned}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        doc.compliance_rate >= 70
                          ? "text-green-600"
                          : doc.compliance_rate >= 40
                          ? "text-amber-600"
                          : "text-red-600"
                      }
                    >
                      {doc.compliance_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
