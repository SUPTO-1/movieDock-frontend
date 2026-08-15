"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MediaCollectionGrid } from "@/components/media/MediaCollectionGrid";
import { EmptyState } from "@/components/media/EmptyState";
import {
  MediaCollectionUploadButtons,
  MediaCollectionUploadPanel,
} from "@/components/media/MediaCollectionUploadAffordance";
import { Card, CardHeader } from "@/components/ui/Card";
import { type CollectionPageConfig, findCollectionPage } from "@/config/collection-pages";
import { homePath, libraryPath } from "@/lib/routes";
import type { MediaItem } from "@/types/media";

type MediaCollectionPageProps = {
  /** Use this to look up the page config (slug-based routing). */
  slug?: string;
  /** Or pass these explicitly for one-off pages. */
  eyebrow?: string;
  title?: string;
  description?: string;
  items: MediaItem[];
  emptyVariant?: "no-matches" | "no-content" | "offline";
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { href: string; label: string };
};

type StagedBatch = { id: number; files: File[] };

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
  const emptyAction = props.emptyAction ?? { href: libraryPath(), label: "Browse your library" };
  const uploadKind = config?.uploadKind;

  const [batch, setBatch] = useState<StagedBatch | null>(null);

  const handlePick = useCallback((files: File[]) => {
    // Fresh id remounts the panel cleanly — avoids the React 19
    // setState-in-effect lint for batch changes.
    setBatch({ id: Date.now(), files });
  }, []);

  const handleDismiss = useCallback(() => setBatch(null), []);

  const trailing = uploadKind ? (
    <MediaCollectionUploadButtons kind={uploadKind} onPick={handlePick} isBatchActive={batch !== null} />
  ) : (
    <Link
      href={homePath()}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-border-themed bg-surface-elevated px-4 text-sm font-medium text-foreground transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <ArrowLeft className="h-4 w-4" />
      Back home
    </Link>
  );

  return (
    <AppShell>
      <section className="space-y-6 sm:space-y-8">
        <Card variant="elevated" radius="xl" className="p-5 sm:p-8">
          <CardHeader
            eyebrow={eyebrow}
            title={title}
            description={description}
            trailing={trailing}
          />
        </Card>

        {uploadKind ? (
          <MediaCollectionUploadPanel kind={uploadKind} batch={batch} onDismiss={handleDismiss} />
        ) : null}

        {hasItems ? (
          <MediaCollectionGrid items={items} pageSize={20} />
        ) : (
          <EmptyState
            variant={emptyVariant}
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        )}
      </section>
    </AppShell>
  );
}
