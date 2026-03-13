"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface NoDoctorsWarningProps {
  locationId: string;
  patientsWaiting: number;
}

export default function NoDoctorsWarning({
  locationId,
  patientsWaiting,
}: NoDoctorsWarningProps) {
  const [noDoctors, setNoDoctors] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    function check() {
      supabase
        .rpc("get_checked_in_doctors", { p_location_id: locationId })
        .then(({ data }) => {
          setNoDoctors(data?.success && (data.doctors?.length ?? 0) === 0);
        });
    }
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [locationId]);

  if (!noDoctors || patientsWaiting === 0) return null;

  return (
    <div className="mx-4 mb-4 rounded-lg border border-red-200 bg-red-50 p-3 lg:mx-6">
      <p className="text-sm font-medium text-red-800">
        No doctors checked in. {patientsWaiting} patient
        {patientsWaiting > 1 ? "s" : ""} waiting.
      </p>
    </div>
  );
}
