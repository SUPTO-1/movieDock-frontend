"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AUTO_HIDE_MS } from "@/components/media/player/constants";

/**
 * Auto-hide the player's fullscreen controls after `AUTO_HIDE_MS` of idle
 * input. Outside fullscreen the controls stay visible — the hook just keeps
 * the timer cleared and lets the caller render the controls unconditionally.
 *
 * The `isFullscreen` flag is read via a ref so `wakeControls` stays referentially
 * stable across renders. Otherwise the wake effect would tear down and rebuild
 * its DOM listeners on every fullscreen toggle, which can drop the listener
 * mid-interaction and leave the controls stuck hidden.
 *
 * @returns `[controlsVisible, wakeControls]` — visibility state and the
 *   callback to invoke on any user input that should reset the idle timer.
 */
export function useAutoHideControls(isFullscreen: boolean) {
  const isFullscreenRef = useRef(isFullscreen);
  // Mirror the latest `isFullscreen` value into a ref so the wake callback
  // (and any other effect that needs the live value without re-binding
  // listeners on every toggle) can read it synchronously. Updated in an
  // effect rather than during render so we don't trip React Compiler's
  // "refs cannot be touched during render" lint rule.
  useEffect(() => {
    isFullscreenRef.current = isFullscreen;
  }, [isFullscreen]);

  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);

  const wakeControls = useCallback(() => {
    if (!isFullscreenRef.current) return;
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, AUTO_HIDE_MS);
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      // Outside fullscreen the controls stay visible; just clear any
      // pending hide timer and make sure they're shown without re-rendering.
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = null;
      }
      // `controlsVisible` defaults to true on mount and stays true outside
      // fullscreen, so no setState is needed here.
      return;
    }
    // Schedule the initial visibility set on a microtask so this effect body
    // doesn't synchronously call setState (which would trigger a cascading
    // render warning under the new React Compiler rules).
    queueMicrotask(wakeControls);
    // Listen on the document so that mouse movement anywhere — including
    // over the invisible (opacity-0) controls area or slightly outside the
    // shell bounds — still wakes the overlay. Attaching to the shell alone
    // is unreliable once the controls fade out: when the inner row has
    // `pointer-events-none` and the outer wrapper is `opacity-0`, browsers
    // may not deliver `mousemove` to the shell on every cursor nudge, which
    // is what caused the "controls never come back" symptom.
    document.addEventListener("mousemove", wakeControls);
    document.addEventListener("mousedown", wakeControls);
    document.addEventListener("touchstart", wakeControls);
    return () => {
      document.removeEventListener("mousemove", wakeControls);
      document.removeEventListener("mousedown", wakeControls);
      document.removeEventListener("touchstart", wakeControls);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [isFullscreen, wakeControls]);

  return [controlsVisible, wakeControls] as const;
}