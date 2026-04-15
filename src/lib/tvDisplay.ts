export type TvDisplayMode = "none" | "alternating" | "batched";
export type TvOverlayPosition = "top-left" | "top-right";

export type TvDisplayConfig = {
  mode: TvDisplayMode;
  position: TvOverlayPosition;
  overlayVisible: boolean;
  queueDurationSeconds: number;
  audioMuted: boolean;
};

export type LocationVideo = {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  sort_order: number;
  storage_path: string;
  created_at: string;
};

export const MAX_VIDEOS_PER_LOCATION = 10;
export const MAX_VIDEO_BYTES = 524_288_000;
export const ALLOWED_VIDEO_MIME: ReadonlyArray<string> = [
  "video/mp4",
  "video/x-m4v",
  "application/mp4",
];
export const LOBBY_VIDEO_BUCKET = "lobby-videos";
