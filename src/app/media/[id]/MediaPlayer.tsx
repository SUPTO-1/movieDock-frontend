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
  Captions,
  Check,
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  Gauge,
  Languages,
  Loader2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RefreshCw,
  Tv2,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { MediaItem, MediaStream } from "@/types/media";
import { playbackPath, watchPath } from "@/lib/routes";
import { episodeLabel, formatHMS } from "@/lib/utils";
import { recordProgress, clearProgress } from "@/lib/continueWatching";

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
   * When true, clicking the video (or empty shell area) enters browser
   * fullscreen. Subsequent clicks inside fullscreen toggle play/pause and
   * briefly show the controls overlay. The user exits via the in-overlay
   * back button (or ESC) which calls `onExitFullscreen`.
   */
  fullscreenOnFirstClick?: boolean;
  /**
   * Called when the user requests to leave fullscreen via the in-overlay
   * back button. The parent (watch page) handles navigation back to the
   * series/movie detail page.
   */
  onExitFullscreen?: () => void;
  playbackUrl: string;
  resumePositionTicks?: number;
  autoPlay?: boolean;
};

export type MediaPlayerHandle = {
  play: () => Promise<void> | void;
};

const TICKS_PER_SECOND = 10_000_000;
const AUTO_HIDE_MS = 3_000;
const PLAYBACK_RATES = [0.5, 1, 1.25, 1.5, 1.75, 2];
const NEARLY_COMPLETE_PERCENT = 99.5;

function ticksToSeconds(ticks: number) {
  return Math.max(0, ticks / TICKS_PER_SECOND);
}

function secondsToTicks(seconds: number) {
  return Math.max(0, Math.round(seconds * TICKS_PER_SECOND));
}

function trackLabel(stream: MediaStream) {
  return (
    stream.displayLanguage ||
    stream.language ||
    stream.title ||
    `${stream.codec ?? stream.type} #${stream.index}`
  );
}

function audioSubtitle(stream: MediaStream) {
  if (stream.channels) {
    return `${stream.codec ?? "Audio"} · ${stream.channels}ch`;
  }
  return stream.codec ?? "Audio";
}

type TrackMenuGroupProps = {
  audioStreams: MediaStream[];
  subtitleStreams: MediaStream[];
  selectedAudio?: MediaStream;
  selectedSubtitle?: MediaStream;
  audioIndex: number | undefined;
  subtitleIndex: number | undefined;
  showAudioMenu: boolean;
  showSubtitleMenu: boolean;
  onToggleAudio: () => void;
  onToggleSubtitle: () => void;
  onCloseAudio: () => void;
  onCloseSubtitle: () => void;
  switchAudio: (index: number | undefined) => void;
  switchSubtitle: (index: number | undefined) => void;
  side?: "up" | "down";
};

function TrackMenuGroup({
  audioStreams,
  subtitleStreams,
  selectedAudio,
  selectedSubtitle,
  audioIndex,
  subtitleIndex,
  showAudioMenu,
  showSubtitleMenu,
  onToggleAudio,
  onToggleSubtitle,
  onCloseAudio,
  onCloseSubtitle,
  switchAudio,
  switchSubtitle,
  side = "down",
}: TrackMenuGroupProps) {
  return (
    <>
      {audioStreams.length > 0 ? (
        <TrackMenu
          label={selectedAudio ? trackLabel(selectedAudio) : "Audio"}
          detail={selectedAudio ? audioSubtitle(selectedAudio) : undefined}
          icon={<Volume2 className="h-3.5 w-3.5" />}
          open={showAudioMenu}
          onToggle={onToggleAudio}
          onClose={onCloseAudio}
          side={side}
        >
          <MenuItem
            active={audioIndex === undefined}
            onClick={() => switchAudio(undefined)}
            title="Default"
            subtitle="Let Jellyfin choose"
            icon={audioIndex === undefined ? <Check className="h-4 w-4" /> : undefined}
          />
          {audioStreams.map((stream) => (
            <MenuItem
              key={`a-${stream.index}`}
              active={audioIndex === stream.index}
              onClick={() => switchAudio(stream.index)}
              title={trackLabel(stream)}
              subtitle={audioSubtitle(stream)}
              icon={audioIndex === stream.index ? <Check className="h-4 w-4" /> : undefined}
            />
          ))}
        </TrackMenu>
      ) : null}

      {subtitleStreams.length > 0 ? (
        <TrackMenu
          label={selectedSubtitle ? trackLabel(selectedSubtitle) : "Off"}
          detail={selectedSubtitle ? (selectedSubtitle.isForced ? "Forced" : "Subtitle") : undefined}
          icon={<Captions className="h-3.5 w-3.5" />}
          open={showSubtitleMenu}
          onToggle={onToggleSubtitle}
          onClose={onCloseSubtitle}
          side={side}
        >
          <MenuItem
            active={subtitleIndex === undefined}
            onClick={() => switchSubtitle(undefined)}
            title="Off"
            subtitle="No subtitles"
            icon={subtitleIndex === undefined ? <Check className="h-4 w-4" /> : undefined}
          />
          {subtitleStreams.map((stream) => (
            <MenuItem
              key={`s-${stream.index}`}
              active={subtitleIndex === stream.index}
              onClick={() => switchSubtitle(stream.index)}
              title={trackLabel(stream)}
              subtitle={stream.isForced ? "Forced" : stream.codec ?? "Subtitle"}
              icon={subtitleIndex === stream.index ? <Check className="h-4 w-4" /> : undefined}
            />
          ))}
        </TrackMenu>
      ) : null}
    </>
  );
}

