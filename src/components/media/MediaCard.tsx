import Image from "next/image";
import Link from "next/link";
import { Play, Plus, ThumbsUp, ChevronDown } from "lucide-react";
import { hasKnownDuration, type MediaItem } from "@/types/media";
import { cn } from "@/lib/utils";
import { mediaPath } from "@/lib/routes";

type MediaCardProps = {
  item: MediaItem;
  href?: string;
  className?: string;
  showRail?: boolean;
};

export function MediaCard({ item, href = mediaPath(item.id), className, showRail = false }: MediaCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative block rounded-md transition duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)",
        showRail
          ? "min-w-[180px] flex-none snap-start hover:z-10 sm:min-w-[210px] xl:min-w-[240px]"
          : "h-full",
        className,
      )}
    >
      <div className="relative aspect-2/3 overflow-hidden rounded-md bg-(--surface-elevated)">
        <Image
          src={item.posterUrl}
          alt={item.title}
          fill
          unoptimized
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 240px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

        {/* Quick actions on hover */}
        <div className="absolute inset-x-0 bottom-0 translate-y-3 space-y-3 p-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-md">
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            </div>
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-black/40 text-white backdrop-blur transition hover:border-white">
              <Plus className="h-4 w-4" />
            </div>
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-black/40 text-white backdrop-blur transition hover:border-white">
              <ThumbsUp className="h-4 w-4" />
            </div>
            <div className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-black/40 text-white backdrop-blur transition hover:border-white">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="line-clamp-1 text-sm font-bold text-white">{item.title}</p>
            <div className="flex flex-wrap items-center gap-1.5 text-[0.65rem] font-semibold text-white/80">
              <span className="rounded border border-white/30 px-1.5 py-0.5">{item.rating}</span>
              {item.resolution ? (
                <span className="rounded border border-white/30 px-1.5 py-0.5">{item.resolution}</span>
              ) : null}
              <span>{item.year}</span>
              {hasKnownDuration(item) ? (
                <>
                  <span>•</span>
                  <span>{item.duration}</span>
                </>
              ) : null}
            </div>
            <p className="line-clamp-2 text-[0.7rem] leading-snug text-white/70">{item.overview}</p>
          </div>
        </div>
      </div>

      {/* Default info (when no hover) */}
      <div className="mt-2 px-1 transition-opacity duration-300 group-hover:opacity-0">
        <p className="line-clamp-1 text-sm font-semibold text-(--foreground)">{item.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[0.65rem] text-(--muted)">
          <span>{item.year}</span>
          <span>•</span>
          <span>{item.rating}</span>
          {item.resolution ? (
            <>
              <span>•</span>
              <span>{item.resolution}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Progress bar */}
      {typeof item.progress === "number" && item.progress > 0 ? (
        <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-full bg-white/20">
          <div className="h-full bg-(--accent)" style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }} />
        </div>
      ) : null}
    </Link>
  );
}
