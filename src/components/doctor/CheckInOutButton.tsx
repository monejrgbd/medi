"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CheckInOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCheckOut(force = false) {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("staff_check_out", {
      ...(force ? { p_force: true } : {}),
    });

    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    if (data && !data.success) {
      // Check for "needs_confirmation" (last doctor warning)
      if (data.needs_confirmation) {
        const queueCount = data.queue_count ?? 0;
        setConfirmMessage(
          `You're the last doctor. ${queueCount} patient${queueCount !== 1 ? "s" : ""} still in queue. Check out anyway?`
        );
        setShowConfirm(true);
        return;
      }

      // Check for claimed patients error
      if (data.error?.includes("claimed")) {
        setError(
          "You have claimed patients. Complete or release them before checking out."
        );
        return;
      }

      setError(data.error || "Check-out failed");
      return;
    }

    router.push("/d/select-role");
  }

  return (
    <div className="relative">
      <button
        onClick={() => handleCheckOut(false)}
        disabled={loading}
        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-slate transition-colors hover:bg-gray-50 hover:text-ink disabled:opacity-50"
      >
        {loading ? "Checking out..." : "End Shift"}
      </button>

      {error && (
        <p className="absolute right-0 mt-1 text-xs text-red-600 whitespace-nowrap">
          {error}
        </p>
      )}

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-ink mb-2">
              Confirm Check-Out
            </h3>
            <p className="text-sm text-slate mb-6">{confirmMessage}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-slate hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  handleCheckOut(true);
                }}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Check Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
