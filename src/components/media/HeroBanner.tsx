"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Info, Play, Plus, Star, Volume2, VolumeX } from "lucide-react";
import { hasKnownDuration, type MediaItem } from "@/types/media";
import { mediaPath, previewUrl, watchPath } from "@/lib/routes";

type HeroBannerProps = {
  item: MediaItem;
  /**
   * `static` renders the details-page hero with a single poster image.
   * `preview` adds the IntersectionObserver-driven MP4 preview and a mute
   * toggle; used on the home page.
   */
  variant?: "static" | "preview";
  primaryAction?: { href: string; label: string };
};

export function HeroBanner({ item, variant = "static", primaryAction }: HeroBannerProps) {
  const isSeries = item.type === "series" || item.type === "anime";
  const playHref = primaryAction?.href ?? watchPath(item.id);
  const playLabel = primaryAction?.label ?? (isSeries ? "Play first episode" : "Play");

  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      if (videoRef.current) videoRef.current.muted = next;
      return next;
    });
  }, []);

  // Only fetch the preview MP4 when the hero scrolls into view;
  // pause and detach on cleanup so Jellyfin isn't streaming in the background.
  useEffect(() => {
    if (variant !== "preview") return;
    const video = videoRef.current;
    const container = video?.parentElement;
    if (!video || !container || typeof IntersectionObserver === "undefined") {
      if (video) video.src = previewUrl(item.id);
      return;
    }
    let armed = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!armed && entry.isIntersecting) {
            armed = true;
            video.src = previewUrl(item.id);
            video.load();
          } else if (armed && !entry.isIntersecting) {
            video.pause();
          }
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(container);
    return () => {
      observer.disconnect();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [item.id, variant]);

  return (
    <section className="relative isolate">
      <div className="relative h-[64vh] min-h-[440px] w-full overflow-hidden">
        <Image
          src={item.backdropUrl}
          alt={item.title}
          fill
          unoptimized
          priority
          sizes="100vw"
          className={`object-cover ${variant === "static" ? "object-[center_25%]" : "object-center"}`}
        />
        {variant === "preview" ? (
          <video
            ref={videoRef}
            muted={muted}
            playsInline
            loop
            preload="none"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 [@media(hover:hover)]:hover:opacity-100"
            onLoadedMetadata={(event) => {
              const v = event.currentTarget;
              // Skip ahead a few seconds to avoid cold-open.
              if (Number.isFinite(v.duration) && v.duration > 30) {
                v.currentTime = 15;
              }
            }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-(--background) via-(--background)/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-(--background)/95 via-(--background)/40 to-transparent" />
      </div>

      <div className="absolute inset-x-0 bottom-0 px-6 pb-12 sm:px-10 sm:pb-14 lg:px-16 lg:pb-20">
        <div className="mx-auto max-w-4xl space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-(--accent)">
            {item.type === "series" ? "Series" : item.type === "anime" ? "Anime" : "Movie"} • {item.year}
          </p>
          <h1 className="text-5xl font-black tracking-tight text-(--foreground) drop-shadow-lg sm:text-7xl">
            {item.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-(--muted)">
            {item.communityRating ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-(--surface-elevated) px-2 py-1 text-(--foreground)">
                <Star className="h-3.5 w-3.5 fill-(--accent) text-(--accent)" />
                {item.communityRating.toFixed(1)}
              </span>
            ) : null}
            <span>{item.year}</span>
            {hasKnownDuration(item) ? (
              <>
                <span>•</span>
                <span>{item.duration}</span>
              </>
            ) : null}
            {item.rating && item.rating !== "NR" ? (
              <>
                <span>•</span>
                <span className="rounded border border-(--border) px-1.5 py-0.5 text-xs">{item.rating}</span>
              </>
            ) : null}
            {item.resolution ? (
              <>
                <span>•</span>
                <span className="rounded border border-(--border) px-1.5 py-0.5 text-xs">{item.resolution}</span>
              </>
            ) : null}
            {item.status ? (
              <>
                <span>•</span>
                <span>{item.status}</span>
              </>
            ) : null}
          </div>
          <p className="line-clamp-3 max-w-3xl text-base leading-8 text-(--muted) sm:text-lg">
            {item.overview}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={playHref}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-(--accent) px-7 text-base font-semibold text-white shadow-lg shadow-(--accent-soft) transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Play className="h-5 w-5 fill-current" />
              {playLabel}
            </Link>
            <button
              type="button"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-(--border) bg-(--surface)/80 px-5 text-sm font-semibold text-(--foreground) backdrop-blur transition hover:bg-(--surface-elevated) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
            >
              <Plus className="h-4 w-4" />
              My List
            </button>
            <Link
              href={mediaPath(item.id)}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-(--border) bg-(--surface)/80 px-5 text-sm font-semibold text-(--foreground) backdrop-blur transition hover:bg-(--surface-elevated) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
            >
              <Info className="h-4 w-4" />
              More info
            </Link>
          </div>
        </div>
      </div>

      {variant === "preview" ? (
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Unmute preview" : "Mute preview"}
          className="absolute bottom-24 right-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur transition hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:bottom-28 sm:right-10"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      ) : null}
    </section>
  );
}