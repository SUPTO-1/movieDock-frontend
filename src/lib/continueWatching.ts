"use client";

import type { ContinueWatchingItem, MediaItem } from "@/types/media";

const STORAGE_KEY = "moviedock-continue-watching";
const STORAGE_VERSION = 1;
const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
const NEARLY_COMPLETE_PERCENT = 99.5;
const TICKS_PER_SECOND = 10_000_000;
const DEFAULT_LIMIT = 20;

type StoredProgress = {
  media: Pick<MediaItem, "id" | "title" | "type" | "posterUrl" | "backdropUrl" | "year" | "duration" | "rating" | "genres" | "overview">;
  seriesName?: string;
  seriesId?: string;
  episode?: { id: string; seasonNumber?: number; episodeNumber?: number; title?: string };
  playbackPositionTicks: number;
  runtimeTicks?: number;
  progress: number;
  lastPlayedDate: string;
};

type StorageShape = {
  version: number;
  entries: Record<string, StoredProgress>;
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readAll(): StorageShape {
  if (!isBrowser()) return { version: STORAGE_VERSION, entries: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: STORAGE_VERSION, entries: {} };
    const parsed = JSON.parse(raw) as Partial<StorageShape>;
    if (parsed && typeof parsed === "object" && parsed.entries && typeof parsed.entries === "object") {
      return { version: STORAGE_VERSION, entries: parsed.entries };
    }
    return { version: STORAGE_VERSION, entries: {} };
  } catch {
    return { version: STORAGE_VERSION, entries: {} };
  }
}

function writeAll(value: StorageShape): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Quota errors etc. — silently skip; resume state lives on Jellyfin too.
  }
}

// Storage key. For episodes we collapse onto the parent series' id so all
// episodes of the same series share a single slot and only the latest-watched
// episode survives (overwriting the previous one). Movies/music/photos get
// their own slot keyed by id.
function makeKey(input: Pick<RecordProgressInput, "media" | "seriesId">): string {
  const seriesId = input.seriesId?.trim();
  if (seriesId) return `series:${seriesId}`;
  return `item:${input.media.id}`;
}

export type RecordProgressInput = {
  media: Pick<MediaItem, "id" | "title" | "type" | "posterUrl" | "backdropUrl" | "year" | "duration" | "rating" | "genres" | "overview">;
  seriesName?: string;
  seriesId?: string;
  episode?: { id: string; seasonNumber?: number; episodeNumber?: number; title?: string };
  playbackPositionTicks: number;
  runtimeTicks?: number;
  progress: number;
};

export function recordProgress(input: RecordProgressInput): void {
  if (!isBrowser()) return;
  if (typeof input.progress !== "number" || !Number.isFinite(input.progress)) return;
  const store = readAll();
  const key = makeKey(input);
  if (input.progress < 0 || input.progress >= NEARLY_COMPLETE_PERCENT) {
    if (store.entries[key]) {
      delete store.entries[key];
      writeAll(store);
      notifySubscribers();
    }
    return;
  }
  store.entries[key] = {
    media: input.media,
    seriesName: input.seriesName,
    seriesId: input.seriesId,
    episode: input.episode,
    playbackPositionTicks: Math.max(0, input.playbackPositionTicks),
    runtimeTicks: input.runtimeTicks,
    progress: input.progress,
    lastPlayedDate: new Date().toISOString(),
  };
  writeAll(store);
  notifySubscribers();
}

export function clearProgress(mediaId: string, seriesId?: string): void {
  if (!isBrowser()) return;
  const store = readAll();
  const key = seriesId ? `series:${seriesId}` : `item:${mediaId}`;
  if (!store.entries[key]) return;
  delete store.entries[key];
  writeAll(store);
  notifySubscribers();
}

function computeRemainingMinutes(runtimeTicks: number | undefined, positionTicks: number): number | undefined {
  if (typeof runtimeTicks !== "number" || runtimeTicks <= 0) return undefined;
  const remaining = Math.max(runtimeTicks - positionTicks, 0);
  return Math.ceil(remaining / TICKS_PER_SECOND / 60);
}

