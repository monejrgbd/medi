"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  name: string;
  options: string[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  id?: string;
  onValueChange?: (value: string) => void;
};

export default function CountryCombobox({
  name,
  options,
  required,
  placeholder = "Start typing your country...",
  defaultValue = "",
  id,
  onValueChange,
}: Props) {
  const [value, setValue] = useState(defaultValue);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Relevance ranked: exact, then prefix, then word-start, then substring.
  // Ties keep the original (alphabetical) order via a stable sort.
  const filtered = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    const scored: { c: string; score: number; i: number }[] = [];
    options.forEach((c, i) => {
      const lc = c.toLowerCase();
      let score: number;
      if (lc === q) score = 0;
      else if (lc.startsWith(q)) score = 1;
      else if (lc.includes(" " + q)) score = 2;
      else if (lc.includes(q)) score = 3;
      else return;
      scored.push({ c, score, i });
    });
    return scored
      .sort((a, b) => a.score - b.score || a.i - b.i)
      .map((s) => s.c);
  })();

  function selectOption(opt: string) {
    setValue(opt);
    setOpen(false);
    setQuery("");
    onValueChange?.(opt);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlighted]) selectOption(filtered[highlighted]);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  // Reset highlight when query changes
  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  // Keep the highlighted option visible during keyboard navigation
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[highlighted] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlighted, open]);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        id={id}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id ?? name}-list`}
        aria-autocomplete="list"
        value={open ? query : value}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={(e) => {
          setOpen(true);
          setQuery(value);
          // Select all so user can replace by just typing
          requestAnimationFrame(() => e.target.select());
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-10 text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none focus:ring-2 focus:ring-hilt-blue/20 transition-colors"
        suppressHydrationWarning
      />

      <input type="hidden" name={name} value={value} required={required} />

      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ash transition-transform"
        style={{ transform: open ? "translateY(-50%) rotate(180deg)" : "translateY(-50%)" }}
        width="20"
        height="20"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>

      {open && (
        <div
          ref={listRef}
          id={`${id ?? name}-list`}
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-ash">
              No countries match &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((country, i) => (
              <button
                key={country}
                type="button"
                role="option"
                aria-selected={value === country}
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => selectOption(country)}
                className={`block w-full px-4 py-2 text-left text-sm transition-colors ${
                  i === highlighted ? "bg-gray-50" : ""
                } ${value === country ? "font-semibold text-hilt-blue" : "text-ink"}`}
              >
                {country}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