export const MediaPlayer = forwardRef<MediaPlayerHandle, MediaPlayerProps>(function MediaPlayer(
  { itemId, item, parentSeriesArtwork, parentSeriesId, parentSeriesTitle, prevEpisode, nextEpisode, fullscreenOnFirstClick = false, onExitFullscreen, playbackUrl, resumePositionTicks = 0, autoPlay = false },
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
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrubDraggingRef = useRef(false);
  const volumeDraggingRef = useRef(false);
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

  const [isFullscreen, setIsFullscreen] = useState(false);
  // Synchronous mirror of `isFullscreen` so the auto-hide effect can read it
  // without re-creating the wake callback (which would unregister and
  // re-register its event listeners on every fullscreen toggle).
  const isFullscreenRef = useRef(false);
  const [isPaused, setIsPaused] = useState(!autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [theaterMode, setTheaterMode] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const bufferedEndRef = useRef(0);
  const [scrubPreviewTime, setScrubPreviewTime] = useState<number | null>(null);
  const [volumeMenuOpen, setVolumeMenuOpen] = useState(false);

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
      if (Math.abs(positionTicks - lastProgressSentRef.current) < TICKS_PER_SECOND * 5) return;
      lastProgressSentRef.current = positionTicks;
      void sendPlaybackState("progress", positionTicks, video.paused);

      // Mirror to localStorage so Continue Watching works even when Jellyfin's
      // UserData isn't returned to us (e.g. API key isn't bound to the watching user).
      // Throttled separately at a longer interval because the JSON read/write
      // is more expensive than the Jellyfin POST, and timeupdate fires too often.
      if (Math.abs(positionTicks - lastLocalStorageSentRef.current) < TICKS_PER_SECOND * 10) return;
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
  const switchAudio = useCallback((index: number | undefined) => {
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
  }, [audioIndex]);

  const switchSubtitle = useCallback((index: number | undefined) => {
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
  }, [subtitleIndex]);

  // Show "Switching track…" overlay whenever the URL changes after the
  // initial mount. switchAudio / switchSubtitle set `isSwitchingTrack` on
  // their way out; the seeked handler clears it once the new stream has
  // buffered enough to seek back to the saved currentTime.

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

  // Track fullscreen state. If the browser puts the <video> itself into
  // fullscreen (e.g. via the native controls button), escape that and
  // re-enter on the shell so our custom controls overlay remains interactive.
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
  }, []);

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
  }, []);

  // Tracks whether the user has ever requested fullscreen. While
  // `fullscreenOnFirstClick` is enabled and we're still in page mode, every
  // click on the video/shell enters fullscreen instead of toggling play.
  const hasEnteredFullscreenRef = useRef(false);

  const enterFullscreenOnFirstClick = useCallback(() => {
    if (!fullscreenOnFirstClick) return false;
    if (hasEnteredFullscreenRef.current) return false;
    if (document.fullscreenElement) {
      hasEnteredFullscreenRef.current = true;
      return false;
    }
    const shell = shellRef.current;
    if (!shell) return false;
    hasEnteredFullscreenRef.current = true;
    shell.requestFullscreen().catch(() => {
      // Browser blocked — fall back to normal click-to-toggle behavior.
    });
    return true;
  }, [fullscreenOnFirstClick]);

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
    if (enterFullscreenOnFirstClick()) return;
    togglePlay();
  }, [enterFullscreenOnFirstClick, togglePlay]);

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

  // Auto-hide controls in fullscreen after 3s of idle input. Reads
  // `isFullscreen` from a ref so the function reference is stable across
  // renders — otherwise the listener effect would tear down and rebuild its
  // DOM listeners on every fullscreen state change, which can drop the
  // listener mid-interaction and leave the controls stuck hidden.
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

  // Keyboard shortcuts. Always active while the player is mounted — including
  // fullscreen and when a TV remote sends a key.
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

  const hasTracks = audioStreams.length > 0 || subtitleStreams.length > 0;

  // ------------- Scrubber (custom slider with buffered + played + thumb) -----
  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const [scrubberActive, setScrubberActive] = useState(false);

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
      if (t !== null) seekTo(t);
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
  }, [scrubberActive, seekTo, timeFromClientX]);

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
          seekBy(event.shiftKey ? -30 : -5);
          break;
        case "ArrowRight":
          event.preventDefault();
          seekBy(event.shiftKey ? 30 : 5);
          break;
        case "Home":
          event.preventDefault();
          seekTo(0);
          break;
        case "End":
          event.preventDefault();
          seekTo(duration);
          break;
        case "PageUp":
          event.preventDefault();
          seekBy(60);
          break;
        case "PageDown":
          event.preventDefault();
          seekBy(-60);
          break;
      }
    },
    [duration, seekBy, seekTo],
  );

  // ------------- Volume popover (vertical slider above the button) ----------
  const volumeTrackRef = useRef<HTMLDivElement | null>(null);
  const volumeContainerRef = useRef<HTMLDivElement | null>(null);
  const [volumeActive, setVolumeActive] = useState(false);
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
      if (r !== null) applyVolume(r, true);
    },
    [applyVolume, openVolumeMenu, volumeFromClientY],
  );

  // Window-level move/up listeners attached while a volume drag is active.
  useEffect(() => {
    if (!volumeActive) return;
    const handleMove = (event: PointerEvent) => {
      if (!volumeDraggingRef.current) return;
      const r = volumeFromClientY(event.clientY);
      if (r !== null) applyVolume(r, true);
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
  }, [volumeActive, applyVolume, scheduleVolumeMenuClose, volumeFromClientY]);

  const progressPct =
    Number.isFinite(duration) && duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
  const bufferedPct =
    Number.isFinite(duration) && duration > 0 ? Math.min((bufferedEnd / duration) * 100, 100) : 0;
  const scrubPreviewPct =
    scrubPreviewTime !== null && Number.isFinite(duration) && duration > 0
      ? Math.min((scrubPreviewTime / duration) * 100, 100)
      : null;

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
      // Outside fullscreen: enter fullscreen on first click if requested.
      if (!isFullscreenRef.current) {
        if (enterFullscreenOnFirstClick()) return;
        // No fullscreen-on-first-click → behave like a normal video click.
        togglePlay();
        return;
      }
      // Inside fullscreen: toggle play/pause, briefly show controls.
      togglePlay();
      wakeControls();
    },
    [togglePlay, wakeControls, enterFullscreenOnFirstClick],
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

      {/* Top-left: back button — only visible when the parent supplied
          `onExitFullscreen` (i.e. we're inside the watch route). Clicking
          it exits fullscreen and hands control back to the parent so it can
          navigate to the series/movie detail page. */}
      {onExitFullscreen ? (
        <div
          className={`absolute left-0 top-0 z-30 flex p-3 transition-opacity duration-300 sm:p-4 ${overlayOpacity} ${overlayPointer}`}
        >
          <button
            type="button"
            onClick={onExitFullscreen}
            aria-label="Back to details"
            title="Back (Esc)"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-3 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>
        </div>
      ) : null}

      {/* Top-right: back / theater toggle / speed (visible always when not fullscreen). */}
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
        {/* Scrubber */}
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

          {/* Volume: button + vertical popover */}
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
              onClick={toggleMute}
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
                          applyVolume(volume + 0.05, true);
                          break;
                        case "ArrowDown":
                          event.preventDefault();
                          applyVolume(volume - 0.05, true);
                          break;
                        case "Home":
                          event.preventDefault();
                          applyVolume(0, true);
                          break;
                        case "End":
                          event.preventDefault();
                          applyVolume(1, true);
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

