"use client";

interface WaitingApprovalProps {
  patientFirstName: string;
  locationName: string;
}

export default function WaitingApproval({
  patientFirstName,
  locationName,
}: WaitingApprovalProps) {
  return (
    <div className="w-full max-w-md text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-hilt-blue" />
      </div>

      <h2 className="text-xl font-bold text-ink mb-2">
        Welcome, {patientFirstName}
      </h2>
      <p className="text-sm text-slate mb-6">
        Please wait while the front desk at{" "}
        <span className="font-medium text-ink">{locationName}</span>{" "}
        confirms your check-in.
      </p>

      <div className="rounded-lg border border-gray-100 bg-white p-4">
        <p className="text-xs text-ash">
          This should only take a moment. Please do not close this page.
        </p>
      </div>
    </div>
  );
}
