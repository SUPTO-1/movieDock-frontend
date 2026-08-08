"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronFirst,
  ChevronLast,
  Gauge,
  Loader2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RefreshCw,
  Tv2,
} from "lucide-react";
import type { MediaItem } from "@/types/media";
import { playbackPath, watchPath } from "@/lib/routes";
import { episodeLabel } from "@/lib/utils";
import { recordProgress } from "@/lib/continueWatching";
import {
  NEARLY_COMPLETE_PERCENT,
  PLAYBACK_RATES,
  formatHMS,
  secondsToTicks,
  ticksToSeconds,
} from "@/components/media/player/constants";
import { Scrubber } from "@/components/media/player/Scrubber";
import { VolumeControl } from "@/components/media/player/VolumeControl";
import { TrackMenuGroup } from "@/components/media/player/TrackMenus";
import { useAutoHideControls } from "@/components/media/player/useAutoHideControls";
import { useFullscreen } from "@/components/media/player/useFullscreen";
import { usePlayerKeyboard } from "@/components/media/player/usePlayerKeyboard";

type MediaPlayerProps = {
  itemId: string;
  item: MediaItem;
  /**
   * When playing an episode inside a series, the parent series' poster and
   * backdrop. The Continue Watching card uses these so episodes share the
   * series' artwork rather than the per-episode still.
   */
  parentSeriesArtwork?: { posterUrl: string; backdropUrl: string };
  parentSeriesId?: string;
  parentSeriesTitle?: string;
  /**
   * Sibling episodes so the fullscreen overlay can show prev/next shortcuts
   * with S##E## labels.
   */
  prevEpisode?: MediaItem | null;
  nextEpisode?: MediaItem | null;
  /**
   * When true, every click on the video (or empty shell area) while NOT in
   * fullscreen enters browser fullscreen. Once inside fullscreen, clicks
   * toggle play/pause and briefly show the controls overlay. The user exits
   * via ESC, the `f` shortcut, or the fullscreen toggle button — all of which
   * just exit fullscreen and leave the user on the underlying watch page, so
   * they can click the video again to re-enter fullscreen.
   */
  fullscreenOnFirstClick?: boolean;
  /**
   * Reserved for future use; currently no in-player control triggers it
   * because the watch page now exposes its own Back button above the
   * player. Kept on the prop signature to avoid breaking callers.
   */
  onExitFullscreen?: () => void;
  playbackUrl: string;
  resumePositionTicks?: number;
  autoPlay?: boolean;
};

export type MediaPlayerHandle = {
  play: () => Promise<void> | void;
};

