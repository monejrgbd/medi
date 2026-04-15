"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import {
  ALLOWED_VIDEO_MIME,
  LOBBY_VIDEO_BUCKET,
  MAX_VIDEOS_PER_LOCATION,
  MAX_VIDEO_BYTES,
  type LocationVideo,
  type TvDisplayConfig,
  type TvDisplayMode,
  type TvOverlayPosition,
} from "@/lib/tvDisplay";
import {
  deleteLocationVideo,
  fetchLocationVideos,
  registerLocationVideo,
  reorderLocationVideos,
  updateTvDisplayConfig,
} from "@/app/(dashboard)/d/_actions/locations";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://hilthealth.com";

type UploadState =
  | { kind: "idle" }
  | { kind: "validating"; fileName: string }
  | {
      kind: "uploading";
      fileName: string;
      loaded: number;
      total: number;
      elapsedMs: number;
      xhr: XMLHttpRequest;
    }
  | { kind: "registering"; fileName: string }
  | { kind: "error"; message: string };

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatEta(seconds: number): string {
  if (!isFinite(seconds) || seconds < 1) return "almost done";
  if (seconds < 60) return `${Math.round(seconds)}s remaining`;
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}m ${sec}s remaining`;
}

export default function TVDisplayConfig({
  locationId,
  orgId,
  initial,
}: {
  locationId: string;
  orgId: string;
  initial: TvDisplayConfig;
}) {
  const [config, setConfig] = useState<TvDisplayConfig>(initial);
  const [savedConfig, setSavedConfig] = useState<TvDisplayConfig>(initial);
  const [saving, setSaving] = useState(false);
  const [videos, setVideos] = useState<LocationVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [upload, setUpload] = useState<UploadState>({ kind: "idle" });
  const [showAudioHelp, setShowAudioHelp] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const supabaseRef = useRef(
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dirty = useMemo(
    () =>
      config.mode !== savedConfig.mode ||
      config.position !== savedConfig.position ||
      config.overlayVisible !== savedConfig.overlayVisible ||
      config.queueDurationSeconds !== savedConfig.queueDurationSeconds ||
      config.audioMuted !== savedConfig.audioMuted,
    [config, savedConfig]
  );

  const loadVideos = useCallback(async () => {
    setLoadingVideos(true);
    const result = await fetchLocationVideos(locationId);
    if (result.success) {
      setVideos((result.videos || []) as LocationVideo[]);
    }
    setLoadingVideos(false);
  }, [locationId]);

  useEffect(() => {
    if (config.mode !== "none") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadVideos();
    } else {
      setLoadingVideos(false);
    }
  }, [config.mode, loadVideos]);

  async function handleSave() {
    setSaving(true);
    const result = await updateTvDisplayConfig(locationId, config);
    setSaving(false);
    if (!result.success) {
      toast.error(result.error || "Failed to save TV settings");
      return;
    }
    setSavedConfig(config);
    toast.success("Saved, changes appear on TV within 5 seconds.");
  }

  async function validateVideoFile(file: File): Promise<{ ok: true } | { ok: false; error: string }> {
    if (file.size > MAX_VIDEO_BYTES) {
      return { ok: false, error: `File too large (${formatBytes(file.size)}). Max 500 MB.` };
    }
    if (!ALLOWED_VIDEO_MIME.includes(file.type)) {
      return { ok: false, error: "Unsupported format. Use MP4 (H.264)." };
    }

    // Codec probe: try to load into a hidden video element
    const probe: { ok: true; width: number; height: number } | { ok: false; error: string } =
      await new Promise((resolve) => {
        const video = document.createElement("video");
        const objectUrl = URL.createObjectURL(file);
        const cleanup = () => URL.revokeObjectURL(objectUrl);

        video.preload = "metadata";
        video.muted = true;
        video.onloadedmetadata = () => {
          const ok = video.duration > 0;
          const width = video.videoWidth;
          const height = video.videoHeight;
          cleanup();
          resolve(
            ok
              ? { ok: true, width, height }
              : { ok: false, error: "Unsupported codec, use H.264/AAC MP4." }
          );
        };
        video.onerror = () => {
          cleanup();
          resolve({ ok: false, error: "Unsupported codec, use H.264/AAC MP4." });
        };
        video.src = objectUrl;
      });

    if (!probe.ok) return probe;

    if (probe.width > 1920 || probe.height > 1080) {
      toast.warning(`Video is ${probe.width} x ${probe.height}. TV may stutter. 1080p recommended.`);
    }

    return { ok: true };
  }

  async function handleFile(file: File) {
    if (videos.length >= MAX_VIDEOS_PER_LOCATION) {
      toast.error(`Playlist full (${MAX_VIDEOS_PER_LOCATION}/${MAX_VIDEOS_PER_LOCATION}).`);
      return;
    }

    setUpload({ kind: "validating", fileName: file.name });
    const v = await validateVideoFile(file);
    if (!v.ok) {
      toast.error(v.error);
      setUpload({ kind: "idle" });
      return;
    }

    const sanitized = sanitizeFilename(file.name);
    const storagePath = `${orgId}/${locationId}/${crypto.randomUUID()}-${sanitized}`;

    const { data: signed, error: signError } = await supabaseRef.current.storage
      .from(LOBBY_VIDEO_BUCKET)
      .createSignedUploadUrl(storagePath);

    if (signError || !signed) {
      toast.error(signError?.message || "Could not get upload URL.");
      setUpload({ kind: "idle" });
      return;
    }

    const xhr = new XMLHttpRequest();
    const started = Date.now();
    setUpload({
      kind: "uploading",
      fileName: file.name,
      loaded: 0,
      total: file.size,
      elapsedMs: 0,
      xhr,
    });

    xhr.open("PUT", signed.signedUrl);
    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "max-age=86400");

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const elapsedMs = Date.now() - started;
      setUpload((prev) =>
        prev.kind === "uploading"
          ? { ...prev, loaded: e.loaded, total: e.total, elapsedMs }
          : prev
      );
    };

    const done = new Promise<boolean>((resolve) => {
      xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
      xhr.onerror = () => resolve(false);
      xhr.onabort = () => resolve(false);
    });
    xhr.send(file);

    const ok = await done;
    if (!ok) {
      // Keep "idle" if user cancelled; otherwise show error
      setUpload((prev) =>
        prev.kind === "uploading"
          ? { kind: "error", message: "Upload failed. Try again." }
          : prev
      );
      return;
    }

    setUpload({ kind: "registering", fileName: file.name });
    const register = await registerLocationVideo(locationId, {
      storagePath,
      fileName: sanitized,
      fileSize: file.size,
      mimeType: file.type || "video/mp4",
    });

    if (!register.success) {
      setUpload({ kind: "error", message: register.error || "Registration failed" });
      toast.error(register.error || "Registration failed");
      return;
    }

    setUpload({ kind: "idle" });
    toast.success("Video uploaded.");
    await loadVideos();
  }

  function cancelUpload() {
    if (upload.kind === "uploading") upload.xhr.abort();
    setUpload({ kind: "idle" });
  }

  async function handleDelete(video: LocationVideo) {
    if (!confirm(`Delete ${video.file_name}? This cannot be undone.`)) return;
    const result = await deleteLocationVideo(locationId, video.id);
    if (!result.success) {
      toast.error(result.error || "Delete failed");
      return;
    }
    toast.success("Video deleted.");
    await loadVideos();
  }

  async function moveVideo(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= videos.length) return;
    const reordered = [...videos];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    setVideos(reordered);
    const result = await reorderLocationVideos(
      locationId,
      reordered.map((v) => v.id)
    );
    if (!result.success) {
      toast.error(result.error || "Reorder failed");
      await loadVideos();
    }
  }

  function setMode(mode: TvDisplayMode) {
    setConfig((c) => ({ ...c, mode }));
  }
  function setPosition(position: TvOverlayPosition) {
    setConfig((c) => ({ ...c, position }));
  }

  const showPlaylistSection = config.mode !== "none";
  const canUpload = videos.length < MAX_VIDEOS_PER_LOCATION && upload.kind === "idle";

  return (
    <div className="mt-8 border-t border-gray-200 pt-8 text-left">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink">Configure TV</h3>
          <p className="text-xs text-ash">
            Control what plays on the TV, videos, queue overlays, and timing.
          </p>
        </div>
        <a
          href={`${APP_URL}/queue/${locationId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-ink hover:bg-gray-50"
        >
          Preview TV
        </a>
      </div>

      {/* Mode selector */}
      <fieldset className="mb-6">
        <legend className="mb-2 text-sm font-medium text-ink">Display mode</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          <ModeCard
            value="none"
            current={config.mode}
            onPick={setMode}
            title="None"
            timeline="Queue only"
            description="Just queue numbers. No video."
          />
          <ModeCard
            value="alternating"
            current={config.mode}
            onPick={setMode}
            title="Alternating"
            timeline="Queue -> Video -> Queue -> Video"
            description="Full screen queue between each video."
          />
          <ModeCard
            value="batched"
            current={config.mode}
            onPick={setMode}
            title="Batched"
            timeline="Queue -> All videos -> Queue"
            description="Full screen queue bookends the whole playlist."
          />
        </div>
      </fieldset>

      {config.mode !== "none" && (
        <>
          {/* Overlay */}
          <fieldset className="mb-6">
            <legend className="mb-2 text-sm font-medium text-ink">Queue overlay during video</legend>
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex rounded-lg bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setPosition("top-left")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                    config.position === "top-left" ? "bg-white text-ink shadow-sm" : "text-slate"
                  }`}
                >
                  Top left
                </button>
                <button
                  type="button"
                  onClick={() => setPosition("top-right")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                    config.position === "top-right" ? "bg-white text-ink shadow-sm" : "text-slate"
                  }`}
                >
                  Top right
                </button>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={config.overlayVisible}
                  onChange={(e) => setConfig((c) => ({ ...c, overlayVisible: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Show queue overlay during video
              </label>
            </div>
          </fieldset>

          {/* Queue duration */}
          <fieldset className="mb-6">
            <label className="mb-2 block text-sm font-medium text-ink">
              Full screen queue duration
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={3}
                max={60}
                value={config.queueDurationSeconds}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    queueDurationSeconds: Math.max(3, Math.min(60, Number(e.target.value) || 10)),
                  }))
                }
                className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <span className="text-sm text-slate">seconds (3 to 60)</span>
            </div>
          </fieldset>
        </>
      )}

      {/* Audio */}
      <fieldset className="mb-6">
        <legend className="mb-2 text-sm font-medium text-ink">Audio</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.audioMuted}
            onChange={(e) => setConfig((c) => ({ ...c, audioMuted: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300"
          />
          Mute TV audio (recommended for lobby)
        </label>
        {!config.audioMuted && (
          <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <button
              type="button"
              onClick={() => setShowAudioHelp((v) => !v)}
              className="font-medium underline"
            >
              {showAudioHelp ? "Hide setup instructions" : "Sound needs one time browser setup, show how"}
            </button>
            {showAudioHelp && (
              <div className="mt-2 space-y-1.5 leading-relaxed">
                <p>
                  Browsers block video sound unless the TV&apos;s browser is configured in advance. Do one of
                  these once on the TV:
                </p>
                <p>
                  <strong>Option 1 (recommended):</strong> Launch Chrome with{" "}
                  <code className="rounded bg-amber-100 px-1">
                    --autoplay-policy=no-user-gesture-required
                  </code>
                  .
                </p>
                <p>
                  <strong>Option 2:</strong> Chrome Settings, Site Settings, Sound, Add our domain.
                </p>
                <p>
                  Without either, the TV will show a &ldquo;Tap for sound&rdquo; prompt. Videos play silently
                  until a tap.
                </p>
              </div>
            )}
          </div>
        )}
      </fieldset>

      {/* Playlist */}
      {showPlaylistSection && (
        <fieldset className="mb-6">
          <legend className="mb-2 text-sm font-medium text-ink">
            Playlist ({videos.length}/{MAX_VIDEOS_PER_LOCATION})
          </legend>
          {loadingVideos ? (
            <p className="text-sm text-slate">Loading videos...</p>
          ) : (
            <div className="space-y-2">
              {videos.length === 0 && upload.kind === "idle" && (
                <p className="text-sm text-slate">
                  No videos yet. Upload an MP4 to get started.
                </p>
              )}

              {videos.map((video, idx) => (
                <div
                  key={video.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
                >
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => moveVideo(idx, -1)}
                      disabled={idx === 0}
                      className="text-xs text-slate disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveVideo(idx, 1)}
                      disabled={idx === videos.length - 1}
                      className="text-xs text-slate disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ▼
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm text-ink">{video.file_name}</p>
                    <p className="text-xs text-ash">{formatBytes(video.file_size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(video)}
                    className="rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              ))}

              {upload.kind === "uploading" && (
                <UploadProgressRow
                  fileName={upload.fileName}
                  loaded={upload.loaded}
                  total={upload.total}
                  elapsedMs={upload.elapsedMs}
                  onCancel={cancelUpload}
                />
              )}
              {upload.kind === "validating" && (
                <p className="text-xs text-slate">Checking {upload.fileName}...</p>
              )}
              {upload.kind === "registering" && (
                <p className="text-xs text-slate">Finalising {upload.fileName}...</p>
              )}
              {upload.kind === "error" && (
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <span>{upload.message}</span>
                  <button
                    type="button"
                    onClick={() => setUpload({ kind: "idle" })}
                    className="font-medium underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {canUpload && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) void handleFile(file);
                  }}
                  className={`rounded-lg border-2 border-dashed p-4 text-center ${
                    dragOver ? "border-hilt-blue bg-hilt-blue/5" : "border-gray-300"
                  }`}
                >
                  <p className="mb-2 text-sm text-slate">
                    Drop an MP4 here, or
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg bg-hilt-blue px-3 py-1.5 text-xs font-medium text-white hover:bg-hilt-blue-dark"
                  >
                    Choose file
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/x-m4v,application/mp4"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleFile(f);
                      e.target.value = "";
                    }}
                  />
                  <p className="mt-2 text-xs text-ash">Up to 500 MB per file.</p>
                </div>
              )}
              {!canUpload && upload.kind === "idle" && videos.length >= MAX_VIDEOS_PER_LOCATION && (
                <p className="text-xs text-amber-700">
                  Playlist full ({MAX_VIDEOS_PER_LOCATION}/{MAX_VIDEOS_PER_LOCATION}). Delete a video to upload another.
                </p>
              )}
            </div>
          )}
        </fieldset>
      )}

      {/* Hardware tip */}
      <div className="mb-6 rounded-lg bg-gray-50 p-3 text-xs text-slate">
        <p className="mb-1 font-medium text-ink">TV hardware tips</p>
        <p>
          For reliable playback, use a Chromium browser (Chrome or Edge on a laptop, Chromebox, or
          Android TV). Smart TV native browsers may not play consistently.
        </p>
        <p className="mt-1">
          <span className="font-medium">Video encoding:</span> MP4 H.264 + AAC, 1080p max, 3 to 5 Mbps
          bitrate. Free tools, HandBrake or CloudConvert.
        </p>
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
        {dirty && <span className="text-xs text-amber-700">Unsaved changes</span>}
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="rounded-lg bg-hilt-blue px-4 py-2 text-sm font-semibold text-white hover:bg-hilt-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

function ModeCard({
  value,
  current,
  onPick,
  title,
  timeline,
  description,
}: {
  value: TvDisplayMode;
  current: TvDisplayMode;
  onPick: (mode: TvDisplayMode) => void;
  title: string;
  timeline: string;
  description: string;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onPick(value)}
      className={`rounded-lg border p-3 text-left transition-colors ${
        active ? "border-hilt-blue bg-hilt-blue/5" : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 font-mono text-[10px] text-slate">{timeline}</p>
      <p className="mt-1 text-xs text-ash">{description}</p>
    </button>
  );
}

function UploadProgressRow({
  fileName,
  loaded,
  total,
  elapsedMs,
  onCancel,
}: {
  fileName: string;
  loaded: number;
  total: number;
  elapsedMs: number;
  onCancel: () => void;
}) {
  const pct = total > 0 ? Math.min(100, (loaded / total) * 100) : 0;
  const etaText =
    elapsedMs > 2000 && loaded > 0
      ? formatEta(((total - loaded) / loaded) * (elapsedMs / 1000))
      : "";
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="mb-1 flex items-center justify-between">
        <p className="truncate text-sm text-ink">{fileName}</p>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-slate underline hover:text-ink"
        >
          Cancel
        </button>
      </div>
      <div className="h-2 w-full overflow-hidden rounded bg-gray-200">
        <div
          className="h-full bg-hilt-blue transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-ash">
        {formatBytes(loaded)} / {formatBytes(total)}
        {etaText ? `, ${etaText}` : ""}
      </p>
    </div>
  );
}
