"use client";

import type { DemoFeatures } from "@/contexts/DemoFeatureContext";

const ALL_STEPS = [
  {
    key: "checkin",
    label: "Check In",
    role: "You are the patient",
    todo: "Fill out the check in form and submit.",
    info: "This is what your patients see on their phone after scanning the QR code, which you get per location after signing up. Kiosk mode is also supported. Selecting a language makes the AI chat in that language, but the doctor still sees everything in English.",
    featureGate: null as string | null,
    mapsToDemoStep: 1,
  },
  {
    key: "approve",
    label: "Approve",
    role: "You are the receptionist",
    todo: "Review the patient details and click Approve.",
    info: "This triggers the AI pre screening conversation. Returning patients are automatically identified by name and date of birth. You can edit their info using the edit icon. You can also skip the AI or switch to Premium AI before approving by clicking on configure AI.",
    featureGate: null,
    mapsToDemoStep: 2,
  },
  {
    key: "ai",
    label: "AI Screening",
    role: "You are the patient",
    todo: "Answer the AI's questions. The conversation ends on its own when enough information is collected.",
    info: "The AI builds a structured symptom profile automatically, saving the doctor time. Afterward, you will verify a phone number.",
    featureGate: null,
    mapsToDemoStep: 3,
  },
  {
    key: "nurse",
    label: "Nurse Triage",
    role: "You are the nurse",
    todo: "Record vitals, add triage notes, then release the patient to the doctor.",
    info: "The nurse reviews the AI intake, records vitals and vaccines, writes observations, then releases the patient to the doctor queue.",
    featureGate: "nurseEnabled",
    mapsToDemoStep: null as number | null,
  },
  {
    key: "diagnose",
    label: "Diagnose",
    role: "You are the doctor",
    todo: "Browse the tabs, then click the pulsing Complete button to enter a diagnosis and set a follow up.",
    info: "The AI generates a summary, full transcript, and diagnostic suggestions. Patients who miss their follow up date receive up to two SMS reminders automatically.",
    featureGate: null,
    mapsToDemoStep: 4,
  },
  {
    key: "feedback",
    label: "Feedback",
    role: "Visit complete",
    todo: "Open the review link from your SMS or below and submit a review.",
    info: "Once submitted, your review will appear in the dashboard. You can configure which external platform patients are directed to.",
    featureGate: "reviewCollection",
    mapsToDemoStep: 5,
  },
  {
    key: "outreach",
    label: "Outreach",
    role: "You are the marketer",
    todo: "Create a campaign to find and reach patients matching any criteria.",
    info: "AI scans visit summaries, diagnoses, medications, and conditions across 200 demo patients. Describe who you want to reach and it finds them. No real SMS is sent in this demo.",
    featureGate: null,
    mapsToDemoStep: 6,
  },
];

interface DemoTimelineProps {
  currentStep: number;
  features: DemoFeatures;
  nurseActive?: boolean;
  nurseDone?: boolean;
  onFinish?: () => void;
}

export default function DemoTimeline({ currentStep, features, nurseActive, nurseDone, onFinish }: DemoTimelineProps) {
  // Determine status of each step
  const steps = ALL_STEPS.map((step) => {
    const featureKey = step.featureGate as keyof DemoFeatures | null;
    const isGatedOff = featureKey !== null && !features[featureKey];

    // AI step: disabled when skipAi is on, done when nurse is triaging
    if (step.key === "ai" && features.skipAi) {
      return { ...step, status: "disabled" as const };
    }
    if (step.key === "ai" && (nurseActive || nurseDone)) {
      return { ...step, status: "done" as const };
    }

    // Nurse step (no mapsToDemoStep)
    if (step.mapsToDemoStep === null) {
      if (isGatedOff) return { ...step, status: "disabled" as const };
      if (nurseDone) return { ...step, status: "done" as const };
      if (nurseActive) return { ...step, status: "active" as const };
      if (currentStep >= 4) return { ...step, status: "pending" as const };
      return { ...step, status: "pending" as const };
    }

    // Feature gated steps
    if (isGatedOff) return { ...step, status: "disabled" as const };

    // Normal steps
    if (currentStep > step.mapsToDemoStep) return { ...step, status: "done" as const };
    if (currentStep === step.mapsToDemoStep) return { ...step, status: "active" as const };
    return { ...step, status: "pending" as const };
  });

  // Find the active step for the description box (skip disabled/simulated)
  const activeStep = steps.find((s) => s.status === "active") || steps.find((s) => s.status === "pending");

  const displaySteps = steps;

  // Show ALL steps (no filtering) — disabled ones are greyed with "Skipped" label
  return (
    <div className="border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50 px-4 py-3">
      {/* Step circles + connectors */}
      <div className="flex items-start justify-center max-w-2xl mx-auto scale-[0.7] min-[360px]:scale-100 origin-top">
        {displaySteps.map((step, i) => {
          const isDone = step.status === "done";
          const isActive = step.status === "active";
          const isDisabled = step.status === "disabled";
          return (
            <div key={step.key} className="flex items-start">
              <div className="flex flex-col items-center w-10 sm:w-16">
                <div
                  className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-[10px] sm:text-xs font-bold transition-all duration-300 ${
                    isDisabled
                      ? "bg-red-100 text-red-400 border border-red-200"
                      : isDone
                        ? "bg-green-500 text-white shadow-sm"
                        : isActive
                          ? "bg-hilt-blue text-white ring-[3px] ring-blue-100 shadow-md shadow-blue-200/50"
                          : "bg-gray-100 text-gray-400 border border-gray-200"
                  }`}
                >
                  {isDone ? (
                    <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`mt-1 text-[8px] sm:text-[10px] leading-tight text-center whitespace-nowrap ${
                    isDisabled
                      ? "text-red-400"
                      : isActive
                        ? "font-bold text-hilt-blue"
                        : isDone
                          ? "font-medium text-green-600"
                          : "text-gray-400"
                  }`}
                >
                  {step.label}
                  {isDisabled && <span className="block text-[6px] sm:text-[8px] text-red-400">Skipped</span>}
                </span>
              </div>

              {/* Connector */}
              {i < displaySteps.length - 1 && (
                <div
                  className={`h-0.5 w-3 sm:w-6 -mx-0.5 sm:-mx-1 mt-3 sm:mt-[13px] rounded-full transition-colors duration-300 ${
                    isDone ? "bg-green-400" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Current step explanation OR finish button */}
      {activeStep ? (
        <div className="mt-2.5 mx-auto max-w-md rounded-lg bg-blue-50/80 border border-blue-100 px-3.5 py-2">
          <p className="text-xs text-center">
            <span className="font-semibold text-hilt-blue">
              {activeStep.role}.
            </span>{" "}
            <span className="text-ink font-medium">
              {activeStep.todo}
            </span>
          </p>
          <p className="text-[11px] text-center text-gray-500 mt-1">
            {activeStep.info}
          </p>
        </div>
      ) : onFinish && currentStep >= 7 ? (
        <div className="mt-2.5 mx-auto max-w-md rounded-lg bg-green-50 border border-green-200 px-3.5 py-2.5 text-center">
          <p className="text-xs text-green-700 mb-2">Click your campaign to view results, then finish when ready.</p>
          <button
            onClick={onFinish}
            className="rounded-lg bg-green-600 px-5 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            Finish Demo
          </button>
        </div>
      ) : null}
    </div>
  );
}
