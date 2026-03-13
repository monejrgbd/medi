"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  playNotificationChime,
  playUrgentChime,
} from "@/lib/notificationSound";

interface VisitChangePayload {
  eventType: "INSERT" | "UPDATE";
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}

export interface DoctorNotification {
  type: "new_queue" | "urgent";
  patientName?: string;
}

export function useDoctorRealtime(
  locationId: string | null,
  onVisitChange: (payload: VisitChangePayload) => void,
  options?: {
    soundEnabled?: boolean;
    onNotification?: (notification: DoctorNotification) => void;
  }
) {
  const supabaseRef = useRef(createClient());
  const callbackRef = useRef(onVisitChange);
  callbackRef.current = onVisitChange;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!locationId) return;

    const supabase = supabaseRef.current;

    const channel = supabase
      .channel(`doctor:${locationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "visits",
          filter: `location_id=eq.${locationId}`,
        },
        (payload) => {
          callbackRef.current({
            eventType: "INSERT",
            new: payload.new as Record<string, unknown>,
            old: {},
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "visits",
          filter: `location_id=eq.${locationId}`,
        },
        (payload) => {
          const visit = payload.new as Record<string, unknown>;
          const old = payload.old as Record<string, unknown>;
          const soundOn = optionsRef.current?.soundEnabled ?? true;

          // New patient in queue
          if (
            visit.status === "waiting_doctor_claim" &&
            old.status !== "waiting_doctor_claim"
          ) {
            playNotificationChime(soundOn);

            if (
              typeof Notification !== "undefined" &&
              Notification.permission === "granted"
            ) {
              new Notification("New patient in queue", {
                tag: `queue-${visit.id}`,
              });
            }

            optionsRef.current?.onNotification?.({ type: "new_queue" });
          }

          // High-urgency
          if (
            (visit.priority as number) === 3 &&
            (old.priority as number) !== 3
          ) {
            playUrgentChime(soundOn);
            optionsRef.current?.onNotification?.({
              type: "urgent",
              patientName: "Patient",
            });
          }

          callbackRef.current({
            eventType: "UPDATE",
            new: visit,
            old,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [locationId]);
}
