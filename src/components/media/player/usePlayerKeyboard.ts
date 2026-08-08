"use client";

import { useEffect } from "react";

type UsePlayerKeyboardOptions = {
  volume: number;
  duration: number;
  applyVolume: (value: number, alsoSetMuted: boolean) => void;
  togglePlay: () => void;
  wakeControls: () => void;
  toggleFullscreen: () => Promise<void>;
  toggleMute: () => void;
  toggleTheaterMode: () => void;
  cyclePlaybackRate: () => void;
  seekBy: (deltaSeconds: number) => void;
  seekTo: (targetSeconds: number) => void;
};

/**
 * Global keyboard shortcuts for the player. Always active while the player
 * is mounted — including fullscreen and when a TV remote sends a key — so
 * short-circuits only when focus is on a text input or a slider element
 * owned by the player.
 *
 * Mapping (mirrors the legacy inline handler so behaviour is identical):
 *   ←/→           seek ±5s (Shift = ±30s)
 *   ↑/↓           volume ±5%
 *   Space          play / pause
 *   f              toggle fullscreen
 *   m              toggle mute
 *   t              toggle theater mode
 *   p              cycle playback rate
 *   Home, 0        seek to 0
 *   End            seek to end
 *   PageUp/Down    seek ±60s
 */
export function usePlayerKeyboard({
  volume,
  duration,
  applyVolume,
  togglePlay,
  wakeControls,
  toggleFullscreen,
  toggleMute,
  toggleTheaterMode,
  cyclePlaybackRate,
  seekBy,
  seekTo,
}: UsePlayerKeyboardOptions) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      // Slider-focus short-circuits the global shortcuts.
      const onSlider = target?.getAttribute?.("data-player-slider") === "true";

      switch (event.key) {
        case "ArrowLeft":
          if (onSlider) return;
          event.preventDefault();
          seekBy(event.shiftKey ? -30 : -5);
          wakeControls();
          break;
        case "ArrowRight":
          if (onSlider) return;
          event.preventDefault();
          seekBy(event.shiftKey ? 30 : 5);
          wakeControls();
          break;
        case "ArrowUp":
          if (event.altKey || event.ctrlKey || event.metaKey) return;
          event.preventDefault();
          applyVolume(volume + 0.05, true);
          break;
        case "ArrowDown":
          if (event.altKey || event.ctrlKey || event.metaKey) return;
          event.preventDefault();
          applyVolume(volume - 0.05, true);
          break;
        case " ":
        case "Space":
          event.preventDefault();
          togglePlay();
          wakeControls();
          break;
        case "f":
        case "F":
          event.preventDefault();
          void toggleFullscreen();
          break;
        case "m":
        case "M":
          event.preventDefault();
          toggleMute();
          break;
        case "t":
        case "T":
          event.preventDefault();
          toggleTheaterMode();
          break;
        case "p":
        case "P":
          event.preventDefault();
          cyclePlaybackRate();
          break;
        case "Home":
          event.preventDefault();
          seekTo(0);
          break;
        case "End":
          event.preventDefault();
          seekTo(Number.isFinite(duration) ? duration : 0);
          break;
        case "PageUp":
          event.preventDefault();
          seekBy(60);
          break;
        case "PageDown":
          event.preventDefault();
          seekBy(-60);
          break;
        case "0":
          event.preventDefault();
          seekTo(0);
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    applyVolume,
    cyclePlaybackRate,
    duration,
    seekBy,
    seekTo,
    toggleFullscreen,
    toggleMute,
    togglePlay,
    toggleTheaterMode,
    volume,
    wakeControls,
  ]);
}