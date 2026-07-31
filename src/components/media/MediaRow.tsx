import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { MediaItem } from "@/types/media";
import { MediaCard } from "@/components/media/MediaCard";

type MediaRowProps = {
  title: string;
  description: string;
  items: MediaItem[];
  href?: string;
};

export function MediaRow({ title, description, items, href }: MediaRowProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-(--accent)">{title}</p>
          <p className="mt-2 max-w-2xl text-sm text-(--muted) sm:text-base">{description}</p>
        </div>
        {href ? (
          <Link
            href={href}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-(--border) bg-(--surface) px-4 text-sm font-medium text-(--foreground) transition duration-200 hover:bg-(--surface-elevated) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
      <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {items.slice(0, 20).map((item) => (
          <div key={item.id} className="min-w-[180px] flex-none snap-start sm:min-w-[210px] xl:min-w-[240px]">
            <MediaCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}