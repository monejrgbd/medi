"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface StatusChangePayload {
  visit_id: string;
  status: string;
  old_status: string;
}

export function usePatientRealtime(
  sessionToken: string | null,
  onStatusChange: (payload: StatusChangePayload) => void
) {
  const supabaseRef = useRef(createClient());
  const callbackRef = useRef(onStatusChange);
  callbackRef.current = onStatusChange;

  useEffect(() => {
    if (!sessionToken) return;

    const supabase = supabaseRef.current;
    const channelName = `patient:${sessionToken}`;

    // Subscribe to broadcast
    const channel = supabase
      .channel(channelName)
      .on("broadcast", { event: "status_change" }, (payload) => {
        callbackRef.current(payload.payload as StatusChangePayload);
      })
      .subscribe();

    // Fallback: poll every 5s
    const interval = setInterval(async () => {
      const { data } = await supabase.rpc("get_patient_session", {
        p_session_token: sessionToken,
      });
      if (data?.success && data.status) {
        callbackRef.current({
          visit_id: data.visit_id,
          status: data.status,
          old_status: "",
        });
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [sessionToken]);
}
