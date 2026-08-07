import { cache } from "react";
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

async function fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${backendUrl}${path}`, { cache: "no-store", ...init });

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function getMediaItems(type: MediaType | "all" = "all", limit = 20): Promise<MediaItem[]> {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", String(limit));
  if (type !== "all") {
    searchParams.set("type", type);
  }

  try {
    const response = await fetchJson<MediaItemsResponse>(`/api/jellyfin/items?${searchParams.toString()}`);
    return response.items;
  } catch {
    return [];
  }
}

export const getMediaItem = cache(async (id: string): Promise<MediaItem | null> => {
  try {
    const item = await fetchJson<MediaItem>(`/api/jellyfin/items/${encodeURIComponent(id)}`);

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
    const response = await fetchJson<SeriesEpisodesResponse>(`/api/jellyfin/series/${encodeURIComponent(seriesId)}/episodes`);
    return response.items;
  } catch {
    return [];
  }
});

export async function getMediaSections() {
  try {
    const response = await fetchJson<MediaSectionsResponse>("/api/jellyfin/sections");
    return response.items;
  } catch {
    return [];
  }
}

export async function getBackendHealth(): Promise<BackendHealth> {
  try {
    const response = await fetchJson<BackendHealth>("/api/jellyfin/health");
    return response;
  } catch {
    return { connected: false };
  }
}

export async function pingBackend(): Promise<boolean> {
  try {
    // Use a same-origin path so Next.js rewrites proxy it to the backend —
    // avoids CORS blocking the lightweight health check from the browser.
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
