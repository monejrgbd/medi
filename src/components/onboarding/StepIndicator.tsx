"use client";

import { Check } from "lucide-react";

const STEPS = ["Profile", "Location", "Configure", "Staff", "Done"];

export default function StepIndicator({
  currentStep,
  onStepClick,
}: {
  currentStep: number;
  onStepClick?: (step: number) => void;
}) {
  return (
    <div className="overflow-x-auto mb-8">
      <div className="flex items-center justify-center gap-1 sm:gap-2 min-w-max px-4">
        {STEPS.map((label, i) => {
          const isCompleted = i < currentStep;
          const isActive = i === currentStep;
          // Only steps the user has already completed are clickable. The current step
          // is a no op, future steps would skip required validation.
          const isClickable = !!onStepClick && isCompleted;

          const circle = (
            <div
              className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                isCompleted
                  ? "bg-green-500 text-white"
                  : isActive
                  ? "bg-hilt-blue text-white"
                  : "bg-gray-200 text-slate"
              } ${isClickable ? "group-hover:ring-2 group-hover:ring-green-300 group-hover:ring-offset-2" : ""}`}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
            </div>
          );

          const stepLabel = (
            <span
              className={`mt-1 text-[10px] sm:text-xs ${
                isActive ? "font-medium text-ink" : "text-slate"
              } ${isClickable ? "group-hover:text-ink" : ""}`}
            >
              {label}
            </span>
          );

          return (
            <div key={label} className="flex items-center gap-1 sm:gap-2">
              {isClickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick!(i)}
                  className="group flex flex-col items-center cursor-pointer"
                  aria-label={`Go back to ${label}`}
                >
                  {circle}
                  {stepLabel}
                </button>
              ) : (
                <div className="flex flex-col items-center">
                  {circle}
                  {stepLabel}
                </div>
              )}
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
