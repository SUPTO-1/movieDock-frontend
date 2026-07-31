import type { MediaItem, MediaType } from "@/types/media";

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

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${backendUrl}${path}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function getMediaItems(type: MediaType | "all" = "all", limit = 20) {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", String(limit));
  if (type !== "all") {
    searchParams.set("type", type);
  }

  const response = await fetchJson<MediaItemsResponse>(`/api/jellyfin/items?${searchParams.toString()}`);
  return response.items;
}

export async function getMediaItem(id: string) {
  return fetchJson<MediaItem>(`/api/jellyfin/items/${encodeURIComponent(id)}`);
}

export async function getMediaSections() {
  const response = await fetchJson<MediaSectionsResponse>("/api/jellyfin/sections");
  return response.items;
}
