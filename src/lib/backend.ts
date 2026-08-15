import { cache } from "react";
import { uploadPath, type MediaUploadKind } from "@/lib/routes";
import type { ContinueWatchingItem, MediaItem, MediaType } from "@/types/media";

const backendUrl = (process.env.BACKEND_URL ?? "http://127.0.0.1:5000").replace(/\/$/, "");

type MediaItemsResponse = {
  items: MediaItem[];
};

type MediaSectionsResponse = {
  items: Array<{
    id: string;
    title: string;
    type: string;
  }>;
};

type SeriesEpisodesResponse = {
  items: MediaItem[];
};

type ContinueWatchingResponse = {
  items: ContinueWatchingItem[];
};

export type BackendHealth = {
  connected: boolean;
  jellyfinUrl?: string;
  serverName?: string;
  version?: string;
};

const COLLECTION_REVALIDATE_SECONDS = 60;
const ITEM_REVALIDATE_SECONDS = 30;

/**
 * Adds Next's data-cache window via `init.next.revalidate`. Falls back to
 * `cache: "no-store"` so POSTs and per-user fetches always go fresh.
 */
function withCache(init: RequestInit, revalidate?: number): RequestInit {
  if (revalidate && revalidate > 0) {
    return { ...init, next: { revalidate } };
  }
  return { ...init, cache: "no-store" };
}

async function fetchJson<T>(path: string, init: RequestInit = {}, revalidate?: number): Promise<T> {
  const response = await fetch(`${backendUrl}${path}`, withCache(init, revalidate));
  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

export type MediaFetchStatus = "ok" | "empty" | "unreachable";

export type MediaFetchResult = {
  items: MediaItem[];
  status: MediaFetchStatus;
};

export async function getMediaItems(type: MediaType | "all" = "all", limit = 20): Promise<MediaItem[]> {
  const result = await getMediaItemsResult(type, limit);
  return result.items;
}

export async function getMediaItemsResult(
  type: MediaType | "all" = "all",
  limit = 20,
): Promise<MediaFetchResult> {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", String(limit));
  if (type !== "all") {
    searchParams.set("type", type);
  }

  try {
    const response = await fetchJson<MediaItemsResponse>(
      `/api/jellyfin/items?${searchParams.toString()}`,
      {},
      COLLECTION_REVALIDATE_SECONDS,
    );
    return {
      items: response.items,
      status: response.items.length > 0 ? "ok" : "empty",
    };
  } catch {
    return { items: [], status: "unreachable" };
  }
}

export const getMediaItem = cache(async (id: string): Promise<MediaItem | null> => {
  try {
    const item = await fetchJson<MediaItem>(
      `/api/jellyfin/items/${encodeURIComponent(id)}`,
      {},
      ITEM_REVALIDATE_SECONDS,
    );

    return {
      ...item,
      playbackUrl: item.playbackUrl ?? `/api/jellyfin/play/${encodeURIComponent(id)}`,
    };
  } catch {
    return null;
  }
});

export const getSeriesEpisodes = cache(async (seriesId: string): Promise<MediaItem[]> => {
  try {
    const response = await fetchJson<SeriesEpisodesResponse>(
      `/api/jellyfin/series/${encodeURIComponent(seriesId)}/episodes`,
      {},
      ITEM_REVALIDATE_SECONDS,
    );
    return response.items;
  } catch {
    return [];
  }
});

export async function getMediaSections() {
  try {
    const response = await fetchJson<MediaSectionsResponse>(
      "/api/jellyfin/sections",
      {},
      COLLECTION_REVALIDATE_SECONDS,
    );
    return response.items;
  } catch {
    return [];
  }
}

export async function getBackendHealth(): Promise<BackendHealth> {
  try {
    const response = await fetch("/api/jellyfin/health", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as BackendHealth;
  } catch {
    return { connected: false };
  }
}

export async function pingBackend(): Promise<boolean> {
  try {
    const response = await fetch("/api/health", { cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

export async function searchMediaItems(query: string, limit = 30): Promise<MediaItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const searchParams = new URLSearchParams({ q: trimmed, limit: String(limit) });
    const response = await fetchJson<MediaItemsResponse>(`/api/jellyfin/search?${searchParams.toString()}`);
    return response.items;
  } catch {
    return [];
  }
}

export async function refreshLibrary(): Promise<{ ok: boolean }> {
  try {
    return await fetchJson<{ ok: boolean }>("/api/jellyfin/library/refresh", { method: "POST" });
  } catch {
    return { ok: false };
  }
}

export async function getContinueWatching(limit = 20): Promise<ContinueWatchingItem[]> {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 20;
  try {
    const response = await fetchJson<ContinueWatchingResponse>(
      `/api/jellyfin/continue-watching?limit=${safeLimit}`,
    );
    return response.items ?? [];
  } catch {
    return [];
  }
}

// ─── LAN upload (photos, movies, series) ──────────────────────────────────
//
// XHR is used (not fetch) so we get upload-progress events. The server
// streams each file straight to the Jellyfin-backed SSD with no temp file.

export type UploadOutcome =
  | {
      status: "ok";
      fieldName: string;
      originalName: string;
      savedAs: string;
      size: number;
      mediaType: string;
    }
  | { status: "rejected"; fieldName: string; originalName: string; reason: string }
  | { status: "error"; fieldName: string; originalName: string; reason: string };

export type UploadBatchResponse = {
  results: UploadOutcome[];
  summary: { total: number; ok: number };
  mediaType: string;
  jellyfinRefresh: "queued" | "skipped";
};

export type UploadProgress = {
  /** Aggregate bytes loaded across the whole request. */
  loaded: number;
  /** Total bytes the browser expects for the request. */
  total: number;
};

export class UploadCancelledError extends Error {
  constructor() {
    super("Upload cancelled");
    this.name = "UploadCancelledError";
  }
}

export type UploadController = {
  abort: () => void;
  promise: Promise<UploadBatchResponse>;
};

export function uploadFiles(
  mediaType: MediaUploadKind,
  files: File[],
  onProgress?: (progress: UploadProgress) => void,
): UploadController {
  const xhr = new XMLHttpRequest();
  const url = uploadPath(mediaType);

  const promise = new Promise<UploadBatchResponse>((resolve, reject) => {
    xhr.open("POST", url, true);
    // Don't set Content-Type — the browser sets the multipart boundary.

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress({ loaded: event.loaded, total: event.total });
    };

    xhr.onload = () => {
      // The server returns 499 when the client socket closed mid-upload.
      // Treat it the same as a local abort.
      if (xhr.status === 499) {
        reject(new UploadCancelledError());
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as UploadBatchResponse);
        } catch {
          reject(new Error("Backend returned an invalid upload response"));
        }
        return;
      }
      let message = `Upload failed (HTTP ${xhr.status})`;
      try {
        const body = JSON.parse(xhr.responseText) as { error?: string };
        if (body?.error) message = body.error;
      } catch {
        /* non-JSON response — fall back to the status-only message */
      }
      reject(new Error(message));
    };

    xhr.onerror = () => reject(new Error("Upload failed: network error"));
    xhr.onabort = () => reject(new UploadCancelledError());
    xhr.ontimeout = () => reject(new Error("Upload timed out"));

    const form = new FormData();
    files.forEach((file, index) => {
      // Stable per-file fieldname so the server's outcome array can be
      // matched back to the right entry even when several files share a
      // name. Pure metadata — the bytes are appended only once.
      const fieldName = `files[${index}]`;
      form.append(fieldName, file, file.name);
    });
    xhr.send(form);
  });

  return {
    abort: () => xhr.abort(),
    promise,
  };
}