export const MediaPlayer = forwardRef<MediaPlayerHandle, MediaPlayerProps>(function MediaPlayer(
  {
    itemId,
    item,
    parentSeriesArtwork,
    parentSeriesId,
    parentSeriesTitle,
    prevEpisode,
    nextEpisode,
    fullscreenOnFirstClick = false,
    onExitFullscreen,
    playbackUrl,
    resumePositionTicks = 0,
    autoPlay = false,
  },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const seekedRef = useRef(false);
  const startedRef = useRef(false);
  const lastProgressSentRef = useRef(0);
  // Separate gate for the localStorage mirror — the Jellyfin POST already
  // throttles at 5s, but `timeupdate` still fires ~60×/s during playback,
  // so without this every event would re-parse and re-write the entire
  // Continue Watching JSON blob.
  const lastLocalStorageSentRef = useRef(0);
  const currentTimeRef = useRef(0);
  // Synchronous mirror of `isSwitchingTrack` so event handlers attached
  // before the state update flushes can read it without re-creating the
  // effect just to subscribe to the new value.
  const isSwitchingTrackRef = useRef(false);
  // Capture of `!video.paused` at the moment a track switch was requested,
  // so that after the new <source> loads we can decide whether to resume
  // playback (only if the user was watching, not if they had paused).
  const wasPlayingBeforeSwapRef = useRef(false);
  const lastVolumeRef = useRef(1);
  const loadedSourceKeyRef = useRef<string | null>(null);
  // Mirrors of audio/subtitle index so the mount effect (which only re-runs
  // on itemId/retry changes) can send the latest values to Jellyfin without
  // re-binding its event listeners on every track switch.
  const audioIndexRef = useRef<number | undefined>(undefined);
  const subtitleIndexRef = useRef<number | undefined>(undefined);
  // Timer scheduled by `handleStalled` to surface a "stream stalled" error
  // if the video doesn't make progress within 8s. Tracked so it can be
  // cancelled on unmount or when a subsequent event supersedes it.
  const stalledTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bufferedEndRef = useRef(0);

  const streams = useMemo(() => item.mediaStreams ?? [], [item.mediaStreams]);
  const defaultAudio = useMemo(
    () =>
      streams.find((s) => s.type === "Audio" && s.isDefault) ??
      streams.find((s) => s.type === "Audio"),
    [streams],
  );
  const defaultSubtitle = useMemo(
    () =>
      streams.find((s) => s.type === "Subtitle" && s.isDefault) ??
      streams.find((s) => s.type === "Subtitle" && s.isForced),
    [streams],
  );

  const [audioIndex, setAudioIndex] = useState<number | undefined>(defaultAudio?.index);
  const [subtitleIndex, setSubtitleIndex] = useState<number | undefined>(defaultSubtitle?.index);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [isSwitchingTrack, setIsSwitchingTrack] = useState(false);

  const [isPaused, setIsPaused] = useState(!autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [theaterMode, setTheaterMode] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);

  const audioStreams = useMemo(() => streams.filter((s) => s.type === "Audio"), [streams]);
  const subtitleStreams = useMemo(
    () => streams.filter((s) => s.type === "Subtitle"),
    [streams],
  );

  // Note: episode swaps remount this component entirely because the parent
  // passes `key={item.id}` — see WatchView. So `defaultAudio?.index` etc. are
  // picked up fresh on mount via the useState initializers above, and no
  // sync effect is required.

  // Auto-retry the stream when loadError is set. Counts down 5 seconds,
  // then bumps retryToken to force the video to reload without a refresh.
  // The countdown state is only rendered inside the loadError overlay, so
  // we don't need to reset it when loadError clears — the next session
  // overwrites it. Initial countdown is set via queueMicrotask to avoid the
  // cascading-render warning from React Compiler's set-state-in-effect rule.
  //
  // NOTE: This effect and the next two (the Jellyfin mount effect and the
  // imperative src-swap effect) are intentionally kept inline rather than
  // extracted into a hook. They share ~12 mutable refs and 6 state setters
  // and would require a 30-parameter ref-bag to extract — splitting would
  // hide more than it reveals.
  useEffect(() => {
    if (!loadError) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setRetryCountdown(5);
    });
    const interval = setInterval(() => {
      if (cancelled) return;
      setRetryCountdown((value) => {
        if (value === null) return null;
        if (value <= 1) {
          clearInterval(interval);
          setRetryToken((token) => token + 1);
          setLoadError(null);
          return null;
        }
        return value - 1;
      });
    }, 1_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [loadError]);

  const manualRetry = useCallback(() => {
    setLoadError(null);
    setRetryToken((token) => token + 1);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        videoRef.current?.play().catch(() => {
          // Autoplay may be blocked; user can click play.
        });
      },
    }),
    [],
  );

  // Mount the <video> element effect: wires up Jellyfin progress reporting,
  // track switching, and the loading / error handlers. Re-runs when the
  // episode changes (`itemId`) or on manual retry — but NOT on track
  // switches, which now happen via imperative src swap below.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const resumeSeconds = ticksToSeconds(resumePositionTicks);
    seekedRef.current = false;
    startedRef.current = false;
    lastProgressSentRef.current = 0;
    lastLocalStorageSentRef.current = 0;

    const applyResumePosition = () => {
      if (seekedRef.current) return;
      const preserved = currentTimeRef.current;
      if (preserved > 0 && Number.isFinite(video.duration) && video.duration > preserved + 1) {
        video.currentTime = preserved;
      } else if (
        resumeSeconds > 0 &&
        Number.isFinite(video.duration) &&
        video.duration > resumeSeconds
      ) {
        video.currentTime = resumeSeconds;
      }
      seekedRef.current = true;
      isSwitchingTrackRef.current = false;
      setIsSwitchingTrack(false);
    };

    const sendPlaybackState = async (
      path: string,
      positionTicks: number,
      isPaused: boolean,
    ) => {
      await fetch(`/api/jellyfin/playback/${encodeURIComponent(itemId)}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          positionTicks,
          isPaused,
          audioStreamIndex: audioIndexRef.current,
          subtitleStreamIndex: subtitleIndexRef.current,
        }),
      });
    };

    const startPlayback = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const positionTicks = secondsToTicks(video.currentTime || resumeSeconds);
      void sendPlaybackState("start", positionTicks, false);
      lastProgressSentRef.current = positionTicks;
    };

    const reportProgress = () => {
      currentTimeRef.current = video.currentTime;
      const positionTicks = secondsToTicks(video.currentTime);
      if (Math.abs(positionTicks - lastProgressSentRef.current) < 10_000_000 * 5) return;
      lastProgressSentRef.current = positionTicks;
      void sendPlaybackState("progress", positionTicks, video.paused);

      // Mirror to localStorage so Continue Watching works even when Jellyfin's
      // UserData isn't returned to us (e.g. API key isn't bound to the watching user).
      // Throttled separately at a longer interval because the JSON read/write
      // is more expensive than the Jellyfin POST, and timeupdate fires too often.
      if (Math.abs(positionTicks - lastLocalStorageSentRef.current) < 10_000_000 * 10) return;
      lastLocalStorageSentRef.current = positionTicks;
      const runtimeSeconds = Number.isFinite(video.duration) ? video.duration : undefined;
      const runtimeTicks = runtimeSeconds !== undefined ? secondsToTicks(runtimeSeconds) : undefined;
      const progress = runtimeSeconds !== undefined && runtimeSeconds > 0
        ? Math.min(100, Math.max(0, (video.currentTime / runtimeSeconds) * 100))
        : 0;
      if (progress > 0 && progress < NEARLY_COMPLETE_PERCENT) {
        // For episodes, collapse onto the parent series so the Continue Watching
        // card shows the series poster and only one entry per series survives.
        const isEpisode = item.parentIndexNumber !== undefined || item.indexNumber !== undefined;
        const isSeriesEntry = Boolean(parentSeriesId) && Boolean(parentSeriesTitle);
        recordProgress({
          media: {
            id: isSeriesEntry ? (parentSeriesId as string) : item.id,
            title: isSeriesEntry ? (parentSeriesTitle as string) : item.title,
            type: item.type,
            posterUrl: parentSeriesArtwork?.posterUrl ?? item.posterUrl,
            backdropUrl: parentSeriesArtwork?.backdropUrl ?? item.backdropUrl,
            year: item.year,
            duration: item.duration,
            rating: item.rating,
            genres: item.genres,
            overview: item.overview,
          },
          seriesId: isEpisode ? parentSeriesId : undefined,
          seriesName: isEpisode ? parentSeriesTitle : undefined,
          episode: isEpisode
            ? {
                id: item.id,
                seasonNumber: item.parentIndexNumber,
                episodeNumber: item.indexNumber,
                title: item.title,
              }
            : undefined,
          playbackPositionTicks: positionTicks,
          runtimeTicks,
          progress,
        });
      }
    };

    const stopPlayback = () => {
      const positionTicks = secondsToTicks(video.currentTime);
      void sendPlaybackState("stop", positionTicks, true);
    };

    const updateBuffered = () => {
      const ranges = video.buffered;
      if (ranges.length === 0) {
        if (bufferedEndRef.current !== 0) {
          bufferedEndRef.current = 0;
          setBufferedEnd(0);
        }
        return;
      }
      const end = ranges.end(ranges.length - 1);
      if (Number.isFinite(end) && Math.abs(end - bufferedEndRef.current) > 0.5) {
        bufferedEndRef.current = end;
        setBufferedEnd(end);
      }
    };

    const handleLoadedMetadata = () => {
      setLoadError(null);
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      updateBuffered();
      // Capture this before applyResumePosition clears the switching flag.
      const wasSwitching = isSwitchingTrackRef.current;
      applyResumePosition();
      // Resume playback only if the video was playing BEFORE the source
      // swap (i.e. autoPlay mount, or the user was watching). If the user
      // manually paused before picking a different track, stay paused.
      const wasPlayingBeforeSwap = wasSwitching
        ? wasPlayingBeforeSwapRef.current
        : autoPlay;
      if (wasPlayingBeforeSwap) {
        video.play().catch(() => {});
      }
    };
    const handlePlay = () => startPlayback();
    const handlePause = () => reportProgress();
    const handleTimeUpdate = () => {
      reportProgress();
      // During a track switch the new <source> starts at 0 and reports
      // bogus timeupdate events before the seek restores the saved position.
      // Keep the displayed time frozen at the saved value so the UI doesn't
      // flash 0:00 → real position.
      if (isSwitchingTrackRef.current) return;
      setCurrentTime(video.currentTime);
    };
    const handleDurationChange = () => {
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
    };
    const handleProgress = () => updateBuffered();
    const clearSwitchingOverlay = () => {
      // Defensive cleanup: only flip the flag if a switch was actually in
      // flight, so we don't churn React state on every normal event.
      if (!isSwitchingTrackRef.current) return;
      isSwitchingTrackRef.current = false;
      setIsSwitchingTrack(false);
    };
    const handleSeeked = () => {
      currentTimeRef.current = video.currentTime;
      setCurrentTime(video.currentTime);
      clearSwitchingOverlay();
    };
    // Some Jellyfin-served MP4s (especially remuxed multi-audio MKV sources)
    // don't honour Range requests, so the browser can't seek to the saved
    // position after a track switch. When that happens `seeked` never fires
    // and the "Switching track…" overlay would stay up forever even though
    // playback is actually working. Use `canplay` / `playing` as fallback
    // signals that the new stream is playable, and a hard timeout as a last
    // resort so the UI never gets stuck.
    const handleCanPlay = () => clearSwitchingOverlay();
    const handlePlaying = () => clearSwitchingOverlay();
    const handleEnded = () => stopPlayback();
    const handleBeforeUnload = () => stopPlayback();
    const handleError = () => {
      const code = video.error?.code;
      const message = video.error?.message;
      setLoadError(
        `Playback error (${code ?? "unknown"}): ${message ?? "Stream unavailable"}`,
      );
      clearSwitchingOverlay();
    };
    const handleStalled = () => {
      if (stalledTimerRef.current) clearTimeout(stalledTimerRef.current);
      stalledTimerRef.current = setTimeout(() => {
        stalledTimerRef.current = null;
        if (video.readyState < 2 && !video.error) {
          // Don't clobber a more specific error (e.g. from handleError) that
          // may have been set in the meantime.
          setLoadError((prev) => prev ?? "Stream stalled — Jellyfin is not responding. Retrying…");
        }
      }, 8_000);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("progress", handleProgress);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);
    video.addEventListener("stalled", handleStalled);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Final safety net: if none of `seeked` / `canplay` / `playing` fire
    // within 12s after a track swap (e.g. the Jellyfin stream is broken in
    // a way that never reaches HAVE_FUTURE_DATA), drop the overlay so the
    // user can at least see what's happening. Playback errors still surface
    // via the `error` handler — this is purely a UI unstick.
    const switchSafetyTimer = window.setTimeout(() => {
      if (isSwitchingTrackRef.current) {
        clearSwitchingOverlay();
      }
    }, 12_000);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
      video.removeEventListener("stalled", handleStalled);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.clearTimeout(switchSafetyTimer);
      if (stalledTimerRef.current) {
        clearTimeout(stalledTimerRef.current);
        stalledTimerRef.current = null;
      }
      stopPlayback();
    };
  }, [itemId, retryToken, resumePositionTicks, autoPlay]);

  // Keep the audio/subtitle refs in sync with state so the mount effect's
  // Jellyfin progress reports use the latest track selection without
  // re-binding its event listeners.
  useEffect(() => {
    audioIndexRef.current = audioIndex;
    subtitleIndexRef.current = subtitleIndex;
  }, [audioIndex, subtitleIndex]);

  // Imperative src swap on track changes. By setting `video.src` directly
  // (not via a JSX `src` attribute) we prevent React from re-rendering the
  // URL back to the previous value when it re-runs. The video element keeps
  // its buffered context and the surrounding controls don't flicker.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const next = playbackPath(itemId, {
      audioStreamIndex: audioIndex,
      subtitleStreamIndex: subtitleIndex,
    });
    // Track every (itemId, tracks, retry) we've already loaded. Skipping
    // when the key matches lets us avoid double-loading on the first commit
    // while still honoring `retryToken` bumps (which produce a new key).
    // `itemId` is the first segment so that when the parent remounts the
    // player on episode change (key={item.id}) the previous key — even if
    // it somehow survived — would never match and we'd always load fresh.
    const sourceKey = `${itemId}|${audioIndex ?? ""}|${subtitleIndex ?? ""}|${retryToken}`;
    if (loadedSourceKeyRef.current === sourceKey) return;
    loadedSourceKeyRef.current = sourceKey;
    // Capture the current play/pause state so the loadedmetadata handler
    // can decide whether to auto-resume after the new stream loads. On the
    // first load (or before any source has loaded yet) `video.readyState`
    // is 0 (HAVE_NOTHING) and `paused` defaults to true — fall back to
    // `autoPlay` so the initial autoplay mount still works. On any later
    // load (track switch / manual retry) honor whatever the user had set.
    wasPlayingBeforeSwapRef.current = video.readyState < 1 ? autoPlay : !video.paused;
    isSwitchingTrackRef.current = true;
    setIsSwitchingTrack(true);
    video.src = next;
    video.load();
  }, [itemId, audioIndex, subtitleIndex, retryToken, autoPlay]);

  // Track switching — just sets state. The imperative src-swap effect above
  // handles reloading the stream with the new audio/subtitle. The
  // isSwitchingTrackRef freezes the displayed time during the swap so the
  // UI doesn't flash 0:00, and wasPlayingBeforeSwapRef restores the user's
  // play/pause state after the new stream's loadedmetadata fires.
  const switchAudio = useCallback(
    (index: number | undefined) => {
      setShowAudioMenu(false);
      const video = videoRef.current;
      if (video) {
        currentTimeRef.current = video.currentTime;
        wasPlayingBeforeSwapRef.current = !video.paused;
      }
      seekedRef.current = false;
      // Force the imperative src-swap effect to reload even when the same
      // track is re-selected — the previous early-return shortcut left no way
      // to retry a silently-failed swap (e.g. Jellyfin ignored
      // AudioStreamIndex for the source).
      if (index !== audioIndex) {
        setAudioIndex(index);
      } else {
        setRetryToken((token) => token + 1);
      }
    },
    [audioIndex],
  );

  const switchSubtitle = useCallback(
    (index: number | undefined) => {
      setShowSubtitleMenu(false);
      const video = videoRef.current;
      if (video) {
        currentTimeRef.current = video.currentTime;
        wasPlayingBeforeSwapRef.current = !video.paused;
      }
      seekedRef.current = false;
      if (index !== subtitleIndex) {
        setSubtitleIndex(index);
      } else {
        setRetryToken((token) => token + 1);
      }
    },
    [subtitleIndex],
  );

  const selectedAudio = useMemo(
    () => audioStreams.find((s) => s.index === audioIndex) ?? audioStreams[0],
    [audioStreams, audioIndex],
  );
  const selectedSubtitle = useMemo(
    () => subtitleStreams.find((s) => s.index === subtitleIndex),
    [subtitleStreams, subtitleIndex],
  );

  // Sync play / pause / mute / volume badges with the live <video> state.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const sync = () => {
      setIsPaused(video.paused);
      setIsMuted(video.muted);
      setVolume(video.volume);
      lastVolumeRef.current = video.volume > 0 ? video.volume : lastVolumeRef.current;
    };
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    video.addEventListener("volumechange", sync);
    sync();
    return () => {
      video.removeEventListener("play", sync);
      video.removeEventListener("pause", sync);
      video.removeEventListener("volumechange", sync);
    };
  }, []);

  // Keep `video.playbackRate` in sync with state (for when the user cycles speed).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackRate;
  }, [playbackRate]);

  // Fullscreen handling — extracted into useFullscreen (see player/useFullscreen.ts).
  // Auto-hide controls in fullscreen — extracted into useAutoHideControls.
  const { isFullscreen, isFullscreenRef, toggleFullscreen, enterFullscreenIfEnabled } =
    useFullscreen({ shellRef, videoRef, enabled: fullscreenOnFirstClick });
  const [controlsVisible, wakeControls] = useAutoHideControls(isFullscreen);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  const handleVideoClick = useCallback(() => {
    if (enterFullscreenIfEnabled()) return;
    togglePlay();
  }, [enterFullscreenIfEnabled, togglePlay]);

  // Double-click does nothing meaningful in fullscreen (no theater toggle
  // requested) — keep it as a no-op to avoid accidentally exiting fullscreen
  // when the user just wants to wake the controls.
  const handleVideoDoubleClick = useCallback(() => {}, []);

  const seekTo = useCallback((targetSeconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const duration = Number.isFinite(video.duration) ? video.duration : Number.POSITIVE_INFINITY;
    const clamped = Math.min(Math.max(targetSeconds, 0), duration);
    video.currentTime = clamped;
    currentTimeRef.current = clamped;
    setCurrentTime(clamped);
  }, []);

  const seekBy = useCallback(
    (deltaSeconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      seekTo(video.currentTime + deltaSeconds);
    },
    [seekTo],
  );

  const applyVolume = useCallback((value: number, alsoSetMuted: boolean) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.min(Math.max(value, 0), 1);
    video.volume = clamped;
    if (alsoSetMuted) video.muted = clamped === 0;
    if (clamped > 0) lastVolumeRef.current = clamped;
    setVolume(clamped);
    setIsMuted(clamped === 0);
  }, []);

  // Convenience for VolumeControl — it always wants volume changes to update
  // muted state when crossing zero, which matches `alsoSetMuted=true` above.
  const setVolumeFromControl = useCallback(
    (value: number) => applyVolume(value, true),
    [applyVolume],
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.muted || video.volume === 0) {
      video.muted = false;
      const restore = lastVolumeRef.current > 0 ? lastVolumeRef.current : 1;
      video.volume = restore;
      setVolume(restore);
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  }, []);

  const cyclePlaybackRate = useCallback(() => {
    setPlaybackRate((current) => {
      const idx = PLAYBACK_RATES.indexOf(current);
      const next = PLAYBACK_RATES[(idx + 1) % PLAYBACK_RATES.length];
      return next;
    });
  }, []);

  const toggleTheaterMode = useCallback(() => {
    setTheaterMode((value) => !value);
  }, []);

  // Keyboard shortcuts.
  usePlayerKeyboard({
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
  });

  const hasTracks = audioStreams.length > 0 || subtitleStreams.length > 0;

  const progressPct =
    Number.isFinite(duration) && duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
  const bufferedPct =
    Number.isFinite(duration) && duration > 0 ? Math.min((bufferedEnd / duration) * 100, 100) : 0;

  const shellClass = `player-shell relative overflow-hidden rounded-3xl border border-(--border) bg-black shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${
    theaterMode ? "max-w-5xl mx-auto transition-[max-width] duration-300" : ""
  }`;

  const overlayOpacity = isFullscreen && !controlsVisible ? "opacity-0" : "opacity-100";
  const overlayPointer = isFullscreen && !controlsVisible ? "pointer-events-none" : "pointer-events-auto";

  const handleShellClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      // Clicks that landed on a button/menu inside the controls overlay have
      // already been handled — they don't bubble out as `currentTarget` clicks,
      // but we still double-check by skipping clicks on interactive elements.
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, a, input, [role='slider']")) return;
      // Clicks on the <video> itself are handled by `handleVideoClick`; the
      // event bubbles up to the shell, but we must not run a second handler
      // here — otherwise the fullscreen request kicked off by the video click
      // races against `togglePlay()` and either cancels the fullscreen or
      // pauses playback the moment the user enters fullscreen.
      if (target?.tagName === "VIDEO") return;
      // Outside fullscreen: enter fullscreen on click if requested.
      if (!isFullscreenRef.current) {
        if (enterFullscreenIfEnabled()) return;
        // No fullscreen-on-click → behave like a normal video click.
        togglePlay();
        return;
      }
      // Inside fullscreen: toggle play/pause, briefly show controls.
      togglePlay();
      wakeControls();
    },
    [togglePlay, wakeControls, enterFullscreenIfEnabled, isFullscreenRef],
  );

  return (
    <div ref={shellRef} className={shellClass} onClick={handleShellClick}>
      <style jsx>{`
        .player-shell:fullscreen {
          background: #000;
          border: 0;
          border-radius: 0;
          box-shadow: none;
        }
        .player-shell:fullscreen video {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .player-shell video::-webkit-media-controls-fullscreen-button,
        .player-shell video::-webkit-media-controls-overlay-play__button {
          display: none !important;
        }
        .player-shell video::-webkit-media-controls {
          opacity: 1 !important;
        }
      `}</style>
      {/* Keep one video element alive while tracks change. The source is swapped
          imperatively so React cannot restore the previous URL during reload. */}
      <video
        key={itemId}
        ref={videoRef}
        controls={false}
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        disablePictureInPicture
        controlsList="nodownload noplaybackrate"
        onClick={handleVideoClick}
        onDoubleClick={handleVideoDoubleClick}
        className="aspect-video w-full cursor-pointer bg-black"
      />

      {/* Persistent progress strip — only visible in fullscreen when the
          auto-hiding controls are not on screen, so it doesn't double up
          with the scrubber inside the controls row. */}
      {duration > 0 && isFullscreen && !controlsVisible ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[3px] bg-white/15">
          <div
            className="absolute left-0 top-0 h-full bg-white/30"
            style={{ width: `${bufferedPct}%` }}
          />
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-rose-500 to-rose-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      ) : null}

      {/* Centered overlays: track-switch indicator + load error. */}
      <div
        className={`absolute inset-0 z-40 flex items-end justify-center pb-20 transition-opacity duration-200 ${
          isSwitchingTrack ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/70 px-4 py-1.5 text-xs font-medium text-white/90 shadow-lg backdrop-blur">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Switching track…
        </div>
      </div>

      {loadError ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center">
          <div className="mx-auto max-w-md rounded-2xl border border-rose-500/30 bg-black/85 px-5 py-4 text-center text-white shadow-2xl backdrop-blur">
            <AlertCircle className="mx-auto h-6 w-6 text-rose-400" />
            <p className="mt-2 text-sm font-semibold">Playback failed</p>
            <p className="mt-1 text-xs text-white/70">{loadError}</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              {retryCountdown !== null ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white/80">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Retrying in {retryCountdown}s
                </span>
              ) : null}
              <button
                type="button"
                onClick={manualRetry}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry now
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Top-right: theater toggle / speed (visible always when not fullscreen). */}
      <div
        className={`absolute inset-x-0 top-0 z-30 flex justify-end gap-2 p-3 transition-opacity duration-300 sm:p-4 ${overlayOpacity} ${overlayPointer}`}
      >
        <button
          type="button"
          onClick={toggleTheaterMode}
          aria-label={theaterMode ? "Exit theater mode" : "Enter theater mode"}
          aria-pressed={theaterMode}
          title={theaterMode ? "Exit theater (T)" : "Theater mode (T)"}
          className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold backdrop-blur transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
            theaterMode
              ? "border-white/40 bg-white/15 text-white"
              : "border-white/20 bg-black/55 text-white/80 hover:bg-black/75"
          }`}
        >
          <Tv2 className="h-3.5 w-3.5" />
          {theaterMode ? "Theater" : "Theater"}
        </button>
        <button
          type="button"
          onClick={cyclePlaybackRate}
          aria-label={`Playback speed ${playbackRate}x`}
          title={`Speed ${playbackRate}x (P)`}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-3 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Gauge className="h-3.5 w-3.5" />
          {playbackRate}x
        </button>
      </div>

      {/* Bottom: scrubber + controls. Auto-hides in fullscreen. */}
      <div
        className={`absolute inset-x-0 bottom-0 z-40 flex flex-col gap-1 px-3 pb-3 pt-12 transition-opacity duration-300 sm:px-4 sm:pb-4 ${overlayOpacity}`}
      >
        <Scrubber
          currentTime={currentTime}
          duration={duration}
          bufferedEnd={bufferedEnd}
          onSeek={seekTo}
          onSeekBy={seekBy}
        />

        {/* Controls row */}
        <div className={`flex items-center gap-2 ${overlayPointer}`}>
          <button
            type="button"
            onClick={() => seekBy(-10)}
            aria-label="Rewind 10 seconds"
            title="Rewind 10s"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronFirst className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPaused ? "Play" : "Pause"}
            title={isPaused ? "Play (Space)" : "Pause (Space)"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {isPaused ? (
              <Play className="h-5 w-5 fill-current" />
            ) : (
              <Pause className="h-5 w-5 fill-current" />
            )}
          </button>
          <button
            type="button"
            onClick={() => seekBy(10)}
            aria-label="Forward 10 seconds"
            title="Forward 10s"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLast className="h-5 w-5" />
          </button>

          <VolumeControl
            volume={volume}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onVolumeChange={setVolumeFromControl}
          />

          <span className="ml-1 select-none text-xs font-medium tabular-nums text-white/85">
            <span>{formatHMS(currentTime)}</span>
            <span className="mx-1 text-white/40">/</span>
            <span className="text-white/55">{formatHMS(duration)}</span>
          </span>

          <div className="ml-auto flex items-center gap-2">
            {(prevEpisode || nextEpisode) ? (
              <div className="mr-1 hidden items-center gap-1.5 sm:flex">
                {prevEpisode ? (
                  <Link
                    href={watchPath(parentSeriesId ?? itemId, prevEpisode.id)}
                    aria-label={`Previous: ${prevEpisode.title}`}
                    title={`Previous · ${episodeLabel(prevEpisode)} · ${prevEpisode.title}`}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-3 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <ChevronFirst className="h-4 w-4" />
                    <span className="tabular-nums">{episodeLabel(prevEpisode)}</span>
                  </Link>
                ) : null}
                {nextEpisode ? (
                  <Link
                    href={watchPath(parentSeriesId ?? itemId, nextEpisode.id)}
                    aria-label={`Next: ${nextEpisode.title}`}
                    title={`Next · ${episodeLabel(nextEpisode)} · ${nextEpisode.title}`}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-3 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <span className="tabular-nums">{episodeLabel(nextEpisode)}</span>
                    <ChevronLast className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            ) : null}
            {hasTracks ? (
              <TrackMenuGroup
                audioStreams={audioStreams}
                subtitleStreams={subtitleStreams}
                selectedAudio={selectedAudio}
                selectedSubtitle={selectedSubtitle}
                audioIndex={audioIndex}
                subtitleIndex={subtitleIndex}
                showAudioMenu={showAudioMenu}
                showSubtitleMenu={showSubtitleMenu}
                onToggleAudio={() => {
                  setShowAudioMenu((value) => !value);
                  setShowSubtitleMenu(false);
                }}
                onToggleSubtitle={() => {
                  setShowSubtitleMenu((value) => !value);
                  setShowAudioMenu(false);
                }}
                onCloseAudio={() => setShowAudioMenu(false)}
                onCloseSubtitle={() => setShowSubtitleMenu(false)}
                switchAudio={switchAudio}
                switchSubtitle={switchSubtitle}
                side="up"
              />
            ) : null}
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});