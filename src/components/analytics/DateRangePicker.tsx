"use client";

import { useState } from "react";

type SingleProps = {
  mode: "single";
  date: string;
  onDateChange: (date: string) => void;
  startDate?: never;
  endDate?: never;
  onApply?: never;
};

type RangeProps = {
  mode: "range";
  startDate: string;
  endDate: string;
  onApply: (start: string, end: string) => void;
  date?: never;
  onDateChange?: never;
};

type Props = SingleProps | RangeProps;

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return formatDate(d);
}

export default function DateRangePicker(props: Props) {
  const today = formatDate(new Date());

  if (props.mode === "single") {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => props.onDateChange(addDays(props.date, -1))}
          className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-slate hover:bg-gray-50"
        >
          &larr;
        </button>
        <input
          type="date"
          value={props.date}
          max={today}
          onChange={(e) => props.onDateChange(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-hilt-blue focus:outline-none"
        />
        <button
          onClick={() => {
            const next = addDays(props.date, 1);
            if (next <= today) props.onDateChange(next);
          }}
          disabled={props.date >= today}
          className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-slate hover:bg-gray-50 disabled:opacity-40"
        >
          &rarr;
        </button>
        {props.date !== today && (
          <button
            onClick={() => props.onDateChange(today)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-hilt-blue hover:bg-blue-50"
          >
            Today
          </button>
        )}
      </div>
    );
  }

  return <RangePicker key={`${props.startDate}-${props.endDate}`} startDate={props.startDate} endDate={props.endDate} onApply={props.onApply} />;
}

function RangePicker({
  startDate,
  endDate,
  onApply,
}: {
  startDate: string;
  endDate: string;
  onApply: (start: string, end: string) => void;
}) {
  const today = formatDate(new Date());
  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(endDate);
  const [rangeError, setRangeError] = useState<string | null>(null);

  function apply(s: string, e: string) {
    if (e < s) {
      setRangeError("End date must be after start date");
      return;
    }
    const diffDays = Math.ceil(
      (new Date(e + "T00:00:00").getTime() - new Date(s + "T00:00:00").getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (diffDays > 90) {
      setRangeError("Range cannot exceed 90 days");
      return;
    }
    setRangeError(null);
    onApply(s, e);
  }

  function preset(days: number) {
    const e = today;
    const s = formatDate(
      new Date(new Date().getTime() - (days - 1) * 24 * 60 * 60 * 1000)
    );
    setStart(s);
    setEnd(e);
    apply(s, e);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={start}
        max={today}
        onChange={(e) => setStart(e.target.value)}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-hilt-blue focus:outline-none"
      />
      <span className="text-sm text-slate">to</span>
      <input
        type="date"
        value={end}
        max={today}
        onChange={(e) => setEnd(e.target.value)}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-hilt-blue focus:outline-none"
      />
      <button
        onClick={() => apply(start, end)}
        className="rounded-lg bg-hilt-blue px-3 py-1.5 text-sm text-white hover:bg-blue-700"
      >
        Apply
      </button>
      <div className="flex gap-1">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => preset(d)}
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-slate hover:bg-gray-50"
          >
            {d}d
          </button>
        ))}
      </div>
      {rangeError && (
        <span className="text-xs text-red-600">{rangeError}</span>
      )}
    </div>
  );
}
