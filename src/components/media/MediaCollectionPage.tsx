import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MediaCard } from "@/components/media/MediaCard";
import type { MediaItem } from "@/types/media";

type MediaCollectionPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: MediaItem[];
};

export function MediaCollectionPage({ eyebrow, title, description, items }: MediaCollectionPageProps) {
  return (
    <AppShell>
      <section className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:p-8">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-(--accent)">{eyebrow}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-(--foreground) sm:text-5xl">{title}</h1>
            <p className="max-w-3xl text-sm text-(--muted) sm:text-base">{description}</p>
          </div>
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-(--border) bg-(--surface-elevated) px-4 text-sm font-medium text-(--foreground) transition hover:bg-(--surface) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
          >
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>
        </div>

        <div className="flex items-center gap-3 rounded-3xl border border-dashed border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--muted)">
          <Search className="h-4 w-4" />
          Showing {items.slice(0, 20).length} items in this collection.
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.slice(0, 20).map((item) => (
            <MediaCard key={item.id} item={item} className="h-full" />
          ))}
        </div>
      </section>
    </AppShell>
  );
}