"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

const tabs = ["Employees", "Patients", "Wait Times", "Returns", "Follow-ups", "Referrals"] as const;
type Tab = (typeof tabs)[number];

function StatCard({ label, value, unit, color }: { label: string; value: string; unit?: string; color?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
      <p className="text-[10px] sm:text-xs font-medium text-slate uppercase">{label}</p>
      <p className="mt-0.5 sm:mt-1 text-xl sm:text-2xl font-bold text-ink">{value}{unit && <span className={`text-xs sm:text-sm ml-0.5 ${color || "text-slate"}`}>{unit}</span>}</p>
    </div>
  );
}

function EmployeesTab() {
  const staff = [
    { name: "Dr. Chen", role: "Doctor", hours: 7.5, util: 87, patients: 18, throughput: "3.2/hr", avgHandling: "14m", idle: "1.0h" },
    { name: "Dr. Patel", role: "Doctor", hours: 6.8, util: 74, patients: 14, throughput: "2.8/hr", avgHandling: "16m", idle: "1.8h" },
    { name: "Amy R.", role: "Receptionist", hours: 8.0, util: 92, patients: 32, throughput: "5.1/hr", avgHandling: null, idle: null },
    { name: "Mark S.", role: "Receptionist", hours: 7.2, util: 88, patients: 29, throughput: "4.6/hr", avgHandling: null, idle: null },
  ];
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <StatCard label="Active staff" value="4" />
        <StatCard label="Avg utilization" value="85" unit="%" color="text-blue-600" />
        <StatCard label="Total hours" value="29.5" unit="hrs" />
        <StatCard label="Total patients" value="93" />
      </div>
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-slate uppercase">Name</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-slate uppercase">Role</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-semibold text-slate uppercase">Hours</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-semibold text-slate uppercase hidden sm:table-cell">Util.</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-semibold text-slate uppercase">Patients</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-semibold text-slate uppercase hidden sm:table-cell">Rate</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-semibold text-slate uppercase hidden sm:table-cell">Avg Handling</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-semibold text-slate uppercase hidden sm:table-cell">Idle</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(s => (
              <tr key={s.name} className="border-b border-gray-50">
                <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-ink">{s.name}</td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate capitalize">{s.role}</td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-slate">{s.hours}h</td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-slate hidden sm:table-cell">{s.util}%</td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-slate">{s.patients}</td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-slate hidden sm:table-cell">{s.throughput}</td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-slate hidden sm:table-cell">{s.avgHandling || "—"}</td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-slate hidden sm:table-cell">{s.idle || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PatientsTab() {
  const days = [
    { day: "Mon", total: 28, completed: 24, left: 3, denied: 1 },
    { day: "Tue", total: 32, completed: 29, left: 2, denied: 1 },
    { day: "Wed", total: 26, completed: 23, left: 2, denied: 1 },
    { day: "Thu", total: 35, completed: 31, left: 3, denied: 1 },
    { day: "Fri", total: 30, completed: 27, left: 2, denied: 1 },
  ];
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <StatCard label="Total patients" value="151" />
        <StatCard label="Avg AI time" value="4.1" unit="min" color="text-blue-600" />
        <StatCard label="Avg wait" value="6.3" unit="min" color="text-amber-600" />
        <StatCard label="Avg handling" value="12.4" unit="min" color="text-green-600" />
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
        <p className="text-xs sm:text-sm font-semibold text-ink mb-3 sm:mb-4">Daily breakdown</p>
        <div className="space-y-2.5">
          {days.map(d => (
            <div key={d.day} className="flex items-center gap-3">
              <span className="w-8 text-xs text-slate shrink-0">{d.day}</span>
              <div className="flex-1 flex h-5 rounded overflow-hidden">
                <div className="bg-green-500" style={{ width: `${(d.completed / d.total) * 100}%` }} />
                <div className="bg-amber-500" style={{ width: `${(d.left / d.total) * 100}%` }} />
                <div className="bg-red-500" style={{ width: `${(d.denied / d.total) * 100}%` }} />
              </div>
              <span className="text-xs text-ink font-medium w-6 text-right">{d.total}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-slate">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-green-500" />Completed</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />Left</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-500" />Denied</span>
        </div>
      </div>
      {/* Discovery source */}
      <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
        <p className="text-xs sm:text-sm font-semibold text-ink mb-1">Where New Patients Find You</p>
        <p className="text-xs text-ash mb-3">68 new patients, 79% responded</p>
        <div className="space-y-2">
          {[
            { source: "Google Search", count: 19, pct: 100 },
            { source: "Friend or Family", count: 14, pct: 74 },
            { source: "Doctor Referral", count: 12, pct: 63 },
            { source: "Social Media", count: 5, pct: 26 },
            { source: "Insurance Directory", count: 3, pct: 16 },
            { source: "Walk in", count: 1, pct: 5 },
          ].map(s => (
            <div key={s.source}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-medium text-ink">{s.source}</span>
                <span className="text-xs text-ash">{s.count} ({Math.round((s.count / 68) * 100)}%)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-hilt-blue" style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function WaitTimesTab() {
  const heatmap = [
    { day: "Sun", values: [2, 3, 4, 5, 6, 4, 3, 2, 2, 1, 1, 1, 1] },
    { day: "Mon", values: [3, 5, 7, 9, 12, 14, 11, 8, 6, 5, 4, 3, 2] },
    { day: "Tue", values: [2, 4, 6, 8, 10, 12, 9, 7, 5, 4, 3, 2, 2] },
    { day: "Wed", values: [3, 5, 8, 10, 13, 15, 12, 9, 7, 5, 4, 3, 2] },
    { day: "Thu", values: [4, 6, 9, 11, 14, 16, 13, 10, 8, 6, 5, 3, 2] },
    { day: "Fri", values: [3, 5, 8, 10, 12, 14, 11, 9, 7, 5, 4, 3, 2] },
    { day: "Sat", values: [2, 3, 5, 7, 8, 9, 7, 5, 4, 3, 2, 2, 1] },
  ];
  const hours = ["8am", "9", "10", "11", "12pm", "1", "2", "3", "4", "5", "6", "7", "8pm"];

  function heatColor(v: number) {
    if (v <= 4) return "bg-green-400";
    if (v <= 7) return "bg-yellow-400";
    if (v <= 10) return "bg-orange-400";
    return "bg-red-400";
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <StatCard label="Avg wait" value="6.1" unit="min" color="text-amber-600" />
        <StatCard label="Peak wait" value="16" unit="min" color="text-red-500" />
        <StatCard label="Busiest hour" value="1pm" />
        <StatCard label="Busiest day" value="Thu" />
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <p className="text-xs sm:text-sm font-semibold text-ink">Wait time by hour</p>
          <p className="text-[10px] sm:text-xs text-slate">minutes</p>
        </div>
        {/* Hour headers */}
        <div style={{ display: "grid", gridTemplateColumns: "28px repeat(13, 1fr)" }} className="gap-[2px] sm:gap-[3px] mb-0.5">
          <div />
          {hours.map((h, i) => (
            <p key={h} className="text-center text-[7px] sm:text-[10px] font-medium text-slate overflow-hidden">
              <span className="sm:hidden">{i === 0 ? "8a" : i === 4 ? "12" : i === 12 ? "8p" : i % 2 === 0 ? h : ""}</span>
              <span className="hidden sm:inline">{h}</span>
            </p>
          ))}
        </div>
        {/* Heatmap rows */}
        {heatmap.map(row => (
          <div key={row.day} style={{ display: "grid", gridTemplateColumns: "28px repeat(13, 1fr)" }} className="gap-[2px] sm:gap-[3px] mb-0.5">
            <p className="text-[8px] sm:text-[10px] text-slate flex items-center justify-end pr-0.5 sm:pr-1">{row.day}</p>
            {row.values.map((v, i) => (
              <div
                key={i}
                className={`aspect-square sm:aspect-[2/1] rounded flex items-center justify-center ${heatColor(v)} text-white`}
              >
                <span className="text-[7px] sm:text-[10px] font-medium">{v}</span>
              </div>
            ))}
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 sm:mt-4">
          <span className="text-[10px] sm:text-xs text-slate">Low</span>
          <div className="flex-1 h-2.5 sm:h-3 rounded" style={{ background: "linear-gradient(to right, #22c55e, #eab308, #ef4444)" }} />
          <span className="text-[10px] sm:text-xs text-slate">High</span>
        </div>
      </div>
    </>
  );
}

function ReturnsTab() {
  const doctors = [
    { name: "Dr. Chen", visits: 82, returns: 31, rate: 38 },
    { name: "Dr. Patel", visits: 64, returns: 28, rate: 44 },
    { name: "Dr. Lee", visits: 53, returns: 19, rate: 36 },
  ];
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
        <StatCard label="Total visits" value="199" />
        <StatCard label="Return visits" value="78" color="text-blue-600" />
        <StatCard label="Return rate" value="39" unit="%" color="text-green-600" />
      </div>
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-slate uppercase">Doctor</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-semibold text-slate uppercase">Visits</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-semibold text-slate uppercase">Returns</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-semibold text-slate uppercase">Rate</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map(d => (
              <tr key={d.name} className="border-b border-gray-50">
                <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-ink">{d.name}</td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-slate">{d.visits}</td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-slate">{d.returns}</td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium text-blue-600">{d.rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FollowUpsTab() {
  const funnel = [
    { label: "Tagged for follow-up", count: 89, pct: 100, color: "bg-blue-500" },
    { label: "SMS reminder sent", count: 82, pct: 92, color: "bg-blue-400" },
    { label: "Returned on schedule", count: 61, pct: 69, color: "bg-green-500" },
    { label: "Returned after reminder", count: 14, pct: 16, color: "bg-purple-500" },
    { label: "Overdue", count: 8, pct: 9, color: "bg-amber-500" },
    { label: "Expired", count: 6, pct: 7, color: "bg-red-400" },
  ];
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <StatCard label="Compliance" value="84" unit="%" color="text-green-600" />
        <StatCard label="Tagged" value="89" />
        <StatCard label="Returned" value="75" />
        <StatCard label="Overdue" value="8" />
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
        <p className="text-xs sm:text-sm font-semibold text-ink mb-3 sm:mb-4">Follow-up funnel</p>
        <div className="space-y-3">
          {funnel.map(f => (
            <div key={f.label} className="flex items-center gap-3">
              <span className="w-24 sm:w-44 text-[11px] sm:text-sm text-slate shrink-0 text-right truncate">{f.label}</span>
              <div className="flex-1 bg-gray-100 rounded overflow-hidden">
                <div className={`h-6 sm:h-8 rounded flex items-center px-2 sm:px-3 text-white text-xs sm:text-sm font-medium ${f.color}`} style={{ width: `${f.pct}%`, minWidth: "32px" }}>
                  {f.count}
                </div>
              </div>
              <span className="w-10 text-xs text-slate text-right">{f.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ReferralsTab() {
  const byStatus = [
    { status: "Sent", count: 7, color: "bg-slate-500" },
    { status: "Viewed", count: 4, color: "bg-blue-400" },
    { status: "Arrived", count: 14, color: "bg-green-500" },
    { status: "Completed", count: 10, color: "bg-purple-500" },
    { status: "Expired", count: 3, color: "bg-red-400" },
  ];
  const bySpecialty = [
    { name: "Rheumatology", count: 13 },
    { name: "Cardiology", count: 9 },
    { name: "Orthopedics", count: 11 },
    { name: "Dermatology", count: 5 },
  ];
  const topClinics = [
    { name: "City Rheum Clinic", count: 6, arrived: 4, pending: 2 },
    { name: "Heart Care Centre", count: 4, arrived: 3, pending: 1 },
    { name: "Joint & Spine Associates", count: 3, arrived: 1, pending: 2 },
  ];
  const maxSpecialty = Math.max(...bySpecialty.map(s => s.count));
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <StatCard label="Total sent" value="21" />
        <StatCard label="Total received" value="17" />
        <StatCard label="By status" value="5" unit=" types" />
        <StatCard label="Top specialty" value="Rheum." />
      </div>
      {/* Referral sources */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
        <span className="text-[11px] sm:text-xs font-medium text-slate">Referral Sources:</span>
        <span className="inline-block rounded-full bg-blue-100 px-2 sm:px-2.5 py-0.5 text-[11px] sm:text-xs font-medium text-blue-800">Hilt: 21</span>
        <span className="inline-block rounded-full bg-amber-100 px-2 sm:px-2.5 py-0.5 text-[11px] sm:text-xs font-medium text-amber-800">Self Reported: 17</span>
      </div>

      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
        {/* By status */}
        <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
          <p className="text-xs sm:text-sm font-semibold text-ink mb-3">By status</p>
          <div className="space-y-2">
            {byStatus.map(s => (
              <div key={s.status} className="flex items-center gap-2 sm:gap-3">
                <span className="w-16 sm:w-20 text-[11px] sm:text-xs text-slate shrink-0">{s.status}</span>
                <div className="flex-1 bg-gray-100 rounded overflow-hidden">
                  <div className={`h-5 rounded ${s.color}`} style={{ width: `${(s.count / 14) * 100}%`, minWidth: "24px" }} />
                </div>
                <span className="text-xs font-medium text-ink w-5 text-right">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
        {/* By specialty + top clinics */}
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-semibold text-ink mb-3">By specialty</p>
            <div className="space-y-2">
              {bySpecialty.map(s => (
                <div key={s.name} className="flex items-center gap-2 sm:gap-3">
                  <span className="w-20 sm:w-24 text-[11px] sm:text-xs text-slate shrink-0 truncate">{s.name}</span>
                  <div className="flex-1 bg-gray-100 rounded overflow-hidden">
                    <div className="h-5 rounded bg-hilt-blue" style={{ width: `${(s.count / maxSpecialty) * 100}%`, minWidth: "24px" }} />
                  </div>
                  <span className="text-xs font-medium text-ink w-5 text-right">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="p-3 sm:p-4 pb-0">
              <p className="text-xs sm:text-sm font-semibold text-ink mb-3">Top referring clinics</p>
            </div>
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-2 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-semibold text-slate uppercase">Clinic</th>
                  <th className="px-2 sm:px-4 py-2 text-right text-[10px] sm:text-xs font-semibold text-slate uppercase">Total</th>
                  <th className="px-2 sm:px-4 py-2 text-right text-[10px] sm:text-xs font-semibold text-slate uppercase">Arrived</th>
                  <th className="px-2 sm:px-4 py-2 text-right text-[10px] sm:text-xs font-semibold text-slate uppercase hidden sm:table-cell">Pending</th>
                </tr>
              </thead>
              <tbody>
                {topClinics.map(c => (
                  <tr key={c.name} className="border-b border-gray-50">
                    <td className="px-2 sm:px-4 py-2 font-medium text-ink max-w-[100px] sm:max-w-none truncate">{c.name}</td>
                    <td className="px-2 sm:px-4 py-2 text-right text-slate">{c.count}</td>
                    <td className="px-2 sm:px-4 py-2 text-right text-green-600 font-medium">{c.arrived}</td>
                    <td className="px-2 sm:px-4 py-2 text-right text-amber-600 font-medium hidden sm:table-cell">{c.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

const tabContent: Record<Tab, () => React.ReactElement> = {
  "Employees": EmployeesTab,
  "Patients": PatientsTab,
  "Wait Times": WaitTimesTab,
  "Returns": ReturnsTab,
  "Follow-ups": FollowUpsTab,
  "Referrals": ReferralsTab,
};

export default function DashboardMockup() {
  const [active, setActive] = useState<Tab>("Wait Times");
  const [clicked, setClicked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    if (clicked || !containerRef.current) return;
    const el = containerRef.current;

    function start() {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        setActive(prev => tabs[(tabs.indexOf(prev) + 1) % tabs.length]);
      }, 3000);
    }
    function stop() {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }

    const io = new IntersectionObserver(([entry]) => { entry.isIntersecting ? start() : stop(); }, { threshold: 0.3 });
    io.observe(el);
    return () => { io.disconnect(); stop(); };
  }, [clicked]);

  const handleTabClick = useCallback((t: Tab) => {
    setActive(t);
    setClicked(true);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  return (
    <div ref={containerRef} data-no-fade-observe className="rounded-2xl border border-gray-200 bg-gray-50 shadow-xl ring-1 ring-gray-900/5 overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center border-b border-gray-200 bg-white overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`shrink-0 px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              active === tab
                ? "border-hilt-blue text-hilt-blue"
                : "border-transparent text-slate hover:text-ink hover:border-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {!clicked && <p className="animate-pulse text-center text-sm text-hilt-blue font-medium py-2 bg-blue-50/80">Click the tabs to explore</p>}

      <div className="p-3 sm:p-6">
        {/* Date picker mock */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4">
          <div className="rounded-lg border border-gray-200 bg-white px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-slate">Feb 14</div>
          <span className="text-[10px] sm:text-xs text-ash">to</span>
          <div className="rounded-lg border border-gray-200 bg-white px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-slate">Mar 16</div>
          <div className="flex items-center gap-1 sm:ml-auto">
            <div className="rounded-lg border border-gray-200 bg-white px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-slate">Today</div>
            <div className="rounded-lg border border-gray-200 bg-white px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-slate">7d</div>
            <div className="rounded-lg border border-hilt-blue bg-blue-50 px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-hilt-blue">30d</div>
            <div className="rounded-lg border border-gray-200 bg-white px-1.5 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-slate">90d</div>
          </div>
        </div>

        {/* All tabs render in same grid cell — tallest sets height, no layout shift */}
        <div className="grid">
          {tabs.map(t => {
            const TabComponent = tabContent[t];
            return (
              <div key={t} className={`col-start-1 row-start-1 ${active === t ? "visible" : "invisible"}`}>
                <TabComponent />
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
