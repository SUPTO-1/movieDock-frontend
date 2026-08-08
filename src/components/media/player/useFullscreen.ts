"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

type UseFullscreenOptions = {
  /** The element that should enter fullscreen when `enterFullscreenIfEnabled`
   *  or `toggleFullscreen` is called. Typically the player's shell `<div>`. */
  shellRef: RefObject<HTMLElement | null>;
  /** The `<video>` element. Used to detect when the browser puts the video
   *  itself into fullscreen (e.g. via the native controls) so we can escape
   *  that and re-enter on the shell, keeping the custom controls overlay
   *  interactive. */
  videoRef: RefObject<HTMLVideoElement | null>;
  /** When true, `enterFullscreenIfEnabled` will request fullscreen instead
   *  of being a no-op. Used by callers that want every click outside
   *  fullscreen to enter fullscreen (e.g. the watch page). */
  enabled: boolean;
};

type UseFullscreenReturn = {
  /** True while the browser reports `document.fullscreenElement` is set. */
  isFullscreen: boolean;
  /** Synchronous ref mirror of `isFullscreen` for use inside event handlers
   *  and effects that need the latest value without re-binding listeners. */
  isFullscreenRef: React.MutableRefObject<boolean>;
  /** Toggle fullscreen on `shellRef.current` — requests or exits depending
   *  on current state. Swallows browser-denied errors silently. */
  toggleFullscreen: () => Promise<void>;
  /** Enter fullscreen if `enabled` and not already fullscreen. Returns true
   *  when a request was initiated so callers can short-circuit the rest of
   *  their click handler. */
  enterFullscreenIfEnabled: () => boolean;
};

/**
 * Owns the player's fullscreen state. Tracks `document.fullscreenElement`
 * changes and exposes two entry points: an explicit toggle (used by the
 * `f` keyboard shortcut and the fullscreen button) and a one-shot "enter
 * fullscreen now if configured to do so" used by click handlers on the
 * video/shell when outside fullscreen.
 *
 * If the browser puts the `<video>` itself into fullscreen (e.g. via its
 * native controls), this hook escapes that and re-enters on the shell so
 * the custom controls overlay remains interactive.
 */
export function useFullscreen({ shellRef, videoRef, enabled }: UseFullscreenOptions): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isFullscreenRef = useRef(false);

  useEffect(() => {
    const onChange = () => {
      const target = document.fullscreenElement;
      if (target && target === videoRef.current && shellRef.current) {
        void document.exitFullscreen()
          .then(() => shellRef.current?.requestFullscreen())
          .catch(() => {});
        return;
      }
      const next = Boolean(target);
      isFullscreenRef.current = next;
      setIsFullscreen(next);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [shellRef, videoRef]);

  const toggleFullscreen = useCallback(async () => {
    const shell = shellRef.current;
    if (!shell) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await shell.requestFullscreen();
      }
    } catch {
      // Browser denied fullscreen — silently ignore.
    }
  }, [shellRef]);

  const enterFullscreenIfEnabled = useCallback(() => {
    if (!enabled) return false;
    if (document.fullscreenElement) return false;
    const shell = shellRef.current;
    if (!shell) return false;
    shell.requestFullscreen().catch(() => {
      // Browser blocked — fall back to normal click-to-toggle behavior.
    });
    return true;
  }, [enabled, shellRef]);

  return { isFullscreen, isFullscreenRef, toggleFullscreen, enterFullscreenIfEnabled };
}