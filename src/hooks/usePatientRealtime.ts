"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface StatusChangePayload {
  visit_id: string;
  status: string;
  old_status: string;
  timeout_flagged?: boolean;
  denied?: boolean;
}

interface SummaryReadyPayload {
  visit_id: string;
  summary: string;
  structured_card?: Record<string, unknown> | null;
}

interface QueueUpdatePayload {
  position: number;
  estimated_wait_minutes: number | null;
}

export type RealtimePayload =
  | { type: "status_change"; payload: StatusChangePayload }
  | { type: "summary_ready"; payload: SummaryReadyPayload }
  | { type: "queue_update"; payload: QueueUpdatePayload };

export function usePatientRealtime(
  sessionToken: string | null,
  onEvent: (event: RealtimePayload) => void
) {
  const supabaseRef = useRef(createClient());
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    if (!sessionToken) return;

    const supabase = supabaseRef.current;
    const channelName = `patient:${sessionToken}`;

    // Subscribe to broadcast
    const channel = supabase
      .channel(channelName)
      .on("broadcast", { event: "status_change" }, (payload) => {
        callbackRef.current({
          type: "status_change",
          payload: payload.payload as StatusChangePayload,
        });
      })
      .on("broadcast", { event: "summary_ready" }, (payload) => {
        callbackRef.current({
          type: "summary_ready",
          payload: payload.payload as SummaryReadyPayload,
        });
      })
      .on("broadcast", { event: "queue_update" }, (payload) => {
        callbackRef.current({
          type: "queue_update",
          payload: payload.payload as QueueUpdatePayload,
        });
      })
      .subscribe();

    // Fallback: poll every 5s (only fire on actual status change)
    let lastPolledStatus: string | null = null;
    let summaryEmitted = false;
    const interval = setInterval(async () => {
      const { data } = await supabase.rpc("get_patient_session", {
        p_session_token: sessionToken,
      });
      if (!data?.success) return;

      // Skip first poll to establish baseline (avoids initial spurious event)
      if (lastPolledStatus === null) {
        lastPolledStatus = data.status;
        return;
      }

      // Fire on status change
      if (data.status && data.status !== lastPolledStatus) {
        lastPolledStatus = data.status;
        summaryEmitted = false;
        callbackRef.current({
          type: "status_change",
          payload: {
            visit_id: data.visit_id,
            status: data.status,
            old_status: "",
            timeout_flagged: data.timeout_flagged,
            denied: data.patient_denied,
          },
        });
      }

      // Check for summary_ready (ai_summary present while still in AI state, emit once)
      if (data.ai_summary && data.status === "still_answering_ai" && !summaryEmitted) {
        summaryEmitted = true;
        callbackRef.current({
          type: "summary_ready",
          payload: {
            visit_id: data.visit_id,
            summary: data.ai_summary,
            structured_card: data.ai_structured_card,
          },
        });
      }

      // Emit queue_update from polling when waiting for doctor
      if (
        data.status === "waiting_doctor_claim" &&
        data.queue_position !== undefined
      ) {
        callbackRef.current({
          type: "queue_update",
          payload: {
            position: data.queue_position ?? 0,
            estimated_wait_minutes: data.estimated_wait_minutes ?? null,
          },
        });
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [sessionToken]);
}
