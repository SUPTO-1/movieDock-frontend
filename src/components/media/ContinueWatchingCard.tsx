import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import type { ContinueWatchingItem } from "@/types/media";
import { watchPath } from "@/lib/routes";
import { cn, episodeLabel } from "@/lib/utils";

type ContinueWatchingCardProps = {
  item: ContinueWatchingItem;
  className?: string;
};

function formatEpisodeLabel(episode: ContinueWatchingItem["episode"]): string | null {
  if (!episode) return null;
  const base = episodeLabel({
    parentIndexNumber: episode.seasonNumber,
    indexNumber: episode.episodeNumber,
  });
  const label = base === "Episode" && !episode.title ? "" : base;
  return episode.title ? (label ? `${label} • ${episode.title}` : episode.title) : label || null;
}

function formatRemaining(minutes: number | undefined): string | null {
  if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes <= 0) {
    return null;
  }
  if (minutes < 60) {
    return `${minutes} min left`;
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours}h left` : `${hours}h ${remainder}m left`;
}

export function ContinueWatchingCard({ item, className }: ContinueWatchingCardProps) {
  const { media, episode, progress, remainingMinutes } = item;

  const href = episode?.id ? watchPath(media.id, episode.id) : watchPath(media.id);

  const episodeLabel = formatEpisodeLabel(episode);
  const remainingLabel = formatRemaining(remainingMinutes);

  const safeProgress =
    typeof progress === "number" && Number.isFinite(progress)
      ? Math.min(100, Math.max(0, progress))
      : 0;

  const secondaryLine = episodeLabel ?? "Continue watching";

  const isEpisode = Boolean(episode?.id);

  return (
    <Link
      href={href}
      aria-label={
        isEpisode && episodeLabel
          ? `Continue watching ${media.title}, ${episodeLabel}`
          : `Resume ${media.title}`
      }
      className={cn(
        "group relative block min-w-[200px] flex-none snap-start overflow-hidden rounded-md transition duration-300 ease-out hover:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) sm:min-w-[230px] xl:min-w-[260px]",
        className,
      )}
    >
      <div className="relative aspect-16/10 overflow-hidden rounded-md bg-(--surface-elevated)">
        <Image
          src={media.backdropUrl}
          alt={media.title}
          fill
          unoptimized
          sizes="(max-width: 768px) 60vw, 260px"
          className="object-cover transition duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />

        <div className="absolute inset-x-0 bottom-0 space-y-2 p-3 sm:p-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-(--accent)/90 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-black">
            <Play className="h-3 w-3 fill-current" />
            {isEpisode ? "Resume episode" : "Resume"}
          </div>
          <div className="space-y-1">
            <p className="line-clamp-1 text-sm font-bold text-white">{media.title}</p>
            <p className="line-clamp-1 text-xs font-medium text-white/80">{secondaryLine}</p>
            {!isEpisode && remainingLabel ? (
              <p className="line-clamp-1 text-[0.7rem] text-white/70">{remainingLabel}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full bg-(--accent) transition-[width] duration-500"
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </Link>
  );
}
