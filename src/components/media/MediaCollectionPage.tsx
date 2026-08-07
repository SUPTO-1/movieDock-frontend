import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MediaCard } from "@/components/media/MediaCard";
import { EmptyState } from "@/components/media/EmptyState";
import { type CollectionPageConfig, findCollectionPage } from "@/config/collection-pages";
import type { MediaItem } from "@/types/media";

type MediaCollectionPageProps = {
  /** Use this to look up the page config (slug-based routing). */
  slug?: string;
  /** Or pass these explicitly for one-off pages. */
  eyebrow?: string;
  title?: string;
  description?: string;
  items: MediaItem[];
  emptyVariant?: "no-matches" | "no-content";
  emptyTitle?: string;
  emptyDescription?: string;
};

export function MediaCollectionPage(props: MediaCollectionPageProps) {
  const config: CollectionPageConfig | undefined = props.slug ? findCollectionPage(props.slug) : undefined;
  const eyebrow = props.eyebrow ?? config?.eyebrow ?? "Library";
  const title = props.title ?? config?.title ?? "Library";
  const description = props.description ?? config?.description ?? "";
  const emptyVariant = props.emptyVariant ?? config?.emptyVariant ?? "no-matches";
  const emptyTitle = props.emptyTitle ?? config?.emptyTitle ?? "No titles found";
  const emptyDescription =
    props.emptyDescription ?? config?.emptyDescription ?? "Try a different category or add more media to your Jellyfin library.";
  const items = props.items;
  const hasItems = items.length > 0;

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

        {hasItems ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.slice(0, 20).map((item) => (
              <MediaCard key={item.id} item={item} className="h-full" />
            ))}
          </div>
        ) : (
          <EmptyState
            variant={emptyVariant}
            title={emptyTitle}
            description={emptyDescription}
            action={{ href: "/library", label: "Browse your library" }}
          />
        )}
      </section>
    </AppShell>
  );
}