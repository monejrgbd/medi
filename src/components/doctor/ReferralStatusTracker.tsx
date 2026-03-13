"use client";

const STEPS = ["sent", "viewed", "patient_arrived", "completed"] as const;

const STEP_LABELS: Record<string, string> = {
  sent: "Sent",
  viewed: "Viewed",
  patient_arrived: "Arrived",
  completed: "Completed",
  expired: "Expired",
};

interface ReferralStatusTrackerProps {
  status: string;
}

export default function ReferralStatusTracker({
  status,
}: ReferralStatusTrackerProps) {
  const isExpired = status === "expired";

  // Find the index of the current active step
  const activeIndex = isExpired
    ? STEPS.indexOf("sent") // expired branches off after sent
    : STEPS.indexOf(status as (typeof STEPS)[number]);

  return (
    <div className="flex items-center w-full">
      {(isExpired ? (["sent", "expired"] as const) : STEPS).map(
        (step, idx, arr) => {
          const isLast = idx === arr.length - 1;
          let stepState: "completed" | "active" | "future" | "expired";

          if (isExpired) {
            if (step === "sent") stepState = "completed";
            else stepState = "expired";
          } else if (activeIndex < 0) {
            // Unknown status — show all as future
            stepState = "future";
          } else if (idx < activeIndex) {
            stepState = "completed";
          } else if (idx === activeIndex) {
            stepState = "active";
          } else {
            stepState = "future";
          }

          return (
            <div
              key={step}
              className={`flex items-center ${isLast ? "" : "flex-1"}`}
            >
              {/* Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    stepState === "completed"
                      ? "bg-green-500 text-white"
                      : stepState === "active"
                        ? "bg-hilt-blue text-white"
                        : stepState === "expired"
                          ? "bg-red-500 text-white"
                          : "bg-gray-200 text-ash"
                  }`}
                >
                  {stepState === "completed" ? (
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : stepState === "expired" ? (
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium whitespace-nowrap ${
                    stepState === "completed"
                      ? "text-green-600"
                      : stepState === "active"
                        ? "text-hilt-blue"
                        : stepState === "expired"
                          ? "text-red-600"
                          : "text-ash"
                  }`}
                >
                  {STEP_LABELS[step] ?? step}
                </span>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div
                  className={`mx-1 h-0.5 flex-1 ${
                    stepState === "completed"
                      ? "bg-green-400"
                      : stepState === "expired"
                        ? "bg-red-300"
                        : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        }
      )}
    </div>
  );
}
