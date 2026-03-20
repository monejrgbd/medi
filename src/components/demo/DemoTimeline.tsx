"use client";

const STEPS = [
  {
    label: "Check In",
    role: "You are the patient",
    hint: "Fill out the check in form, just like your patients would on their phone after scanning the QR code. Note: you get a unique QR code per location.",
  },
  {
    label: "Approve",
    role: "You are the receptionist",
    hint: "Review the patient details and approve them to trigger the AI pre screening conversation. You can edit their info using the edit icon. Returning patients are automatically identified by name and date of birth.",
  },
  {
    label: "AI Screening",
    role: "You are the patient",
    hint: "Answer the AI's questions. It builds a structured symptom profile automatically, saving your staff time. The conversation ends on its own when enough information is collected. Afterward, you will verify a phone number.",
  },
  {
    label: "Diagnose",
    role: "You are the doctor",
    hint: "Browse the summary, full transcript, and AI diagnostic tabs. When ready, click the pulsing Complete button at the bottom to enter a diagnosis and set a follow up. Patients who miss their follow up date receive up to two SMS reminders automatically.",
  },
  {
    label: "Feedback",
    role: "Visit complete",
    hint: "Patients receive an SMS with their visit summary and a review request. You can configure which external platform they are directed to and set the star threshold in platform settings.",
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
                  className={`mt-1.5 text-[10px] leading-tight text-center ${
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
        <p className="text-xs text-center text-gray-600">
          <span className="font-semibold text-hilt-blue">
            {STEPS[currentStep - 1].role}.
          </span>{" "}
          {STEPS[currentStep - 1].hint}
        </p>
      </div>
    </div>
  );
}
