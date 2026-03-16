"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  fetchEmployeeStats,
  fetchPatientStats,
  fetchWaitTimeHeatmap,
  fetchPatientReturnRate,
  fetchFollowUpCompliance,
} from "@/app/(dashboard)/d/_actions/analytics";
import { fetchReferralAnalytics } from "@/app/(dashboard)/d/_actions/referral";
import DateRangePicker from "@/components/analytics/DateRangePicker";
import EmployeeStatsTable from "@/components/analytics/EmployeeStatsTable";
import PatientStatsCards from "@/components/analytics/PatientStatsCards";
import PatientTrendChart from "@/components/analytics/PatientTrendChart";
import WaitTimeHeatmap from "@/components/analytics/WaitTimeHeatmap";
import ReturnRateChart from "@/components/analytics/ReturnRateChart";
import FollowUpComplianceFunnel from "@/components/analytics/FollowUpComplianceFunnel";
import ReferralAnalyticsChart from "@/components/analytics/ReferralAnalyticsChart";
import PatientSearch from "@/components/dashboard/PatientSearch";
import { TableSkeleton, CardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";

type Tab = "employees" | "patients" | "waittimes" | "returns" | "followups" | "referrals";

interface Props {
  locations: { id: string; name: string }[];
  orgId: string;
  isOwner: boolean;
  followupAddonEnabled: boolean;
}

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportCSV(data: any, tab: Tab) {
  if (!data) return;

  let csv = "";
  const filename = `hilt-${tab}-${formatDate(new Date())}.csv`;

  try {
    if (tab === "employees" && Array.isArray(data.employees)) {
      csv = "Name,Role,Shift Hours,Utilization %,Patients,Throughput/h,Avg Handling Min,Idle Min\n";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.employees.forEach((e: any) => {
        csv += `"${e.full_name}","${e.role}",${e.shift_hours ?? ""},${e.utilization ?? ""},${e.patients_handled ?? 0},${e.throughput ?? ""},${e.avg_handling_min ?? ""},${e.idle_min ?? ""}\n`;
      });
    } else if (tab === "patients" && data.daily) {
      csv = "Date,New Patients,Returning,Total\n";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.daily.forEach((d: any) => {
        csv += `${d.date},${d.new_patients ?? 0},${d.returning ?? 0},${d.total ?? 0}\n`;
      });
    } else if (tab === "waittimes" && Array.isArray(data)) {
      csv = "Hour,Day,Avg Wait Min,Patient Count\n";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.forEach((d: any) => {
        csv += `${d.hour},${d.day_of_week},${d.avg_wait_min ?? ""},${d.patient_count ?? 0}\n`;
      });
    } else {
      // Generic: stringify as JSON fallback
      csv = JSON.stringify(data, null, 2);
      const blob = new Blob([csv], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename.replace(".csv", ".json");
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    // silently fail
  }
}

export default function ManagerDashboard({
  locations,
  orgId,
  isOwner,
  followupAddonEnabled,
}: Props) {
  const [selectedLocation, setSelectedLocation] = useState(locations[0]?.id || "");
  const [activeTab, setActiveTab] = useState<Tab>("employees");
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [dateRange, setDateRange] = useState({
    start: formatDate(daysAgo(6)),
    end: formatDate(new Date()),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let result: any;
      switch (activeTab) {
        case "employees":
          result = await fetchEmployeeStats(selectedLocation, selectedDate);
          break;
        case "patients":
          result = await fetchPatientStats(selectedLocation, dateRange.start, dateRange.end);
          break;
        case "waittimes":
          result = await fetchWaitTimeHeatmap(selectedLocation, dateRange.start, dateRange.end);
          break;
        case "returns":
          result = await fetchPatientReturnRate(orgId, dateRange.start, dateRange.end);
          break;
        case "followups":
          result = await fetchFollowUpCompliance(selectedLocation, dateRange.start, dateRange.end);
          break;
        case "referrals":
          result = await fetchReferralAnalytics(dateRange.start, dateRange.end);
          if (result?.success && result.analytics) {
            result = result.analytics;
          }
          break;
      }
      if (result?.success === false) {
        setError(result.error || "Failed to load data");
        setData(null);
      } else {
        setData(result);
      }
    } catch {
      setError("Failed to load data");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedLocation, selectedDate, dateRange, orgId]);

  useEffect(() => {
    if (selectedLocation) loadData();
  }, [loadData, selectedLocation]);

  const tabs: { key: Tab; label: string; ownerOnly?: boolean; hidden?: boolean }[] = [
    { key: "employees", label: "Employees" },
    { key: "patients", label: "Patients" },
    { key: "waittimes", label: "Wait Times" },
    { key: "returns", label: "Returns" },
    { key: "followups", label: "Follow-ups", hidden: !followupAddonEnabled },
    { key: "referrals", label: "Referrals", ownerOnly: true },
  ];

  const visibleTabs = tabs.filter(
    (t) => !t.hidden && (!t.ownerOnly || isOwner)
  );

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-end">
        <div className="flex items-center gap-3">
          <Link
            href={`/d/manager/location/${selectedLocation}`}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-slate hover:text-ink hover:border-gray-300 transition-colors"
          >
            Location Settings
          </Link>
          <Link
            href="/d/select-role"
            className="text-sm text-slate hover:text-ink transition-colors"
          >
            &larr; Back
          </Link>
        </div>
      </div>

      {/* Patient search */}
      <div className="mb-4">
        <PatientSearch />
      </div>

      {/* Location selector */}
      {locations.length > 1 && activeTab !== "returns" && activeTab !== "referrals" && (
        <div className="mb-4">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tab bar */}
      <div className="mb-6 border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setData(null);
                // Reset date range to tab-specific default
                if (tab.key === "patients") {
                  setDateRange({ start: formatDate(daysAgo(6)), end: formatDate(new Date()) });
                } else if (tab.key !== "employees") {
                  setDateRange({ start: formatDate(daysAgo(29)), end: formatDate(new Date()) });
                }
              }}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-hilt-blue text-hilt-blue"
                  : "border-transparent text-slate hover:text-ink hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date picker */}
      <div className="mb-6">
        {activeTab === "employees" ? (
          <DateRangePicker
            mode="single"
            date={selectedDate}
            onDateChange={setSelectedDate}
          />
        ) : (
          <DateRangePicker
            mode="range"
            startDate={dateRange.start}
            endDate={dateRange.end}
            onApply={(start, end) => setDateRange({ start, end })}
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <>
          {activeTab === "employees" && <TableSkeleton rows={4} />}
          {activeTab === "patients" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          )}
          {(activeTab === "waittimes" || activeTab === "returns" || activeTab === "followups" || activeTab === "referrals") && (
            <ChartSkeleton />
          )}
        </>
      )}

      {/* Export button */}
      {!loading && data && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => exportCSV(data, activeTab)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-slate hover:text-ink hover:border-gray-300 transition-colors"
          >
            Download CSV
          </button>
        </div>
      )}

      {/* Tab content */}
      {!loading && data && (
        <>
          {activeTab === "employees" && (
            <EmployeeStatsTable data={data} />
          )}
          {activeTab === "patients" && (
            <div className="space-y-8">
              <PatientStatsCards stats={data.stats} />
              <PatientTrendChart daily={data.daily} />
            </div>
          )}
          {activeTab === "waittimes" && (
            <WaitTimeHeatmap data={data} />
          )}
          {activeTab === "returns" && (
            <ReturnRateChart data={data} />
          )}
          {activeTab === "followups" && (
            <FollowUpComplianceFunnel data={data} />
          )}
          {activeTab === "referrals" && (
            <ReferralAnalyticsChart data={data} />
          )}
        </>
      )}
    </div>
  );
}
