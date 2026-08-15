export const homePath = () => "/";
export const libraryPath = () => "/library";
export const searchPath = () => "/search";
export const moviesPath = () => "/movies";
export const tvShowsPath = () => "/tv-shows";
export const animePath = () => "/anime";
export const photosPath = () => "/photos";
export const mediaPath = (id: string) => `/media/${id}`;
export const watchPath = (id: string, episodeId?: string) =>
  episodeId ? `/watch/${id}?episode=${encodeURIComponent(episodeId)}` : `/watch/${id}`;

/**
 * LAN upload endpoints. The Next.js rewrite in `next.config.ts` proxies
 * `/api/*` to the backend, so the browser can call these same-origin.
 */
export type MediaUploadKind = "photos" | "movies" | "series" | "anime";
export const uploadPath = (kind: MediaUploadKind) => `/api/${kind}/upload`;

export const playbackPath = (
  id: string,
  options: {
    audioStreamIndex?: number;
    subtitleStreamIndex?: number;
    mediaSourceId?: string;
  } = {},
) => {
  const params = new URLSearchParams();
  if (typeof options.audioStreamIndex === "number") {
    params.set("audio", String(options.audioStreamIndex));
  }
  if (typeof options.subtitleStreamIndex === "number") {
    params.set("subtitle", String(options.subtitleStreamIndex));
  }
  if (typeof options.mediaSourceId === "string" && options.mediaSourceId) {
    params.set("mediaSourceId", options.mediaSourceId);
  }
  const query = params.toString();
  return `/api/jellyfin/play/${encodeURIComponent(id)}${query ? `?${query}` : ""}`;
};
export const previewUrl = (id: string) => `${playbackPath(id)}&static=true`;