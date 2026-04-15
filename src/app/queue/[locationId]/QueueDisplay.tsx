"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { formatQueueNumber } from "@/lib/queueUtils";
import {
  LOBBY_VIDEO_BUCKET,
  type TvDisplayConfig,
  type TvDisplayMode,
  type TvOverlayPosition,
} from "@/lib/tvDisplay";

interface QueueEntry {
  queue_number: number;
  status: string;
  staff_room?: string | null;
}

interface VideoItem {
  id: string;
  url: string;
  storage_path: string;
}

interface QueueData {
  success: boolean;
  location_name?: string;
  queue_type?: string;
  logo_url?: string | null;
  queue?: QueueEntry[];
  tv_display_mode?: TvDisplayMode;
  tv_overlay_position?: TvOverlayPosition;
  tv_overlay_visible?: boolean;
  tv_queue_duration_seconds?: number;
  tv_audio_muted?: boolean;
  videos?: Array<{ id: string; storage_path: string }>;
  error?: string;
}

type Phase = { kind: "queue" } | { kind: "video"; videoId: string };

function buildPublicUrl(supabaseUrl: string, storagePath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${LOBBY_VIDEO_BUCKET}/${storagePath}`;
}

function videosKey(videos: VideoItem[]): string {
  return videos.map((v) => `${v.id}|${v.storage_path}`).join(",");
}

function configsEqual(a: TvDisplayConfig, b: TvDisplayConfig): boolean {
  return (
    a.mode === b.mode &&
    a.position === b.position &&
    a.overlayVisible === b.overlayVisible &&
    a.queueDurationSeconds === b.queueDurationSeconds &&
    a.audioMuted === b.audioMuted
  );
}

function parseInitial(data: QueueData): {
  queue: QueueEntry[];
  videos: VideoItem[];
  config: TvDisplayConfig;
} {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return {
    queue: data.queue ?? [],
    videos: (data.videos ?? []).map((v) => ({
      id: v.id,
      storage_path: v.storage_path,
      url: buildPublicUrl(supabaseUrl, v.storage_path),
    })),
    config: {
      mode: data.tv_display_mode ?? "none",
      position: data.tv_overlay_position ?? "top-left",
      overlayVisible: data.tv_overlay_visible ?? true,
      queueDurationSeconds: data.tv_queue_duration_seconds ?? 10,
      audioMuted: data.tv_audio_muted ?? true,
    },
  };
}

export default function QueueDisplay({
  locationId,
  initialData,
}: {
  locationId: string;
  initialData: QueueData;
}) {
  const parsed = useMemo(() => parseInitial(initialData), [initialData]);

  const [success, setSuccess] = useState(initialData.success);
  const [locationName, setLocationName] = useState(initialData.location_name ?? "");
  const [queueType, setQueueType] = useState(initialData.queue_type ?? "fifo");
  const [logoUrl, setLogoUrl] = useState<string | null>(initialData.logo_url ?? null);
  const [queue, setQueue] = useState<QueueEntry[]>(parsed.queue);
  const [videos, setVideos] = useState<VideoItem[]>(parsed.videos);
  const [config, setConfig] = useState<TvDisplayConfig>(parsed.config);
  const [time, setTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "queue" });
  const [showTapForSound, setShowTapForSound] = useState(false);

  const supabaseRef = useRef(
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const configRef = useRef(config);
  const videosRef = useRef(videos);
  const erroredIdsRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPlayedIdRef = useRef<string | null>(null);

  useEffect(() => {
    configRef.current = config;
  }, [config]);
  useEffect(() => {
    videosRef.current = videos;
    // Prune errored ids that no longer exist
    const ids = new Set(videos.map((v) => v.id));
    const next = new Set<string>();
    erroredIdsRef.current.forEach((id) => {
      if (ids.has(id)) next.add(id);
    });
    erroredIdsRef.current = next;
  }, [videos]);

  // Poll every 5 seconds, update only slices that actually changed
  const fetchQueue = useCallback(async () => {
    const { data: fresh } = await supabaseRef.current.rpc("get_queue_display", {
      p_location_id: locationId,
    });
    if (!fresh) return;
    if (!fresh.success) {
      setSuccess(false);
      return;
    }
    setSuccess(true);
    if (fresh.location_name && fresh.location_name !== locationName) {
      setLocationName(fresh.location_name);
    }
    if (fresh.queue_type && fresh.queue_type !== queueType) {
      setQueueType(fresh.queue_type);
    }
    if ((fresh.logo_url ?? null) !== logoUrl) setLogoUrl(fresh.logo_url ?? null);
    setQueue(fresh.queue ?? []);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const freshVideos: VideoItem[] = (fresh.videos ?? []).map(
      (v: { id: string; storage_path: string }) => ({
        id: v.id,
        storage_path: v.storage_path,
        url: buildPublicUrl(supabaseUrl, v.storage_path),
      })
    );
    if (videosKey(freshVideos) !== videosKey(videosRef.current)) {
      setVideos(freshVideos);
      // If the currently playing video disappeared from the playlist, bail to queue phase
      setPhase((prev) => {
        if (prev.kind !== "video") return prev;
        if (!freshVideos.some((v) => v.id === prev.videoId)) return { kind: "queue" };
        return prev;
      });
    }

    const freshConfig: TvDisplayConfig = {
      mode: (fresh.tv_display_mode as TvDisplayMode) ?? "none",
      position: (fresh.tv_overlay_position as TvOverlayPosition) ?? "top-left",
      overlayVisible: fresh.tv_overlay_visible ?? true,
      queueDurationSeconds: fresh.tv_queue_duration_seconds ?? 10,
      audioMuted: fresh.tv_audio_muted ?? true,
    };
    if (!configsEqual(freshConfig, configRef.current)) {
      setConfig(freshConfig);
    }
  }, [locationId, locationName, queueType, logoUrl]);

  useEffect(() => {
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Scheduler state machine
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (config.mode === "none" || videos.length === 0) return;

    if (phase.kind === "queue") {
      const dur = configRef.current.queueDurationSeconds;
      timerRef.current = setTimeout(() => {
        const mode = configRef.current.mode;
        const all = videosRef.current;
        const errored = erroredIdsRef.current;

        let nextId: string | null = null;
        if (mode === "alternating") {
          // Start from the video after the last-played, wrap around the list
          const lastId = lastPlayedIdRef.current;
          const lastIdx = lastId ? all.findIndex((v) => v.id === lastId) : -1;
          const startFrom = lastIdx >= 0 ? lastIdx + 1 : 0;
          for (let i = 0; i < all.length; i++) {
            const candidate = all[(startFrom + i) % all.length];
            if (!errored.has(candidate.id)) {
              nextId = candidate.id;
              break;
            }
          }
        } else {
          // batched: first non-errored video
          for (const v of all) {
            if (!errored.has(v.id)) {
              nextId = v.id;
              break;
            }
          }
        }

        if (nextId) {
          lastPlayedIdRef.current = nextId;
          setPhase({ kind: "video", videoId: nextId });
        } else {
          setPhase({ kind: "queue" });
        }
      }, dur * 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, config.mode, videos.length]);

  // Unmount cleanup for long running TV sessions (read ref at teardown time)
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const v = videoRef.current;
      if (v) {
        try {
          v.pause();
          v.removeAttribute("src");
          v.load();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Keep lastPlayedIdRef in sync so alternating rotation can pick the next video
  useEffect(() => {
    if (phase.kind === "video") {
      lastPlayedIdRef.current = phase.videoId;
    }
  }, [phase]);

  // When video element (re)mounts, attempt play and detect blocked autoplay for sound
  useEffect(() => {
    if (phase.kind !== "video") return;
    const v = videoRef.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.catch === "function") {
      p.catch((err) => {
        if (err?.name === "NotAllowedError" && !configRef.current.audioMuted) {
          setShowTapForSound(true);
        } else if (err?.name !== "AbortError") {
          console.error(err);
        }
      });
    }
  }, [phase]);


  function advanceFromCurrentVideo() {
    if (phase.kind !== "video") return;
    if (configRef.current.mode === "alternating") {
      setPhase({ kind: "queue" });
      return;
    }
    // batched: find current position in FULL list, skip forward past errored videos
    const all = videosRef.current;
    const errored = erroredIdsRef.current;
    const idx = all.findIndex((x) => x.id === phase.videoId);
    if (idx >= 0) {
      for (let i = idx + 1; i < all.length; i++) {
        if (!errored.has(all[i].id)) {
          lastPlayedIdRef.current = all[i].id;
          setPhase({ kind: "video", videoId: all[i].id });
          return;
        }
      }
    }
    setPhase({ kind: "queue" });
  }

  function handleVideoEnded() {
    advanceFromCurrentVideo();
  }

  function handleVideoError() {
    if (phase.kind !== "video") return;
    erroredIdsRef.current.add(phase.videoId);
    advanceFromCurrentVideo();
  }

  function handleTapForSound() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    void v.play().catch(() => {});
    setShowTapForSound(false);
  }

  // For Mode B (batched), preload the next video while current plays
  const preloadUrl = useMemo(() => {
    if (phase.kind !== "video" || config.mode !== "batched") return null;
    const idx = videos.findIndex((v) => v.id === phase.videoId);
    if (idx < 0 || idx >= videos.length - 1) return null;
    return videos[idx + 1].url;
  }, [phase, config.mode, videos]);

  const currentVideo =
    phase.kind === "video" ? videos.find((v) => v.id === phase.videoId) ?? null : null;

  const requestFullscreen = () => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    setIsFullscreen(true);
  };

  if (!success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-500">Queue display unavailable</p>
      </div>
    );
  }

  const nowServing = queue.filter((e) => e.status === "claimed_by_doctor");
  const waiting = queue.filter((e) => e.status === "waiting_doctor_claim");
  const overlayCorner =
    config.position === "top-right" ? "top-4 right-4" : "top-4 left-4";

  const showVideo = phase.kind === "video" && currentVideo !== null;

  const handleScreenClick = () => {
    if (!isFullscreen) requestFullscreen();
    if (showTapForSound) handleTapForSound();
  };

  return (
    <div
      className="relative flex min-h-screen flex-col bg-gray-50 select-none cursor-default"
      onClick={handleScreenClick}
    >
      {showVideo ? (
        <>
          <video
            ref={videoRef}
            key={currentVideo!.id}
            src={currentVideo!.url}
            autoPlay
            muted={config.audioMuted}
            playsInline
            preload="auto"
            onEnded={handleVideoEnded}
            onError={handleVideoError}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {preloadUrl && (
            <video
              key={`preload-${preloadUrl}`}
              src={preloadUrl}
              preload="auto"
              muted
              className="hidden"
            />
          )}
          {config.overlayVisible && (
            <div
              className={`absolute z-10 rounded-xl bg-black/70 p-4 text-white shadow-lg backdrop-blur-sm ${overlayCorner}`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                Now Serving
              </p>
              {nowServing.length > 0 ? (
                <p className="mt-1 text-4xl font-black leading-none">
                  {formatQueueNumber(nowServing[0].queue_number, queueType)}
                </p>
              ) : (
                <p className="mt-1 text-sm text-white/70">, </p>
              )}
              {waiting.length > 0 && (
                <p className="mt-2 text-xs text-white/80">
                  Up Next,{" "}
                  {waiting
                    .slice(0, 3)
                    .map((e) => formatQueueNumber(e.queue_number, queueType))
                    .join(", ")}
                </p>
              )}
            </div>
          )}
          {showTapForSound && !config.audioMuted && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
              <p className="rounded-full bg-white px-8 py-4 text-xl font-semibold text-ink shadow-xl">
                Tap anywhere for sound
              </p>
            </div>
          )}
        </>
      ) : (
        <FullScreenQueue
          locationName={locationName}
          logoUrl={logoUrl}
          queueType={queueType}
          nowServing={nowServing}
          waiting={waiting}
          time={time}
        />
      )}

      {!isFullscreen && !showVideo && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-gray-900/80 px-6 py-2 text-sm text-white backdrop-blur">
          Tap anywhere to enter fullscreen
        </div>
      )}
    </div>
  );
}

function FullScreenQueue({
  locationName,
  logoUrl,
  queueType,
  nowServing,
  waiting,
  time,
}: {
  locationName: string;
  logoUrl: string | null;
  queueType: string;
  nowServing: QueueEntry[];
  waiting: QueueEntry[];
  time: Date;
}) {
  return (
    <>
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
        <div className="flex items-center gap-4">
          {logoUrl && (
            <img src={logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
          )}
          <h1 className="text-2xl font-bold text-gray-900">{locationName}</h1>
        </div>
        <time className="text-xl font-medium tabular-nums text-gray-500">
          {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </time>
      </header>

      <main className="flex flex-1 flex-col gap-8 p-8">
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Now Serving
          </h2>
          {nowServing.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {nowServing.map((e) => (
                <div
                  key={e.queue_number}
                  className="flex min-w-[160px] flex-col items-center justify-center rounded-2xl bg-emerald-500 px-10 py-8 shadow-lg transition-all duration-500"
                >
                  <span className="text-6xl font-black text-white md:text-7xl lg:text-8xl">
                    {formatQueueNumber(e.queue_number, queueType)}
                  </span>
                  {e.staff_room && (
                    <span className="mt-2 text-xl font-semibold text-white/95 md:text-2xl">
                      {e.staff_room}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200">
              <span className="text-lg text-gray-400">No patients being seen</span>
            </div>
          )}
        </section>

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
              <span className="text-lg text-gray-400">No patients waiting</span>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
