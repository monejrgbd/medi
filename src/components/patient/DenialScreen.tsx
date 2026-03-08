"use client";

interface DenialScreenProps {
  onRetry: () => void;
}

export default function DenialScreen({ onRetry }: DenialScreenProps) {
  return (
    <div className="w-full max-w-md text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <span className="text-3xl">&#10005;</span>
      </div>

      <h2 className="text-xl font-bold text-ink mb-2">
        Check-in Not Approved
      </h2>
      <p className="text-sm text-slate mb-6">
        Your check-in was not approved. Please speak to the front desk for
        assistance.
      </p>

      <button
        onClick={onRetry}
        className="rounded-lg bg-hilt-blue px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        Try Again
      </button>
    </div>
  );
}
