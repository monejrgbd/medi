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

export interface ReceptionistNotification {
  type: "new_patient" | "urgent" | "queue_ready";
  patientName?: string;
}

export function useReceptionistRealtime(
  locationId: string | null,
  onVisitChange: (payload: VisitChangePayload) => void,
  options?: {
    soundEnabled?: boolean;
    onNotification?: (notification: ReceptionistNotification) => void;
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
      .channel(`receptionist:${locationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "visits",
          filter: `location_id=eq.${locationId}`,
        },
        (payload) => {
          const visit = { ...(payload.new as Record<string, unknown>) };
          delete visit.ai_diagnostic;

          // Notify for new pending visits
          if (visit.status === "pending_approval") {
            const soundOn = optionsRef.current?.soundEnabled ?? true;
            playNotificationChime(soundOn);

            if (
              typeof Notification !== "undefined" &&
              Notification.permission === "granted"
            ) {
              new Notification("New patient check-in", {
                body: "A new patient is waiting for approval.",
                tag: `new-patient-${visit.id}`,
              });
            }

            optionsRef.current?.onNotification?.({
              type: "new_patient",
            });
          }

          callbackRef.current({
            eventType: "INSERT",
            new: visit,
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
          const visit = { ...(payload.new as Record<string, unknown>) };
          delete visit.ai_diagnostic;
          const old = { ...(payload.old as Record<string, unknown>) };
          delete old.ai_diagnostic;
          const soundOn = optionsRef.current?.soundEnabled ?? true;

          // High-urgency notification
          if (
            (visit.priority as number) === 3 &&
            (old.priority as number) !== 3
          ) {
            playUrgentChime(soundOn);

            // Fetch patient name for the urgent notification banner
            const patientId = visit.patient_id as string;
            if (patientId) {
              supabase
                .from("patients")
                .select("first_name, last_name")
                .eq("id", patientId)
                .single()
                .then(({ data: pt }) => {
                  optionsRef.current?.onNotification?.({
                    type: "urgent",
                    patientName: pt
                      ? `${pt.first_name} ${pt.last_name}`
                      : "Patient",
                  });
                });
            } else {
              optionsRef.current?.onNotification?.({
                type: "urgent",
                patientName: "Patient",
              });
            }
          }

          // Mode 2 arrival: patient transitions from awaiting_arrival to pending_approval
          // when they tap "I have arrived" — the receptionist now needs to approve them.
          if (
            visit.status === "pending_approval" &&
            old.status === "awaiting_arrival"
          ) {
            playNotificationChime(soundOn);

            if (
              typeof Notification !== "undefined" &&
              Notification.permission === "granted"
            ) {
              new Notification("Patient arrived", {
                body: "A pre-screened patient has arrived and is ready for approval.",
                tag: `arrived-${visit.id}`,
              });
            }

            optionsRef.current?.onNotification?.({ type: "new_patient" });
          }

          // Patient entered queue
          if (
            visit.status === "waiting_doctor_claim" &&
            old.status !== "waiting_doctor_claim"
          ) {
            playNotificationChime(soundOn);

            if (
              typeof Notification !== "undefined" &&
              Notification.permission === "granted"
            ) {
              new Notification("Patient ready for queue", {
                tag: `queue-${visit.id}`,
              });
            }

            optionsRef.current?.onNotification?.({ type: "queue_ready" });
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
