"use client";

import { useState, useCallback } from "react";
import { fetchAuditTrail } from "@/app/(dashboard)/d/_actions/receptionist";
import { DateInput } from "@/components/ui/DateInput";

interface AuditEntry {
  id: string;
  actor_name: string;
  actor_type: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface AuditTrailViewerProps {
  orgId: string;
}

const ENTITY_TYPES = [
  { value: "", label: "All types" },
  { value: "visit", label: "Visit" },
  { value: "patient", label: "Patient" },
  { value: "follow_up", label: "Follow-up" },
  { value: "staff", label: "Staff" },
  { value: "organization", label: "Organization" },
  { value: "location", label: "Location" },
];

export default function AuditTrailViewer({ orgId }: AuditTrailViewerProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursorCreatedAt, setCursorCreatedAt] = useState<string | null>(null);
  const [cursorId, setCursorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [entityType, setEntityType] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadEntries = useCallback(async (append = false, cursor?: { createdAt: string; id: string } | null) => {
    setLoading(true);
    setError(null);

    const filters: Record<string, string> = {};
    if (entityType) filters.entityType = entityType;
    if (actorFilter) filters.actorId = actorFilter;
    if (startDate) filters.startDate = new Date(startDate).toISOString();
    if (endDate) filters.endDate = new Date(endDate + "T23:59:59").toISOString();
    if (append && cursor) {
      filters.cursorCreatedAt = cursor.createdAt;
      filters.cursorId = cursor.id;
    }

    const result = await fetchAuditTrail(orgId, filters);
    if (result.success) {
      if (append) {
        setEntries((prev) => [...prev, ...(result.entries || [])]);
      } else {
        setEntries(result.entries || []);
      }
      setHasMore(result.has_more || false);
      setCursorCreatedAt(result.next_cursor_created_at || null);
      setCursorId(result.next_cursor_id || null);
      setLoaded(true);
    } else {
      setError(result.error || "Failed to load audit trail");
    }
    setLoading(false);
  }, [orgId, entityType, actorFilter, startDate, endDate]);

  function handleSearch() {
    setCursorCreatedAt(null);
    setCursorId(null);
    loadEntries(false);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink focus:border-hilt-blue focus:outline-none"
        >
          {ENTITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <input
          type="text"
          value={actorFilter}
          onChange={(e) => setActorFilter(e.target.value.trim())}
          placeholder="Actor ID (UUID)"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none w-44"
        />
        <DateInput
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink focus:border-hilt-blue focus:outline-none"
        />
        <DateInput
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink focus:border-hilt-blue focus:outline-none"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading && !loaded ? "Loading..." : "Search"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loaded && !loading ? (
        <p className="text-sm text-ash text-center py-8">Click Search to load audit trail entries.</p>
      ) : entries.length === 0 && loaded ? (
        <p className="text-sm text-ash text-center py-8">No audit trail entries found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="pb-2 pr-4 font-medium text-slate">Time</th>
                <th className="pb-2 pr-4 font-medium text-slate">Actor</th>
                <th className="pb-2 pr-4 font-medium text-slate">Action</th>
                <th className="pb-2 pr-4 font-medium text-slate">Entity</th>
                <th className="pb-2 font-medium text-slate">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="text-ink">
                  <td className="py-2.5 pr-4 text-xs text-ash whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-2.5 pr-4 whitespace-nowrap">
                    <span className="text-sm">{entry.actor_name}</span>
                    {entry.actor_type && (
                      <span className="ml-1 text-[10px] text-ash">({entry.actor_type})</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {entry.action}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-slate">
                    {entry.entity_type}
                    {entry.entity_id && (
                      <span className="text-ash ml-1">#{entry.entity_id.slice(0, 8)}</span>
                    )}
                  </td>
                  <td className="py-2.5 text-xs text-ash max-w-xs truncate">
                    {entry.details ? JSON.stringify(entry.details) : "\u2014"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && (
        <button
          onClick={() => loadEntries(true, cursorCreatedAt && cursorId ? { createdAt: cursorCreatedAt, id: cursorId } : null)}
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-slate hover:bg-gray-200 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
