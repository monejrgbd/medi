"use client";

import { useState, useTransition } from "react";
import { claimPatient } from "@/app/(dashboard)/d/_actions/doctor";

interface ClaimButtonProps {
  visitId: string;
  onClaimed: (visitId: string) => void;
}

export default function ClaimButton({ visitId, onClaimed }: ClaimButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClaim() {
    setError(null);
    startTransition(async () => {
      const result = await claimPatient(visitId);

      if (result.success) {
        onClaimed(visitId);
        return;
      }

      if (result.already_claimed) {
        setError(`Already claimed by ${result.claimed_by_name}`);
        onClaimed(visitId);
        return;
      }

      setError(result.error || "Failed to claim patient");
    });
  }

  return (
    <div>
      <button
        onClick={handleClaim}
        disabled={isPending}
        className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? (
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Claiming...
          </span>
        ) : (
          "Claim"
        )}
      </button>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
