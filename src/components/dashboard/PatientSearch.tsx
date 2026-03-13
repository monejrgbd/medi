"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { searchPatients, fetchPatientFullProfile } from "@/app/(dashboard)/d/_actions/billing";
import PatientFullProfile from "./PatientFullProfile";

interface PatientResult {
  patient_id: string;
  first_name: string;
  last_name: string;
  birthday: string;
  phone: string | null;
  last_visit_date: string | null;
  visit_count: number;
}

export default function PatientSearch() {
  const [query, setQuery] = useState("");
  const [birthday, setBirthday] = useState("");
  const [results, setResults] = useState<PatientResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Record<string, unknown> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const doSearch = useCallback(async (q: string, bday: string) => {
    if (q.length < 1) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    const result = await searchPatients(q, bday || undefined);
    setSearching(false);

    if (result?.success && result.patients) {
      setResults(result.patients as PatientResult[]);
      setShowResults(true);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query, birthday);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, birthday, doSearch]);

  // Close results on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSelectPatient(patientId: string) {
    setProfileLoading(true);
    setShowResults(false);
    const result = await fetchPatientFullProfile(patientId);
    setProfileLoading(false);

    if (result?.success) {
      setSelectedPatient(result as Record<string, unknown>);
    }
  }

  return (
    <>
      <div ref={containerRef} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              placeholder="Search patients by name..."
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pl-9 text-sm focus:border-hilt-blue focus:outline-none"
              aria-label="Search patients"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-ash"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setShowResults(false);
                }}
                className="absolute right-3 top-2.5 text-ash hover:text-ink"
                aria-label="Clear search"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
            aria-label="Filter by birthday"
          />
        </div>

        {/* Results dropdown */}
        {showResults && (
          <div className="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-80 overflow-y-auto">
            {searching ? (
              <div className="p-4 text-center text-sm text-slate">Searching...</div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate">No patients found</div>
            ) : (
              results.map((p) => (
                <button
                  key={p.patient_id}
                  onClick={() => handleSelectPatient(p.patient_id)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-xs text-slate">
                        DOB: {p.birthday}
                        {p.phone && ` | Phone: ${p.phone}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate">{p.visit_count} visits</p>
                      {p.last_visit_date && (
                        <p className="text-xs text-slate">
                          Last: {new Date(p.last_visit_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {profileLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-xl bg-white p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-hilt-blue mx-auto" />
            <p className="text-sm text-slate mt-3">Loading patient profile...</p>
          </div>
        </div>
      )}

      {selectedPatient && (
        <PatientFullProfile
          data={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </>
  );
}
