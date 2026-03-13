"use client";

import { useState } from "react";

interface FollowUpFormProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  days: number;
  onDaysChange: (days: number) => void;
  instructions: string;
  onInstructionsChange: (instructions: string) => void;
}

export default function FollowUpForm({
  enabled,
  onEnabledChange,
  days,
  onDaysChange,
  instructions,
  onInstructionsChange,
}: FollowUpFormProps) {
  const presets = [3, 7, 14, 30, 60];
  const [customDays, setCustomDays] = useState("");

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
        />
        <span className="text-sm font-medium text-ink">Schedule a follow-up?</span>
      </label>

      {enabled && (
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-xs text-slate mb-2">Follow up in:</p>
            <div className="flex flex-wrap gap-2">
              {presets.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => { onDaysChange(d); setCustomDays(""); }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    days === d && !customDays
                      ? "bg-hilt-blue text-white"
                      : "bg-gray-100 text-slate hover:bg-gray-200"
                  }`}
                >
                  {d} days
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={365}
                placeholder="Custom"
                value={customDays}
                onChange={(e) => {
                  setCustomDays(e.target.value);
                  const val = parseInt(e.target.value);
                  if (val >= 1 && val <= 365) onDaysChange(val);
                }}
                className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-ink focus:border-hilt-blue focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate">
              AI instructions (optional)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => onInstructionsChange(e.target.value.slice(0, 2000))}
              placeholder="Tell the AI what to focus on during the follow-up..."
              rows={3}
              maxLength={2000}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-ink placeholder:text-ash focus:border-hilt-blue focus:outline-none resize-y"
            />
            <p className="mt-0.5 text-right text-[10px] text-ash">
              {instructions.length}/2,000
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
