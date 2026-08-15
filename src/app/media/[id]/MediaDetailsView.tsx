"use client";

import type { MediaItem } from "@/types/media";
import { HeroBanner } from "@/components/media/HeroBanner";
import { CastStrip } from "@/components/media/CastStrip";
import { EpisodePreview } from "@/components/media/EpisodePreview";
import { BackButton } from "@/components/media/BackButton";

type MediaDetailsViewProps = {
  item: MediaItem;
  episodes: MediaItem[];
};

export function MediaDetailsView({ item, episodes }: MediaDetailsViewProps) {
  const isSeries = item.type === "series" || item.type === "anime";

  return (
    <div className="space-y-12">
      <div className="pointer-events-none fixed inset-x-0 top-20 z-30 px-4 sm:top-24 sm:px-6 lg:px-8">
        <div className="pointer-events-auto inline-block">
          <BackButton fallbackHref="/" label="Back" />
        </div>
      </div>

      <HeroBanner
        item={item}
        primaryAction={
          isSeries && episodes[0]
            ? { href: `#episodes`, label: `Watch ${episodes[0].title}` }
            : undefined
        }
      />

      <div className="mx-auto max-w-[1600px] space-y-12 px-4 pb-12 sm:px-6 lg:px-8">
        <section id="more-info" className="scroll-mt-32 space-y-3 rounded-3xl border border-border-themed bg-surface p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-accent">Synopsis</p>
          <p className="max-w-6xl text-base leading-8 text-foreground">{item.overview}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            {item.genres.length > 0 ? (
              item.genres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-border-themed bg-surface-elevated px-3 py-1 text-xs font-medium text-foreground"
                >
                  {genre}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted">No genres listed</span>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-border-themed bg-surface p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:p-8">
          <CastStrip cast={item.cast ?? []} />
        </section>

        {isSeries ? (
          <section id="episodes" className="rounded-3xl border border-border-themed bg-surface p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:p-8">
            <EpisodePreview
              episodes={episodes}
              seriesTitle={item.title}
              seriesId={item.id}
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}