"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Clock, ChevronRight } from "lucide-react";
import { hasKnownDuration, type MediaItem } from "@/types/media";
import { playbackPath, watchPath } from "@/lib/routes";

type EpisodePreviewProps = {
  episodes: MediaItem[];
  seriesTitle: string;
  seriesId: string;
};

type SeasonGroup = {
  seasonNumber: number;
  seasonName: string;
  episodes: MediaItem[];
};

function formatLabel(parentIndexNumber?: number, indexNumber?: number) {
  const season = parentIndexNumber !== undefined ? `S${String(parentIndexNumber).padStart(2, "0")}` : "S--";
  const episode = indexNumber !== undefined ? `E${String(indexNumber).padStart(2, "0")}` : "E--";
  return `${season} ${episode}`;
}

function groupBySeason(episodes: MediaItem[]): SeasonGroup[] {
  const bySeason = new Map<number, MediaItem[]>();
  for (const episode of episodes) {
    const key = episode.parentIndexNumber ?? 1;
    const list = bySeason.get(key) ?? [];
    list.push(episode);
    bySeason.set(key, list);
  }
  return Array.from(bySeason.entries())
    .sort(([a], [b]) => a - b)
    .map(([seasonNumber, list]) => ({
      seasonNumber,
      seasonName: list[0]?.seasonName ?? `Season ${seasonNumber}`,
      episodes: list,
    }));
}

export function EpisodePreview({ episodes, seriesTitle, seriesId }: EpisodePreviewProps) {
  const groups = useMemo(() => groupBySeason(episodes), [episodes]);
  const [activeSeason, setActiveSeason] = useState<number>(groups[0]?.seasonNumber ?? 1);
  const [focusedEpisodeId, setFocusedEpisodeId] = useState<string>(episodes[0]?.id ?? "");
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  const focusedEpisode = useMemo(
    () => episodes.find((episode) => episode.id === focusedEpisodeId) ?? episodes[0],
    [episodes, focusedEpisodeId],
  );

  const previewUrl = useMemo(
    () => (focusedEpisode ? focusedEpisode.playbackUrl ?? playbackPath(focusedEpisode.id) : null),
    [focusedEpisode],
  );

  const currentGroup = useMemo(
    () => groups.find((group) => group.seasonNumber === activeSeason) ?? groups[0],
    [groups, activeSeason],
  );

  if (!focusedEpisode || !previewUrl) {
    return null;
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      {/* Episode list (left on desktop) */}
      <div className="order-2 space-y-5 lg:order-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-(--accent)">Episodes</p>
            <h2 className="mt-1 text-2xl font-semibold text-(--foreground)">{seriesTitle}</h2>
          </div>
          <span className="rounded-full border border-(--border) bg-(--surface) px-3 py-1 text-xs text-(--muted)">
            {episodes.length} episodes
          </span>
        </div>

        {groups.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => {
              const active = group.seasonNumber === activeSeason;
              return (
                <button
                  key={group.seasonNumber}
                  type="button"
                  onClick={() => setActiveSeason(group.seasonNumber)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) ${
                    active
                      ? "border-(--accent) bg-(--accent) text-white"
                      : "border-(--border) bg-(--surface) text-(--muted) hover:border-(--accent) hover:text-(--foreground)"
                  }`}
                >
                  {group.seasonName}
                </button>
              );
            })}
          </div>
        ) : null}

        <ul className="divide-y divide-(--border) overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
          {currentGroup?.episodes.map((episode) => {
            const active = episode.id === focusedEpisode.id;
            return (
              <li key={episode.id}>
                <Link
                  href={watchPath(seriesId, episode.id)}
                  onMouseEnter={() => setFocusedEpisodeId(episode.id)}
                  onFocus={() => setFocusedEpisodeId(episode.id)}
                  aria-current={active ? "true" : undefined}
                  className={`flex w-full items-center gap-4 p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) sm:p-4 ${
                    active ? "bg-(--accent-soft)" : "hover:bg-(--surface-elevated)"
                  }`}
                >
                  <div className="relative h-16 w-28 flex-none overflow-hidden rounded-xl bg-(--surface-elevated) sm:h-20 sm:w-32">
                    {episode.backdropUrl ? (
                      <Image
                        src={episode.backdropUrl}
                        alt={episode.title}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 112px, 128px"
                        className="object-cover"
                      />
                    ) : null}
                    {active ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Play className="h-6 w-6 fill-white text-white" />
                      </div>
                    ) : null}
                    {typeof episode.progress === "number" && episode.progress > 0 ? (
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                        <div
                          className="h-full bg-(--accent)"
                          style={{ width: `${Math.min(100, Math.max(0, episode.progress))}%` }}
                        />
                      </div>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-(--accent)">
                      {formatLabel(episode.parentIndexNumber, episode.indexNumber)}
                    </p>
                    <p className="line-clamp-1 text-sm font-semibold text-(--foreground)">{episode.title}</p>
                    <p className="line-clamp-2 text-xs text-(--muted)">{episode.overview}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[0.65rem] text-(--muted)">
                      {hasKnownDuration(episode) ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {episode.duration}
                        </span>
                      ) : null}
                      {typeof episode.progress === "number" && episode.progress > 0 ? (
                        <span>{Math.round(episode.progress)}% watched</span>
                      ) : null}
                    </div>
                  </div>
                  <ChevronRight className="hidden h-5 w-5 flex-none text-(--muted) sm:block" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Preview pane (right on desktop) */}
      <aside className="order-1 lg:sticky lg:top-28 lg:order-2 lg:self-start">
        <div className="overflow-hidden rounded-3xl border border-(--border) bg-black shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          <div className="relative aspect-video w-full">
            <video
              key={focusedEpisode.id}
              ref={previewVideoRef}
              src={previewUrl}
              muted
              playsInline
              preload="metadata"
              className="h-full w-full bg-black object-contain"
              onLoadedMetadata={(event) => {
                const video = event.currentTarget;
                // Skip ahead a few seconds to avoid the cold-open / studio logo
                // while still letting the user see what the episode is about.
                if (Number.isFinite(video.duration) && video.duration > 60) {
                  video.currentTime = 30;
                }
                video.play().catch(() => {});
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0" />
            <div className="absolute inset-x-0 bottom-0 space-y-1 p-5">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-(--accent)">
                {formatLabel(focusedEpisode.parentIndexNumber, focusedEpisode.indexNumber)} • Now previewing
              </p>
              <h3 className="text-xl font-semibold text-white sm:text-2xl">
                {focusedEpisode.title}
              </h3>
              <p className="line-clamp-3 text-xs text-white/70 sm:text-sm">
                {focusedEpisode.overview}
              </p>
            </div>
          </div>
        </div>
        <Link
          href={watchPath(seriesId, focusedEpisode.id)}
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-(--accent) px-6 text-sm font-semibold text-white shadow-lg shadow-(--accent-soft) transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Play className="h-5 w-5 fill-current" />
          Watch {focusedEpisode.title}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </aside>
    </section>
  );
}