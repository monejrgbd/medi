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
import DateRangePicker from "@/components/analytics/DateRangePicker";
import EmployeeStatsTable from "@/components/analytics/EmployeeStatsTable";
import PatientStatsCards from "@/components/analytics/PatientStatsCards";
import PatientTrendChart from "@/components/analytics/PatientTrendChart";
import WaitTimeHeatmap from "@/components/analytics/WaitTimeHeatmap";
import ReturnRateChart from "@/components/analytics/ReturnRateChart";
import FollowUpComplianceFunnel from "@/components/analytics/FollowUpComplianceFunnel";
import PatientSearch from "@/components/dashboard/PatientSearch";

type Tab = "employees" | "patients" | "waittimes" | "returns" | "followups";

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
    { key: "returns", label: "Returns", ownerOnly: true },
    { key: "followups", label: "Follow-ups", hidden: !followupAddonEnabled },
  ];

  const visibleTabs = tabs.filter(
    (t) => !t.hidden && (!t.ownerOnly || isOwner)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Analytics</h1>
          <p className="text-sm text-slate mt-1">
            Performance metrics and patient flow insights
          </p>
        </div>
        <Link
          href="/d/select-role"
          className="text-sm text-slate hover:text-ink transition-colors"
        >
          &larr; Back
        </Link>
      </div>

      {/* Patient search */}
      <div className="mb-4">
        <PatientSearch />
      </div>

      {/* Location selector */}
      {locations.length > 1 && activeTab !== "returns" && (
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
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-hilt-blue" />
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
        </>
      )}
    </div>
  );
}
