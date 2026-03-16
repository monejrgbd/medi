"use client";

import { Fragment, useState } from "react";
import EmployeeDetail from "./EmployeeDetail";

interface Employee {
  staff_user_id: string;
  full_name: string;
  role: string;
  shift_hours: number;
  utilization: number | null;
  patients_handled: number;
  throughput: number | null;
  avg_handling_minutes: number | null;
  idle_hours: number | null;
}

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

interface EmployeeStats {
  employees: Employee[];
  checkin_log: CheckinEntry[];
  time_slots: TimeSlot[];
}

interface Props {
  data: EmployeeStats;
}

type SortKey = keyof Employee;

function fmtVal(val: number | null, suffix = ""): string {
  if (val === null || val === undefined) return "N/A";
  return `${val}${suffix}`;
}

export default function EmployeeStatsTable({ data }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("full_name");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!data.employees || data.employees.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-slate">
        No staff checked in on this date.
      </div>
    );
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const sorted = [...data.employees].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal === null && bVal === null) return 0;
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  // Summary row
  const totalHours = data.employees.reduce((s, e) => s + (e.shift_hours || 0), 0);
  const totalPatients = data.employees.reduce((s, e) => s + (e.patients_handled || 0), 0);
  const doctors = data.employees.filter((e) => e.role === "doctor");
  const doctorsWithData = doctors.filter((e) => e.avg_handling_minutes != null);
  const avgHandling =
    doctorsWithData.length > 0
      ? doctorsWithData.reduce((s, e) => s + e.avg_handling_minutes!, 0) / doctorsWithData.length
      : null;

  const columns: { key: SortKey; label: string; doctorOnly?: boolean; hideOnMobile?: boolean }[] = [
    { key: "full_name", label: "Name" },
    { key: "role", label: "Role" },
    { key: "shift_hours", label: "Hours" },
    { key: "utilization", label: "Utilization", hideOnMobile: true },
    { key: "patients_handled", label: "Patients" },
    { key: "throughput", label: "Throughput", hideOnMobile: true },
    { key: "avg_handling_minutes", label: "Avg Handling", doctorOnly: true, hideOnMobile: true },
    { key: "idle_hours", label: "Idle Time", doctorOnly: true, hideOnMobile: true },
  ];

  const avgUtil = data.employees.filter(e => e.utilization != null);
  const avgUtilization = avgUtil.length > 0
    ? avgUtil.reduce((s, e) => s + e.utilization!, 0) / avgUtil.length
    : null;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-slate uppercase">Active staff</p>
          <p className="mt-1 text-2xl font-bold text-ink">{data.employees.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-slate uppercase">Avg utilization</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{avgUtilization !== null ? `${avgUtilization.toFixed(0)}%` : "N/A"}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-slate uppercase">Total hours</p>
          <p className="mt-1 text-2xl font-bold text-ink">{totalHours.toFixed(1)}<span className="text-sm text-slate ml-0.5">hrs</span></p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-slate uppercase">Total patients</p>
          <p className="mt-1 text-2xl font-bold text-ink">{totalPatients}</p>
        </div>
      </div>

    <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`px-4 py-3 text-left text-xs font-semibold text-slate uppercase cursor-pointer hover:text-ink select-none whitespace-nowrap${col.hideOnMobile ? " hidden sm:table-cell" : ""}`}
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
          {sorted.map((emp) => {
            const isExpanded = expandedId === emp.staff_user_id;
            return (
              <Fragment key={emp.staff_user_id}>
                <tr
                  onClick={() =>
                    setExpandedId(isExpanded ? null : emp.staff_user_id)
                  }
                  className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-ink">
                    {emp.full_name}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate">
                    {emp.role}
                  </td>
                  <td className="px-4 py-3">
                    {fmtVal(emp.shift_hours, "h")}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {fmtVal(emp.utilization, "%")}
                  </td>
                  <td className="px-4 py-3">
                    {emp.patients_handled}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {fmtVal(emp.throughput, "/h")}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {emp.role === "doctor"
                      ? fmtVal(emp.avg_handling_minutes, "m")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {emp.role === "doctor"
                      ? fmtVal(emp.idle_hours, "h")
                      : "—"}
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={columns.length} className="p-0 border-b border-gray-100 bg-gray-50/50">
                      <EmployeeDetail
                        checkinLog={data.checkin_log.filter(
                          (c) => c.staff_user_id === emp.staff_user_id
                        )}
                        timeSlots={data.time_slots.filter(
                          (t) => t.staff_user_id === emp.staff_user_id
                        )}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
          {/* Summary row */}
          <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
            <td className="px-4 py-3">Total</td>
            <td className="px-4 py-3">{data.employees.length} staff</td>
            <td className="px-4 py-3">{totalHours.toFixed(1)}h</td>
            <td className="px-4 py-3">—</td>
            <td className="px-4 py-3">{totalPatients}</td>
            <td className="px-4 py-3">—</td>
            <td className="px-4 py-3">
              {avgHandling !== null ? `${avgHandling.toFixed(1)}m` : "—"}
            </td>
            <td className="px-4 py-3">—</td>
          </tr>
        </tbody>
      </table>
    </div>
    </div>
  );
}
