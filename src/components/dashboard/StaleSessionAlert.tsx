"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface StaleSessionAlertProps {
  locationId: string;
}

export default function StaleSessionAlert({
  locationId,
}: StaleSessionAlertProps) {
  const [count, setCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    function check() {
      supabase
        .rpc("get_stale_session_count", { p_location_id: locationId })
        .then(({ data }) => {
          if (data?.success) setCount(data.count ?? 0);
        });
    }
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [locationId]);

  if (count === 0 || dismissed) return null;

  return (
    <div className="mx-4 mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-center justify-between lg:mx-6">
      <p className="text-sm text-amber-800">
        {count} patient{count > 1 ? "s have" : " has"} been waiting since
        yesterday.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="text-xs text-amber-600 hover:text-amber-800 ml-4 shrink-0"
      >
        Dismiss
      </button>
    </div>
  );
}
