"use client";

import { useState } from "react";

interface FollowUpFormProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  days: number | null;
  onDaysChange: (days: number | null) => void;
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
  const [tipDismissed, setTipDismissed] = useState(false);

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
          <p className="text-xs text-slate bg-blue-50 rounded-lg px-3 py-2">
            When this patient checks in for their follow up, the AI will use your instructions below to guide the conversation.
          </p>
          {!tipDismissed && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
              <p className="text-xs text-amber-800 flex-1">
                You can pick an approximate timeframe or let the receptionist schedule a specific date with the patient.
              </p>
              <button
                type="button"
                onClick={() => setTipDismissed(true)}
                className="text-amber-400 hover:text-amber-600 text-sm leading-none mt-0.5"
              >
                &times;
              </button>
            </div>
          )}
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
              <button
                type="button"
                onClick={() => { onDaysChange(null); setCustomDays(""); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  days === null && !customDays
                    ? "bg-amber-500 text-white"
                    : "border border-gray-200 text-slate hover:bg-gray-100"
                }`}
              >
                Let receptionist schedule
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate">
              When this patient returns, the AI should ask about: (optional)
            </label>
            <textarea
              value={instructions}
              onChange={(e) => onInstructionsChange(e.target.value.slice(0, 2000))}
              placeholder="e.g. Ask if the antibiotics helped and if the fever subsided"
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
