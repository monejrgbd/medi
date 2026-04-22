"use client";

import { Check } from "lucide-react";

const STEPS = ["Profile", "Location", "Raven", "Configure", "Staff", "Transfer", "Try It", "Done"];

export default function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="overflow-x-auto mb-8">
      <div className="flex items-center justify-center gap-1 sm:gap-2 min-w-max px-4">
        {STEPS.map((label, i) => {
          const isCompleted = i < currentStep;
          const isActive = i === currentStep;
          return (
            <div key={label} className="flex items-center gap-1 sm:gap-2">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-hilt-blue text-white"
                      : "bg-gray-200 text-slate"
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={`mt-1 text-[10px] sm:text-xs ${
                    isActive ? "font-medium text-ink" : "text-slate"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-5 sm:w-8 mt-[-12px] ${
                    isCompleted ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
