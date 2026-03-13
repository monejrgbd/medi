"use client";

import { useState, useEffect } from "react";
import {
  fetchFollowUpSmsConfig,
  saveFollowUpSmsConfig,
} from "@/app/(dashboard)/d/_actions/billing";
import { toast } from "sonner";

interface FollowUpSmsConfigProps {
  orgId: string;
}

export default function FollowUpSmsConfig({
  orgId,
}: FollowUpSmsConfigProps) {
  const [maxReminders, setMaxReminders] = useState(2);
  const [firstDays, setFirstDays] = useState(3);
  const [secondDays, setSecondDays] = useState(7);
  const [template, setTemplate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFollowUpSmsConfig(orgId).then((res) => {
      if (res?.success && res.configs && res.configs.length > 0) {
        const config = res.configs[0];
        setMaxReminders(config.max_reminders ?? 2);
        setFirstDays(config.first_reminder_days ?? 3);
        setSecondDays(config.second_reminder_days ?? 7);
        setTemplate(config.reminder_template || "");
      }
    });
  }, [orgId]);

  async function handleSave() {
    setSaving(true);
    const result = await saveFollowUpSmsConfig(orgId, {
      max_reminders: maxReminders,
      first_reminder_days: firstDays,
      second_reminder_days: secondDays,
      template: template || undefined,
    });
    setSaving(false);

    if (result?.success) {
      toast.success("Follow-up SMS config saved");
    } else {
      toast.error(result?.error || "Failed to save config");
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6">
      <h2 className="text-lg font-semibold text-ink mb-4">
        Follow-Up SMS Configuration
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label htmlFor="fu-max" className="block text-xs font-medium text-ink mb-1">
            Max Reminders (1-5)
          </label>
          <input
            id="fu-max"
            type="number"
            min={1}
            max={5}
            value={maxReminders}
            onChange={(e) => setMaxReminders(parseInt(e.target.value) || 2)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="fu-first" className="block text-xs font-medium text-ink mb-1">
            1st Reminder (days after due)
          </label>
          <input
            id="fu-first"
            type="number"
            min={1}
            max={30}
            value={firstDays}
            onChange={(e) => setFirstDays(parseInt(e.target.value) || 3)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="fu-second" className="block text-xs font-medium text-ink mb-1">
            2nd Reminder (days after due)
          </label>
          <input
            id="fu-second"
            type="number"
            min={2}
            max={60}
            value={secondDays}
            onChange={(e) => setSecondDays(parseInt(e.target.value) || 7)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="fu-template" className="block text-xs font-medium text-ink mb-1">
          Custom Template (optional, max 500 chars)
        </label>
        <textarea
          id="fu-template"
          value={template}
          onChange={(e) => setTemplate(e.target.value.slice(0, 500))}
          rows={3}
          placeholder="Leave blank to use the default template"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-hilt-blue focus:outline-none resize-none"
        />
        <p className="text-xs text-slate mt-1">{template.length}/500</p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving..." : "Save Configuration"}
      </button>
    </div>
  );
}
