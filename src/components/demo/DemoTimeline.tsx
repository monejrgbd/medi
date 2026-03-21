"use client";

const STEPS = [
  {
    label: "Check In",
    role: "You are the patient",
    todo: "Fill out the check in form and submit.",
    info: "This is what your patients see on their phone after scanning the QR code, which you get per location after signing up. Kiosk mode is also supported. Selecting a language makes the AI chat in that language, but the doctor still sees everything in English.",
  },
  {
    label: "Approve",
    role: "You are the receptionist",
    todo: "Review the patient details and click Approve.",
    info: "This triggers the AI pre screening conversation. Returning patients are automatically identified by name and date of birth. You can edit their info using the edit icon.",
  },
  {
    label: "AI Screening",
    role: "You are the patient",
    todo: "Answer the AI's questions. The conversation ends on its own when enough information is collected.",
    info: "The AI builds a structured symptom profile automatically, saving the doctor time. Afterward, you will verify a phone number.",
  },
  {
    label: "Diagnose",
    role: "You are the doctor",
    todo: "Browse the tabs, then click the pulsing Complete button to enter a diagnosis and set a follow up.",
    info: "The AI generates a summary, full transcript, and diagnostic suggestions. Patients who miss their follow up date receive up to two SMS reminders automatically.",
  },
  {
    label: "Feedback",
    role: "Visit complete",
    todo: "Open the review link from your SMS or below and submit a review.",
    info: "Once submitted, your review will appear in the dashboard. You can configure which external platform patients are directed to.",
  },
  {
    label: "Outreach",
    role: "You are the marketer",
    todo: "Create a campaign to find and reach patients matching any criteria.",
    info: "AI scans visit summaries, diagnoses, medications, and conditions across 200 demo patients. Describe who you want to reach and it finds them. No real SMS is sent in this demo.",
  },
] as const;

interface DemoTimelineProps {
  currentStep: number;
}

export default function DemoTimeline({ currentStep }: DemoTimelineProps) {
  return (
    <div className="border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50 px-4 py-3">
      {/* Step circles + connectors */}
      <div className="flex items-center justify-center max-w-xl mx-auto">
        {STEPS.map((step, i) => {
          const stepNum = i + 1;
          const isDone = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center w-14 sm:w-16">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    isDone
                      ? "bg-green-500 text-white shadow-sm"
                      : isActive
                        ? "bg-hilt-blue text-white ring-[3px] ring-blue-100 shadow-md shadow-blue-200/50"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                  }`}
                >
                  {isDone ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={`mt-1.5 text-[10px] leading-tight text-center whitespace-nowrap ${
                    isActive
                      ? "font-bold text-hilt-blue"
                      : isDone
                        ? "font-medium text-green-600"
                        : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-4 sm:w-8 -mx-1 rounded-full transition-colors duration-300 ${
                    stepNum < currentStep ? "bg-green-400" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Current step explanation */}
      <div className="mt-2.5 mx-auto max-w-md rounded-lg bg-blue-50/80 border border-blue-100 px-3.5 py-2">
        <p className="text-xs text-center">
          <span className="font-semibold text-hilt-blue">
            {STEPS[currentStep - 1].role}.
          </span>{" "}
          <span className="text-ink font-medium">
            {STEPS[currentStep - 1].todo}
          </span>
        </p>
        <p className="text-[11px] text-center text-gray-500 mt-1">
          {STEPS[currentStep - 1].info}
        </p>
      </div>
    </div>
  );
}