type TrackMenuProps = {
  label: string;
  detail?: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
  side?: "up" | "down";
};

function TrackMenu({
  label,
  detail,
  icon,
  open,
  onToggle,
  onClose,
  children,
  side = "down",
}: TrackMenuProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  const positionClass = side === "up" ? "bottom-full mb-2" : "top-11";

  return (
    <div ref={containerRef} className="pointer-events-auto relative">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-white/20 bg-black/55 px-3 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label={`${label} track options`}
      >
        {icon}
        <span className="max-w-[120px] truncate">{label}</span>
        {detail ? <span className="hidden text-white/60 sm:inline">· {detail}</span> : null}
        <ChevronDown
          className={`h-3.5 w-3.5 transition ${
            open ? (side === "up" ? "" : "rotate-180") : side === "up" ? "rotate-180" : ""
          }`}
        />
      </button>
      {open ? (
        <div
          className={`absolute right-0 z-50 w-72 overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur ${positionClass}`}
        >
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/60">
            <Languages className="h-3 w-3" />
            Track
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">{children}</ul>
        </div>
      ) : null}
    </div>
  );
}

type MenuItemProps = {
  active: boolean;
  title: string;
  subtitle?: string;
  onClick: () => void;
  icon?: React.ReactNode;
};

function MenuItem({ active, title, subtitle, onClick, icon }: MenuItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition focus-visible:bg-white/10 focus-visible:outline-none ${
          active ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/5"
        }`}
      >
        <span className="flex h-5 w-5 flex-none items-center justify-center text-(--accent)">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{title}</span>
          {subtitle ? (
            <span className="block truncate text-[0.7rem] text-white/50">{subtitle}</span>
          ) : null}
        </span>
      </button>
    </li>
  );
}