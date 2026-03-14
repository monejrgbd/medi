"use client";

import { useState } from "react";

interface HeatmapCell {
  day_of_week: number;
  hour: number;
  avg_wait_minutes: number;
  sample_count: number;
}

interface Props {
  data: {
    heatmap: HeatmapCell[];
    timezone: string;
  };
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8AM-8PM

function getColor(minutes: number, max: number): string {
  if (max === 0) return "rgb(220, 252, 231)";
  const ratio = Math.min(minutes / max, 1);
  // Green (34,197,94) → Yellow (234,179,8) → Red (239,68,68)
  if (ratio <= 0.5) {
    const t = ratio * 2;
    const r = Math.round(34 + (234 - 34) * t);
    const g = Math.round(197 + (179 - 197) * t);
    const b = Math.round(94 + (8 - 94) * t);
    return `rgb(${r},${g},${b})`;
  } else {
    const t = (ratio - 0.5) * 2;
    const r = Math.round(234 + (239 - 234) * t);
    const g = Math.round(179 + (68 - 179) * t);
    const b = Math.round(8 + (68 - 8) * t);
    return `rgb(${r},${g},${b})`;
  }
}

function fmtHour(h: number) {
  if (h === 0 || h === 12) return `12${h < 12 ? "am" : "pm"}`;
  return `${h > 12 ? h - 12 : h}${h < 12 ? "am" : "pm"}`;
}

export default function WaitTimeHeatmap({ data }: Props) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    cell: HeatmapCell;
  } | null>(null);

  if (!data.heatmap || data.heatmap.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-slate">
        Not enough data for this date range.
      </div>
    );
  }

  const cellMap = new Map<string, HeatmapCell>();
  let maxWait = 0;
  for (const cell of data.heatmap) {
    cellMap.set(`${cell.day_of_week}-${cell.hour}`, cell);
    if (cell.avg_wait_minutes > maxWait) maxWait = cell.avg_wait_minutes;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-ink">
          Wait Time Heatmap
        </h3>
        <span className="text-xs text-slate">{data.timezone}</span>
      </div>

      <div className="overflow-x-auto relative">
        <div>
          {/* Header row */}
          <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: "36px repeat(7, 1fr)" }}>
            <div />
            {DAYS.map((day) => (
              <div key={day} className="text-center text-[10px] sm:text-xs font-medium text-slate">
                {day}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="grid gap-0.5 sm:gap-1 mb-0.5 sm:mb-1"
              style={{ gridTemplateColumns: "36px repeat(7, 1fr)" }}
            >
              <div className="text-[10px] sm:text-xs text-slate flex items-center justify-end pr-1 sm:pr-2">
                {fmtHour(hour)}
              </div>
              {DAYS.map((_, dayIdx) => {
                const cell = cellMap.get(`${dayIdx}-${hour}`);
                return (
                  <div
                    key={dayIdx}
                    className="aspect-[2/1] rounded cursor-default flex items-center justify-center text-[10px] sm:text-xs relative"
                    style={{
                      backgroundColor: cell
                        ? getColor(cell.avg_wait_minutes, maxWait)
                        : "#f3f4f6",
                      color: cell ? "white" : "#d1d5db",
                    }}
                    onMouseEnter={(e) => {
                      if (cell) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                          cell,
                        });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {cell ? `${cell.avg_wait_minutes}` : ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 rounded-lg bg-ink text-white text-xs px-3 py-2 shadow-lg pointer-events-none -translate-x-1/2 -translate-y-full"
            style={{ left: tooltip.x, top: tooltip.y - 4 }}
          >
            <div className="font-medium">
              {tooltip.cell.avg_wait_minutes} min avg wait
            </div>
            <div className="text-gray-300">
              {tooltip.cell.sample_count} patient{tooltip.cell.sample_count !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4">
        <span className="text-xs text-slate">Low</span>
        <div
          className="flex-1 h-3 rounded"
          style={{
            background:
              "linear-gradient(to right, rgb(34,197,94), rgb(234,179,8), rgb(239,68,68))",
          }}
        />
        <span className="text-xs text-slate">High</span>
      </div>
    </div>
  );
}
