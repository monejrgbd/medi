"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PLAN_CONFIG } from "@/lib/constants";

const HILT_MINUTES_PER_PATIENT = 1;
const PLAN_COST_PER_DOCTOR = PLAN_CONFIG.starter.price;

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

type Field = {
  key: "patients" | "minutes" | "doctors" | "rate";
  label: string;
  help?: string;
  prefix?: string;
  suffix?: string;
  min: number;
  max: number;
};

const FIELDS: Field[] = [
  {
    key: "patients",
    label: "Monthly patient volume",
    suffix: "patients",
    min: 1,
    max: 50000,
  },
  {
    key: "minutes",
    label: "Average minutes per patient on intake and paperwork",
    suffix: "min",
    min: 2,
    max: 120,
  },
  {
    key: "doctors",
    label: "Number of doctors and nurses",
    suffix: "people",
    min: 1,
    max: 100,
  },
  {
    key: "rate",
    label: "Your hourly cost for that time",
    prefix: "$",
    suffix: "per hour",
    min: 1,
    max: 500,
  },
];

const DEFAULTS = { patients: 1500, minutes: 15, doctors: 3, rate: 30 };

export default function CostCalculator() {
  const [values, setValues] = useState(DEFAULTS);
  const [drafts, setDrafts] = useState<Record<keyof typeof DEFAULTS, string>>({
    patients: String(DEFAULTS.patients),
    minutes: String(DEFAULTS.minutes),
    doctors: String(DEFAULTS.doctors),
    rate: String(DEFAULTS.rate),
  });

  const result = useMemo(() => {
    const minutesSavedPerPatient = Math.max(0, values.minutes - HILT_MINUTES_PER_PATIENT);
    const hoursSavedPerMonth = (values.patients * minutesSavedPerPatient) / 60;
    const dollarsSavedPerMonth = hoursSavedPerMonth * values.rate;
    const planCostPerMonth = PLAN_COST_PER_DOCTOR * values.doctors;
    const netSavingsPerMonth = dollarsSavedPerMonth - planCostPerMonth;
    const roiMultiple = planCostPerMonth > 0 ? dollarsSavedPerMonth / planCostPerMonth : 0;
    return {
      hoursSavedPerMonth,
      dollarsSavedPerMonth,
      planCostPerMonth,
      netSavingsPerMonth,
      roiMultiple,
    };
  }, [values]);

  const handleChange = (field: Field, raw: string) => {
    setDrafts((d) => ({ ...d, [field.key]: raw }));
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed >= field.min && parsed <= field.max) {
      setValues((v) => ({ ...v, [field.key]: parsed }));
    }
  };

  const handleBlur = (field: Field) => {
    const parsed = parseInt(drafts[field.key], 10);
    let clamped = parsed;
    if (isNaN(parsed) || parsed < field.min) clamped = field.min;
    else if (parsed > field.max) clamped = field.max;
    if (clamped !== values[field.key]) {
      setValues((v) => ({ ...v, [field.key]: clamped }));
    }
    setDrafts((d) => ({ ...d, [field.key]: String(clamped) }));
  };

  const positive = result.netSavingsPerMonth > 0;

  return (
    <div className="grid gap-8 lg:grid-cols-5 lg:gap-10 items-start">
      {/* Inputs */}
      <div className="lg:col-span-3">
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <label
              key={field.key}
              className="block rounded-xl border border-gray-200 bg-white p-4 transition-colors focus-within:border-hilt-blue focus-within:ring-2 focus-within:ring-hilt-blue/15"
            >
              <span className="block text-sm font-semibold text-ink">{field.label}</span>
              {field.help && (
                <span className="mt-0.5 block text-xs leading-snug text-ash">{field.help}</span>
              )}
              <div className="mt-3 flex items-center gap-2">
                {field.prefix && (
                  <span className="text-base font-semibold text-slate">{field.prefix}</span>
                )}
                <input
                  type="number"
                  inputMode="numeric"
                  min={field.min}
                  max={field.max}
                  value={drafts[field.key]}
                  onChange={(e) => handleChange(field, e.target.value)}
                  onBlur={() => handleBlur(field)}
                  className="w-full rounded-lg border border-gray-200 bg-snow px-3 py-2 text-base font-semibold text-ink shadow-sm focus:border-hilt-blue focus:outline-none focus:ring-1 focus:ring-hilt-blue"
                />
                {field.suffix && (
                  <span className="text-sm text-ash whitespace-nowrap">{field.suffix}</span>
                )}
              </div>
            </label>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ash">
          Assumes Hilt brings intake and paperwork time down to about {HILT_MINUTES_PER_PATIENT} minute per patient.
        </p>
      </div>

      {/* Result panel */}
      <div className="lg:col-span-2">
        <div className="rounded-2xl border-2 border-hilt-blue bg-white p-4 shadow-lg shadow-hilt-blue/10 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-hilt-blue">
            Your monthly savings
          </p>
          <p
            className={`mt-1 text-2xl font-bold leading-tight sm:text-3xl ${positive ? "text-ink" : "text-slate"}`}
          >
            {money.format(Math.max(0, result.netSavingsPerMonth))}
          </p>
          <p className="mt-1 text-xs font-medium text-hilt-blue">
            Across the year, that is {money.format(Math.max(0, result.netSavingsPerMonth) * 12)}.
          </p>
          <p className="mt-1 text-xs text-slate">
            That is {result.hoursSavedPerMonth.toFixed(1)} hours your team gets back, every month.
          </p>

          <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate">Time savings value</span>
              <span className="font-semibold text-ink">
                {money.format(result.dollarsSavedPerMonth)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate">Hilt plan cost</span>
              <span className="font-semibold text-ink">
                {"−"}
                {money.format(result.planCostPerMonth)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-1.5">
              <span className="font-semibold text-ink">Net monthly savings</span>
              <span className="font-bold text-ink">
                {money.format(result.netSavingsPerMonth)}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-lg bg-snow px-3 py-2">
            <span className="text-xs font-medium text-slate">Return on cost</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                result.roiMultiple >= 1
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-slate"
              }`}
            >
              {result.roiMultiple.toFixed(1)}x
            </span>
          </div>

          <Link
            href="/signup"
            className="mt-4 block w-full rounded-lg bg-hilt-blue py-2.5 text-center text-xs font-semibold text-white transition-colors hover:bg-hilt-blue-dark"
          >
            Start saving, get started
          </Link>

          <p className="mt-3 text-[11px] leading-relaxed text-ash">
            This is the value of automated intake and paperwork only. You also get reviews, notes, follow ups, analytics, and more, all included.
          </p>
        </div>
      </div>
    </div>
  );
}
