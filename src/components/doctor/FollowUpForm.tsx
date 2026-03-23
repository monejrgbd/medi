"use client";

interface FollowUpFormProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  instructions: string;
  onInstructionsChange: (instructions: string) => void;
}

export default function FollowUpForm({
  enabled,
  onEnabledChange,
  instructions,
  onInstructionsChange,
}: FollowUpFormProps) {
  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="rounded border-gray-300 text-hilt-blue focus:ring-hilt-blue"
        />
        <span className="text-sm font-medium text-ink">Schedule a follow up?</span>
      </label>

      {enabled && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-slate bg-blue-50 rounded-lg px-3 py-2">
            When this patient checks in for their follow up, the AI will use your instructions below to guide the conversation. The receptionist will confirm the follow up topic with the patient.
          </p>

          <div>
            <label className="text-xs text-slate">
              When this patient returns, the AI should ask about:
            </label>
            <textarea
              value={instructions}
              onChange={(e) => onInstructionsChange(e.target.value.slice(0, 2000))}
              placeholder="e.g. Check if symptoms improved since starting treatment, ask about any new concerns"
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
