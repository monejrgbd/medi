"use client";

import { useState, useRef, useEffect, useMemo } from "react";

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  formatLabel?: (value: string) => string;
  className?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Search...",
  emptyLabel = "Select...",
  formatLabel,
  className = "",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((opt) => {
      const label = formatLabel ? formatLabel(opt).toLowerCase() : opt.toLowerCase();
      return label.includes(q);
    });
  }, [search, options, formatLabel]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValue = value ? (formatLabel ? formatLabel(value) : value) : emptyLabel;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setSearch("");
        }}
        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-left focus:border-hilt-blue focus:outline-none flex items-center justify-between"
      >
        <span className={`truncate ${value ? "text-ink" : "text-ash"}`}>{displayValue}</span>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-[60] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              autoFocus
              className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm focus:border-hilt-blue focus:outline-none"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  setSearch("");
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-ash hover:bg-gray-50"
              >
                {emptyLabel}
              </button>
            )}
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate">No results</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${
                    value === opt ? "bg-blue-50 text-hilt-blue font-medium" : "text-ink"
                  }`}
                >
                  {formatLabel ? formatLabel(opt) : opt}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
