"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { MediaPlayer } from "@/app/media/[id]/MediaPlayer";
import type { MediaItem } from "@/types/media";
import { mediaPath, watchPath } from "@/lib/routes";
import { episodeLabel } from "@/lib/utils";

type WatchViewProps = {
  item: MediaItem;
  seriesId: string;
  seriesTitle: string;
  parentSeriesArtwork?: { posterUrl: string; backdropUrl: string };
  playbackUrl: string;
  resumePositionTicks: number;
  episodes: MediaItem[];
  activeEpisodeId: string;
};

export function WatchView({
  item,
  seriesId,
  seriesTitle,
  parentSeriesArtwork,
  playbackUrl,
  resumePositionTicks,
  episodes,
  activeEpisodeId,
}: WatchViewProps) {
  const router = useRouter();
  const isSeries = episodes.length > 0;
  // Episodes arrive sorted by AiredEpisodeOrder Ascending (set by the backend
  // Jellyfin query), so the array index is the play order.
  const activeIndex = useMemo(
    () => (isSeries ? episodes.findIndex((episode) => episode.id === activeEpisodeId) : -1),
    [episodes, activeEpisodeId, isSeries],
  );
  const prevEpisode = activeIndex > 0 ? episodes[activeIndex - 1] : null;
  const nextEpisode =
    activeIndex >= 0 && activeIndex < episodes.length - 1 ? episodes[activeIndex + 1] : null;

  // Exit fullscreen and bounce back to the series/movie detail page. Used by
  // the in-page "Back" button — pressing ESC / arrow / `f` while fullscreen
  // only exits fullscreen and leaves the user on the watch page, where they
  // can then click Back to navigate to the details.
  const handleExitToDetails = useCallback(() => {
    const exit = async () => {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      } catch {
        // Ignore — we'll still navigate back even if exit fails.
      }
      router.push(mediaPath(seriesId));
    };
    void exit();
  }, [router, seriesId]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl space-y-6 px-4 pb-24 pt-20 sm:px-8 sm:pt-24 lg:px-12">
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleExitToDetails}
            aria-label="Back to details"
            title="Back"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-3 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-rose-300">
              {isSeries ? seriesTitle : "Now Playing"}
            </p>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">{item.title}</h1>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl bg-black shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
          <MediaPlayer
            key={item.id}
            itemId={item.id}
            item={item}
            parentSeriesArtwork={parentSeriesArtwork}
            parentSeriesId={isSeries ? seriesId : undefined}
            parentSeriesTitle={isSeries ? seriesTitle : undefined}
            prevEpisode={prevEpisode}
            nextEpisode={nextEpisode}
            fullscreenOnFirstClick
            onExitFullscreen={handleExitToDetails}
            playbackUrl={playbackUrl}
            resumePositionTicks={resumePositionTicks}
            autoPlay
          />
        </div>
        {isSeries ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {prevEpisode ? (
              <Link
                href={watchPath(seriesId, prevEpisode.id)}
                className="group flex items-center gap-3 overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-4 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                aria-label={`Previous: ${prevEpisode.title}`}
              >
                <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-full border border-white/20 bg-black/55 text-white transition group-hover:bg-black/75">
                  <ChevronLeft className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.34em] text-white/60">
                    Previous · {episodeLabel(prevEpisode)}
                  </p>
                  <p className="line-clamp-1 text-sm font-semibold text-white">{prevEpisode.title}</p>
                </div>
                <div className="relative hidden h-16 w-28 flex-none overflow-hidden rounded-lg bg-black sm:block">
                  {prevEpisode.backdropUrl ? (
                    <Image
                      src={prevEpisode.backdropUrl}
                      alt={prevEpisode.backdropUrl}
                      fill
                      unoptimized
                      sizes="120px"
                      className="object-cover transition group-hover:scale-105"
                    />
                  ) : null}
                </div>
              </Link>
            ) : null}
            {nextEpisode ? (
              <Link
                href={watchPath(seriesId, nextEpisode.id)}
                className="group flex items-center gap-3 overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-4 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                aria-label={`Next: ${nextEpisode.title}`}
              >
                <div className="relative hidden h-16 w-28 flex-none overflow-hidden rounded-lg bg-black sm:block">
                  {nextEpisode.backdropUrl ? (
                    <Image
                      src={nextEpisode.backdropUrl}
                      alt={nextEpisode.backdropUrl}
                      fill
                      unoptimized
                      sizes="120px"
                      className="object-cover transition group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5 text-right">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.34em] text-(--accent)">
                    Next · {episodeLabel(nextEpisode)}
                  </p>
                  <p className="line-clamp-1 text-sm font-semibold text-white">{nextEpisode.title}</p>
                </div>
                <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-full border border-white/20 bg-black/55 text-white transition group-hover:bg-black/75">
                  <ChevronRight className="h-5 w-5" />
                </span>
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}