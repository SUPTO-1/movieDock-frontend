"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

type VolumeControlProps = {
  /** Current volume in [0, 1]. */
  volume: number;
  /** Whether the player is muted (independent of `volume`, since muted at
   *  full volume is a valid user state). */
  isMuted: boolean;
  /** Click handler for the speaker icon — toggles mute and restores prior
   *  volume, mirroring the player's `toggleMute` behaviour. */
  onToggleMute: () => void;
  /** Apply a new volume value in [0, 1]. The player is responsible for
   *  writing it to the `<video>` element, updating muted state if the value
   *  crosses zero, and tracking the last non-zero volume. */
  onVolumeChange: (value: number) => void;
};

/**
 * Mute button + vertical volume popover. Owns its hover open/close state and
 * drag-gesture listeners. The popover opens on hover/focus and closes after
 * a short delay when the pointer leaves the wrapper so dragging across the
 * gap between button and popover doesn't flicker it shut.
 */
export function VolumeControl({ volume, isMuted, onToggleMute, onVolumeChange }: VolumeControlProps) {
  const volumeTrackRef = useRef<HTMLDivElement | null>(null);
  const volumeContainerRef = useRef<HTMLDivElement | null>(null);
  const volumeDraggingRef = useRef(false);
  const [volumeActive, setVolumeActive] = useState(false);
  const [volumeMenuOpen, setVolumeMenuOpen] = useState(false);
  // Pointerleave fires whenever the cursor crosses the small gap between
  // the button and the popover, so we use a delayed close that is cancelled
  // when the pointer re-enters the wrapper. This makes hover-and-drag feel
  // like VLC instead of a flickering menu.
  const volumeCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openVolumeMenu = useCallback(() => {
    if (volumeCloseTimerRef.current) {
      clearTimeout(volumeCloseTimerRef.current);
      volumeCloseTimerRef.current = null;
    }
    setVolumeMenuOpen(true);
  }, []);

  const scheduleVolumeMenuClose = useCallback(() => {
    if (volumeDraggingRef.current) return;
    if (volumeCloseTimerRef.current) clearTimeout(volumeCloseTimerRef.current);
    volumeCloseTimerRef.current = setTimeout(() => {
      volumeCloseTimerRef.current = null;
      if (volumeDraggingRef.current) return;
      setVolumeMenuOpen(false);
    }, 200);
  }, []);

  useEffect(() => {
    return () => {
      if (volumeCloseTimerRef.current) clearTimeout(volumeCloseTimerRef.current);
    };
  }, []);

  const volumeFromClientY = useCallback((clientY: number): number | null => {
    const track = volumeTrackRef.current;
    if (!track) return null;
    const rect = track.getBoundingClientRect();
    const ratio = 1 - Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);
    return ratio;
  }, []);

  const startVolume = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      volumeDraggingRef.current = true;
      setVolumeActive(true);
      openVolumeMenu();
      const r = volumeFromClientY(event.clientY);
      if (r !== null) onVolumeChange(r);
    },
    [onVolumeChange, openVolumeMenu, volumeFromClientY],
  );

  // Window-level move/up listeners attached while a volume drag is active.
  useEffect(() => {
    if (!volumeActive) return;
    const handleMove = (event: PointerEvent) => {
      if (!volumeDraggingRef.current) return;
      const r = volumeFromClientY(event.clientY);
      if (r !== null) onVolumeChange(r);
    };
    const handleUp = () => {
      volumeDraggingRef.current = false;
      setVolumeActive(false);
      // If the pointer was released outside the wrapper, close the menu
      // on a short delay so the user can keep adjusting without flicker.
      const stillInside = volumeContainerRef.current?.matches(":hover") ?? false;
      if (!stillInside) scheduleVolumeMenuClose();
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [volumeActive, onVolumeChange, scheduleVolumeMenuClose, volumeFromClientY]);

  return (
    <div
      ref={volumeContainerRef}
      className="relative ml-1"
      onPointerEnter={openVolumeMenu}
      onPointerLeave={scheduleVolumeMenuClose}
      onFocusCapture={openVolumeMenu}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          scheduleVolumeMenuClose();
        }
      }}
    >
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
        title={isMuted || volume === 0 ? "Unmute (M)" : "Mute (M)"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </button>
      {(volumeMenuOpen || volumeActive) && (
        <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-2xl border border-white/15 bg-black/85 px-2 py-3 shadow-[0_12px_36px_rgba(0,0,0,0.55)] backdrop-blur">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-semibold tabular-nums text-white/80">
              {Math.round(volume * 100)}
            </span>
            <div
              ref={volumeTrackRef}
              data-player-slider="true"
              role="slider"
              tabIndex={0}
              aria-label="Volume"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(volume * 100)}
              onPointerDown={startVolume}
              onKeyDown={(event) => {
                switch (event.key) {
                  case "ArrowUp":
                    event.preventDefault();
                    onVolumeChange(volume + 0.05);
                    break;
                  case "ArrowDown":
                    event.preventDefault();
                    onVolumeChange(volume - 0.05);
                    break;
                  case "Home":
                    event.preventDefault();
                    onVolumeChange(0);
                    break;
                  case "End":
                    event.preventDefault();
                    onVolumeChange(1);
                    break;
                }
              }}
              className="relative h-24 w-2 cursor-pointer rounded-full bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <div
                className="absolute inset-x-0 bottom-0 rounded-full bg-gradient-to-t from-rose-500 to-rose-300"
                style={{ height: `${volume * 100}%` }}
              />
              <div
                className="pointer-events-none absolute left-1/2 h-3 w-3 -translate-x-1/2 translate-y-1/2 rounded-full bg-white shadow"
                style={{ bottom: `${volume * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}