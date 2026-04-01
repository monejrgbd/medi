"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { formatQueueNumber } from "@/lib/queueUtils";

interface QueueEntry {
  queue_number: number;
  status: string;
}

interface QueueData {
  success: boolean;
  location_name?: string;
  queue_type?: string;
  logo_url?: string | null;
  queue?: QueueEntry[];
  error?: string;
}

export default function QueueDisplay({
  locationId,
  initialData,
}: {
  locationId: string;
  initialData: QueueData;
}) {
  const [data, setData] = useState<QueueData>(initialData);
  const [time, setTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  const supabaseRef = useRef(
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const fetchQueue = useCallback(async () => {
    const { data: fresh } = await supabaseRef.current.rpc("get_queue_display", {
      p_location_id: locationId,
    });
    if (fresh?.success) setData(fresh);
  }, [locationId]);

  // Poll every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const requestFullscreen = () => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    setIsFullscreen(true);
  };

  if (!data.success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-500">Queue display unavailable</p>
      </div>
    );
  }

  const queueType = data.queue_type ?? "fifo";
  const queue = data.queue ?? [];
  const nowServing = queue.filter((e) => e.status === "claimed_by_doctor");
  const waiting = queue.filter((e) => e.status === "waiting_doctor_claim");

  return (
    <div
      className="flex min-h-screen flex-col bg-gray-50 select-none cursor-default"
      onClick={() => !isFullscreen && requestFullscreen()}
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
        <div className="flex items-center gap-4">
          {data.logo_url && (
            <img
              src={data.logo_url}
              alt=""
              className="h-10 w-10 rounded-lg object-cover"
            />
          )}
          <h1 className="text-2xl font-bold text-gray-900">
            {data.location_name}
          </h1>
        </div>
        <time className="text-xl font-medium tabular-nums text-gray-500">
          {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </time>
      </header>

      <main className="flex flex-1 flex-col gap-8 p-8">
        {/* Now Serving */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Now Serving
          </h2>
          {nowServing.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {nowServing.map((e) => (
                <div
                  key={e.queue_number}
                  className="flex min-w-[160px] items-center justify-center rounded-2xl bg-emerald-500 px-10 py-8 shadow-lg transition-all duration-500"
                >
                  <span className="text-6xl font-black text-white md:text-7xl lg:text-8xl">
                    {formatQueueNumber(e.queue_number, queueType)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200">
              <span className="text-lg text-gray-400">
                No patients being seen
              </span>
            </div>
          )}
        </section>

        {/* Up Next */}
        <section className="flex-1">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Up Next
          </h2>
          {waiting.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {waiting.map((e) => (
                <div
                  key={e.queue_number}
                  className="flex min-w-[100px] items-center justify-center rounded-xl bg-white px-6 py-5 shadow-sm border border-gray-200 transition-all duration-500"
                >
                  <span className="text-3xl font-bold text-gray-700 md:text-4xl lg:text-5xl">
                    {formatQueueNumber(e.queue_number, queueType)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-gray-200">
              <span className="text-lg text-gray-400">
                No patients waiting
              </span>
            </div>
          )}
        </section>
      </main>

      {/* Fullscreen prompt */}
      {!isFullscreen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-gray-900/80 px-6 py-2 text-sm text-white backdrop-blur">
          Tap anywhere to enter fullscreen
        </div>
      )}
    </div>
  );
}
