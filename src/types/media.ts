export type MediaType = "movie" | "series" | "anime" | "music" | "photo";

export type MediaStream = {
  index: number;
  type: "Video" | "Audio" | "Subtitle";
  language?: string;
  displayLanguage?: string;
  codec?: string;
  channels?: number;
  bitRate?: number;
  isDefault?: boolean;
  isForced?: boolean;
  isExternal?: boolean;
  title?: string;
};

export type MediaItem = {
  id: string;
  title: string;
  type: MediaType;
  posterUrl: string;
  backdropUrl: string;
  year: number;
  /** Runtime in a human-readable format ("1h 42m") or "Unknown" when Jellyfin can't compute it. */
  duration: string;
  rating: string;
  genres: string[];
  overview: string;
  progress?: number;
  playbackPositionTicks?: number;
  lastPlayedDate?: string;
  isPlayed?: boolean;
  runtimeTicks?: number;
  resolution?: string;
  quality?: string;
  playbackUrl?: string;
  mediaStreams?: MediaStream[];
  cast?: Array<{
    id: string;
    name: string;
    role?: string;
    type?: string;
    imageUrl?: string;
  }>;
  seriesName?: string;
  seriesId?: string;
  seasonName?: string;
  status?: string;
  communityRating?: number;
  indexNumber?: number;
  parentIndexNumber?: number;
};

/**
 * Jellyfin reports `"Unknown"` when it can't determine a runtime (e.g. a live
 * channel or an item still being scanned). Use this guard before showing the
 * runtime so the UI doesn't render "• Unknown".
 */
export const hasKnownDuration = (item: Pick<MediaItem, "duration">): boolean =>
  Boolean(item.duration) && item.duration !== "Unknown";

export type ContinueWatchingEpisode = {
  id: string;
  seasonNumber?: number;
  episodeNumber?: number;
  title?: string;
};

export type ContinueWatchingItem = {
  media: MediaItem;
  episode?: ContinueWatchingEpisode;
  progress?: number;
  playbackPositionTicks?: number;
  lastPlayedDate?: string;
  remainingMinutes?: number;
};