function buildSnapshot(limit: number): ContinueWatchingItem[] {
  const store = readAll();
  const now = Date.now();
  const cutoff = now - FIFTEEN_DAYS_MS;

  // Entries are already deduped at write-time (series episodes collapse onto
  // the parent series' slot), so iterate values directly.
  const eligible: ContinueWatchingItem[] = [];
  for (const entry of Object.values(store.entries)) {
    const playedAt = Date.parse(entry.lastPlayedDate);
    if (!Number.isFinite(playedAt) || playedAt < cutoff) continue;
    if (entry.progress <= 0 || entry.progress >= NEARLY_COMPLETE_PERCENT) continue;

    const fullMedia: MediaItem = {
      ...entry.media,
      progress: entry.progress,
      playbackPositionTicks: entry.playbackPositionTicks,
      lastPlayedDate: entry.lastPlayedDate,
      runtimeTicks: entry.runtimeTicks,
    };

    eligible.push({
      media: fullMedia,
      episode: entry.episode,
      progress: entry.progress,
      playbackPositionTicks: entry.playbackPositionTicks,
      lastPlayedDate: entry.lastPlayedDate,
      remainingMinutes: computeRemainingMinutes(entry.runtimeTicks, entry.playbackPositionTicks),
    });
  }

  eligible.sort((a, b) => {
    const aTime = a.lastPlayedDate ? Date.parse(a.lastPlayedDate) : 0;
    const bTime = b.lastPlayedDate ? Date.parse(b.lastPlayedDate) : 0;
    return bTime - aTime;
  });

  return eligible.slice(0, limit);
}

// Cached snapshot + signature so useSyncExternalStore gets a stable reference
// until the underlying data actually changes. This is the "result of getSnapshot
// should be cached" requirement.
let cachedSnapshot: ContinueWatchingItem[] = [];
let cachedSnapshotSig = "init";
let cachedSnapshotLimit: number | null = null;

function signatureOf(limit: number): string {
  if (!isBrowser()) return `srv:${limit}`;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? "";
    return `${raw.length}:${raw.length > 0 ? raw.slice(-32) : ""}:${limit}`;
  } catch {
    return `err:${limit}`;
  }
}

const EMPTY_LIST: ContinueWatchingItem[] = [];

// Exported so React components can pass a stable reference to
// `useSyncExternalStore` (e.g. `getServerSnapshot`). Returning a fresh `[]`
// each call triggers "The result of getServerSnapshot should be cached to
// avoid an infinite loop" and can also cause hydration mismatches when the
// server renders an empty row but the client has Continue Watching entries.
export const EMPTY_CONTINUE_WATCHING: ContinueWatchingItem[] = EMPTY_LIST;

export function getContinueWatchingSnapshot(limit: number = DEFAULT_LIMIT): ContinueWatchingItem[] {
  const sig = signatureOf(limit);
  if (cachedSnapshotSig === sig && cachedSnapshotLimit === limit && cachedSnapshot.length > 0) {
    return cachedSnapshot;
  }
  const next = buildSnapshot(limit);
  if (next.length === 0) {
    cachedSnapshot = EMPTY_LIST;
    cachedSnapshotSig = sig;
    cachedSnapshotLimit = limit;
    return cachedSnapshot;
  }
  cachedSnapshot = next;
  cachedSnapshotSig = sig;
  cachedSnapshotLimit = limit;
  return cachedSnapshot;
}

export function loadContinueWatching(limit = DEFAULT_LIMIT): ContinueWatchingItem[] {
  return getContinueWatchingSnapshot(limit);
}

// Subscription model for useSyncExternalStore — notifies React when storage changes
// (e.g. after MediaPlayer records progress, so the Continue Watching row updates
// when navigating back to home).
const subscribers = new Set<() => void>();
let storageListenerInstalled = false;

function ensureStorageListener() {
  if (storageListenerInstalled || !isBrowser()) return;
  window.addEventListener("storage", () => {
    invalidateSnapshot();
    subscribers.forEach((cb) => cb());
  });
  storageListenerInstalled = true;
}

function notifySubscribers() {
  if (!isBrowser()) return;
  invalidateSnapshot();
  subscribers.forEach((cb) => cb());
}

function invalidateSnapshot() {
  cachedSnapshot = EMPTY_LIST;
  cachedSnapshotSig = "";
}

export function subscribeToContinueWatching(callback: () => void): () => void {
  ensureStorageListener();
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}