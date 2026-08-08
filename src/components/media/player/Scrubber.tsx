"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatHMS } from "@/components/media/player/constants";

type ScrubberProps = {
  currentTime: number;
  duration: number;
  bufferedEnd: number;
  /** Seek to an absolute position in seconds (clamped to [0, duration]). */
  onSeek: (seconds: number) => void;
  /** Adjust the playhead by a relative number of seconds. */
  onSeekBy: (deltaSeconds: number) => void;
};

/**
 * Custom seek slider with three stacked bars (track / buffered / played), a
 * hover preview tooltip, and a thumb that lights up while dragging or
 * hovering. Owns its own pointer state and attaches window-level
 * pointermove/pointerup listeners only while a drag is in flight.
 */
export function Scrubber({ currentTime, duration, bufferedEnd, onSeek, onSeekBy }: ScrubberProps) {
  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const scrubDraggingRef = useRef(false);
  const [scrubberActive, setScrubberActive] = useState(false);
  const [scrubPreviewTime, setScrubPreviewTime] = useState<number | null>(null);

  const timeFromClientX = useCallback(
    (clientX: number): number | null => {
      const scrubber = scrubberRef.current;
      if (!scrubber || !Number.isFinite(duration) || duration <= 0) return null;
      const rect = scrubber.getBoundingClientRect();
      const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      return ratio * duration;
    },
    [duration],
  );

  const startScrub = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!Number.isFinite(duration) || duration <= 0) return;
      event.preventDefault();
      scrubDraggingRef.current = true;
      setScrubberActive(true);
      const t = timeFromClientX(event.clientX);
      if (t !== null) setScrubPreviewTime(t);
    },
    [duration, timeFromClientX],
  );

  // Window-level move/up listeners attached while a scrub is in progress.
  // Activated by `scrubberActive` so the listeners only exist when needed.
  useEffect(() => {
    if (!scrubberActive) return;
    const handleMove = (event: PointerEvent) => {
      if (!scrubDraggingRef.current) return;
      const t = timeFromClientX(event.clientX);
      if (t !== null) setScrubPreviewTime(t);
    };
    const handleUp = (event: PointerEvent) => {
      if (!scrubDraggingRef.current) return;
      const t = timeFromClientX(event.clientX);
      if (t !== null) onSeek(t);
      scrubDraggingRef.current = false;
      setScrubberActive(false);
      setScrubPreviewTime(null);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [scrubberActive, onSeek, timeFromClientX]);

  const previewScrub = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (scrubDraggingRef.current) return;
      const t = timeFromClientX(event.clientX);
      setScrubPreviewTime(t);
    },
    [timeFromClientX],
  );

  const endScrubPreview = useCallback(() => {
    if (!scrubDraggingRef.current) setScrubPreviewTime(null);
  }, []);

  const onSliderKey = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!Number.isFinite(duration) || duration <= 0) return;
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          onSeekBy(event.shiftKey ? -30 : -5);
          break;
        case "ArrowRight":
          event.preventDefault();
          onSeekBy(event.shiftKey ? 30 : 5);
          break;
        case "Home":
          event.preventDefault();
          onSeek(0);
          break;
        case "End":
          event.preventDefault();
          onSeek(duration);
          break;
        case "PageUp":
          event.preventDefault();
          onSeekBy(60);
          break;
        case "PageDown":
          event.preventDefault();
          onSeekBy(-60);
          break;
      }
    },
    [duration, onSeek, onSeekBy],
  );

  const progressPct =
    Number.isFinite(duration) && duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
  const bufferedPct =
    Number.isFinite(duration) && duration > 0 ? Math.min((bufferedEnd / duration) * 100, 100) : 0;
  const scrubPreviewPct =
    scrubPreviewTime !== null && Number.isFinite(duration) && duration > 0
      ? Math.min((scrubPreviewTime / duration) * 100, 100)
      : null;

  return (
    <div
      ref={scrubberRef}
      data-player-slider="true"
      tabIndex={0}
      role="slider"
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Number.isFinite(duration) ? Math.max(0, Math.round(duration)) : 0}
      aria-valuenow={Math.round(currentTime)}
      aria-valuetext={`${formatHMS(currentTime)} of ${formatHMS(duration)}`}
      onPointerDown={startScrub}
      onPointerMove={previewScrub}
      onPointerLeave={endScrubPreview}
      onKeyDown={onSliderKey}
      className="group relative h-6 cursor-pointer touch-none select-none focus-visible:outline-none"
    >
      {/* Track */}
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/20" />
      {/* Buffered */}
      <div
        className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/35"
        style={{ width: `${bufferedPct}%` }}
      />
      {/* Played */}
      <div
        className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-rose-500 to-rose-300"
        style={{ width: `${progressPct}%` }}
      />
      {/* Hover preview */}
      {scrubPreviewPct !== null ? (
        <div
          className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${scrubPreviewPct}%` }}
        >
          <div className="h-3 w-[3px] -translate-y-1/2 rounded-full bg-white/80" />
          <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 rounded-md border border-white/15 bg-black/85 px-2 py-1 text-[10px] font-semibold tabular-nums text-white shadow-lg">
            {formatHMS(scrubPreviewTime ?? 0)}
          </div>
        </div>
      ) : null}
      {/* Thumb */}
      <div
        className={`pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.45)] transition-[opacity,transform] duration-150 ${
          scrubberActive || scrubPreviewTime !== null
            ? "scale-110 opacity-100"
            : "scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100"
        }`}
        style={{ left: `${progressPct}%`, width: "14px", height: "14px" }}
      />
    </div>
  );
}