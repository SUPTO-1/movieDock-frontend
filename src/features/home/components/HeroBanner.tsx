import Image from "next/image";
import Link from "next/link";
import { Info, Play } from "lucide-react";
import type { MediaItem } from "@/types/media";

type HeroBannerProps = {
  media: MediaItem;
};

export function HeroBanner({ media }: HeroBannerProps) {
  return (
    <section className="surface-panel relative overflow-hidden rounded-4xl">
      <div className="relative min-h-[520px]">
        <Image src={media.backdropUrl} alt={media.title} fill priority className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,12,0.96)_0%,rgba(5,7,12,0.72)_42%,rgba(5,7,12,0.18)_74%,rgba(5,7,12,0.88)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.22),transparent_28%)]" />
        <div className="relative grid min-h-130 items-end px-6 py-8 sm:px-10 lg:px-12">
          <div className="max-w-3xl space-y-6 pb-4">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.34em] text-white/75 backdrop-blur">
              Featured Collection
            </div>
            <div className="space-y-4 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-300">MovieDock Original Pick</p>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-7xl">
                One clean landing surface for movie and TV discovery.
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/76">
                <span>{media.year}</span>
                <span>•</span>
                <span>{media.duration}</span>
                <span>•</span>
                <span>{media.rating}</span>
                {media.resolution ? (
                  <>
                    <span>•</span>
                    <span>{media.resolution}</span>
                  </>
                ) : null}
              </div>
              <p className="max-w-2xl text-base leading-8 text-white/84 sm:text-lg">{media.overview}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/media/${media.id}`}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Play className="h-4 w-4 fill-current" />
                Play
              </Link>
              <Link
                href={`/media/${media.id}`}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/18 bg-white/6 px-6 text-sm font-semibold text-white transition hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <Info className="h-4 w-4" />
                More Info
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}