export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format a duration in seconds as `H:MM:SS` for >=1h, or `MM:SS` otherwise.
 * Used by the video player time display. Negative or non-finite inputs
 * collapse to `0:00`.
 */
export function formatHMS(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const mm = String(minutes).padStart(hours > 0 ? 2 : 1, "0");
  const ss = String(secs).padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export function episodeLabel(episode: { parentIndexNumber?: number; indexNumber?: number }): string {
  const season = episode.parentIndexNumber;
  const number = episode.indexNumber;
  if (season !== undefined && number !== undefined) {
    return `S${String(season).padStart(2, "0")}E${String(number).padStart(2, "0")}`;
  }
  if (number !== undefined) return `E${String(number).padStart(2, "0")}`;
  return "Episode";
}
