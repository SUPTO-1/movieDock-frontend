import Image from "next/image";
import Link from "next/link";
import { Play, X } from "lucide-react";
import type { ContinueWatchingItem } from "@/types/media";
import { watchPath } from "@/lib/routes";
import { cn, episodeLabel } from "@/lib/utils";
import { clearProgress } from "@/lib/continueWatching";

type ContinueWatchingCardProps = {
  item: ContinueWatchingItem;
  className?: string;
  /**
   * Called after the entry has been removed from local storage. Used by the
   * parent row to shift focus to a sibling card so TV/keyboard users don't
   * lose their place in the carousel.
   */
  onRemoved?: (removed: ContinueWatchingItem) => void;
  /**
   * Callback receiving the card's outermost <div> node. The parent row uses
   * this to look up a sibling card and shift focus to it after a removal.
   */
  containerRef?: (node: HTMLDivElement | null) => void;
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

export function ContinueWatchingCard({ item, className, onRemoved, containerRef }: ContinueWatchingCardProps) {
  const { media, episode, progress, remainingMinutes } = item;

  const href = episode?.id ? watchPath(media.id, episode.id) : watchPath(media.id);

  const episodeLabelText = formatEpisodeLabel(episode);
  const remainingLabel = formatRemaining(remainingMinutes);

  const safeProgress =
    typeof progress === "number" && Number.isFinite(progress)
      ? Math.min(100, Math.max(0, progress))
      : 0;

  const secondaryLine = episodeLabelText ?? "Continue watching";

  const isEpisode = Boolean(episode?.id);

  const handleRemove = (event: React.MouseEvent | React.KeyboardEvent) => {
    // Prevent the card-level click handler from interpreting this as a
    // navigation, and prevent the link wrapper from firing on bubbled
    // synthetic clicks.
    event.preventDefault();
    event.stopPropagation();
    // Episodes are collapsed onto the parent series' storage slot, so the
    // series id doubles as the dedupe key. Movies use just their own id.
    clearProgress(media.id, episode?.id ? media.id : undefined);
    onRemoved?.(item);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        // Group lets the remove button appear on hover or keyboard-focus of
        // any descendant — important for TV remote users who navigate with
        // the d-pad instead of a mouse.
        "group/card relative block min-w-[200px] flex-none snap-start overflow-hidden rounded-md transition duration-300 ease-out hover:z-10 focus-within:z-10 sm:min-w-[230px] xl:min-w-[260px]",
        className,
      )}
    >
      <Link
        href={href}
        aria-label={
          isEpisode && episodeLabelText
            ? `Continue watching ${media.title}, ${episodeLabelText}`
            : `Resume ${media.title}`
        }
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
      >
        <div className="relative aspect-16/10 overflow-hidden rounded-md bg-(--surface-elevated)">
          <Image
            src={media.backdropUrl}
            alt={media.title}
            fill
            unoptimized
            sizes="(max-width: 768px) 60vw, 260px"
            className="object-cover transition duration-500 group-hover/card:scale-105"
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

      {/* Remove button — Netflix-style "✕" in the top-right corner. Hidden
          by default, fades in on card hover (mouse) or keyboard focus
          anywhere inside the card (TV remote). Lives outside the <Link> so
          HTML stays valid (no interactive nested in interactive) and clicking
          it doesn't trigger navigation. */}
      <button
        type="button"
        onClick={handleRemove}
        onKeyDown={(event) => {
          // Activate on Enter/Space to match standard button behaviour, but
          // explicitly stop propagation so the card link doesn't also fire.
          if (event.key === "Enter" || event.key === " ") {
            handleRemove(event);
          }
        }}
        aria-label={`Remove ${media.title} from Continue Watching`}
        title="Remove from Continue Watching"
        className={cn(
          "absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full",
          "border border-white/30 bg-black/70 text-white shadow-md backdrop-blur transition",
          // Show on card hover (mouse) or focus-within (keyboard / TV remote).
          // Pointer events follow visibility so the button can't be tapped
          // while it's still fading in / invisible on touchscreens and TVs.
          "pointer-events-none opacity-0 group-hover/card:pointer-events-auto group-hover/card:opacity-100",
          "focus-visible:pointer-events-auto focus-visible:opacity-100",
          "hover:bg-black/90 hover:border-white/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)",
        )}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}