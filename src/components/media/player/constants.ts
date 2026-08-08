// Player-wide constants and pure helpers shared across the MediaPlayer
// sub-components and hooks. Kept dependency-free so any module can import
// without dragging in React.

export { formatHMS } from "@/lib/utils";

/** Jellyfin's playback API measures time in 100-nanosecond ticks. */
export const TICKS_PER_SECOND = 10_000_000;

/** How long the controls overlay stays visible after the last input while
 *  in fullscreen before auto-hiding. */
export const AUTO_HIDE_MS = 3_000;

/** Discrete speeds the playback-rate cycle button steps through. */
export const PLAYBACK_RATES = [0.5, 1, 1.25, 1.5, 1.75, 2];

/** When progress exceeds this percentage we treat the item as "done" and
 *  stop writing to Continue Watching so completed items can leave the row. */
export const NEARLY_COMPLETE_PERCENT = 99.5;

export function ticksToSeconds(ticks: number) {
  return Math.max(0, ticks / TICKS_PER_SECOND);
}

export function secondsToTicks(seconds: number) {
  return Math.max(0, Math.round(seconds * TICKS_PER_SECOND));
}