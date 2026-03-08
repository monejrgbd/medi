"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface VisitChangePayload {
  eventType: "INSERT" | "UPDATE";
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}

export function useReceptionistRealtime(
  locationId: string | null,
  onVisitChange: (payload: VisitChangePayload) => void
) {
  const supabaseRef = useRef(createClient());
  const callbackRef = useRef(onVisitChange);
  callbackRef.current = onVisitChange;

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
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (row.location_id !== locationId) return;
          callbackRef.current({
            eventType: "INSERT",
            new: row,
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
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (row.location_id !== locationId) return;
          callbackRef.current({
            eventType: "UPDATE",
            new: row,
            old: payload.old as Record<string, unknown>,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [locationId]);
}
