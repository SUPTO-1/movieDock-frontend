"use client";

import { useSyncExternalStore } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { HeroBanner } from "@/components/media/HeroBanner";
import { MediaRow } from "@/components/media/MediaRow";
import { ContinueWatchingRow } from "@/components/media/ContinueWatchingRow";
import type { ContinueWatchingItem, MediaItem } from "@/types/media";
import { loadContinueWatching, subscribeToContinueWatching } from "@/lib/continueWatching";

type LibraryRow = {
  title: string;
  description: string;
  href: string;
  items: MediaItem[];
};

type HomeScreenProps = {
  heroMedia: MediaItem;
  recentlyAdded: MediaItem[];
  libraryRows: LibraryRow[];
};

export function HomeScreen({ heroMedia, recentlyAdded, libraryRows }: HomeScreenProps) {
  const isSeries = heroMedia.type === "series" || heroMedia.type === "anime";
  const playHref = isSeries ? `/media/${heroMedia.id}` : `/watch/${heroMedia.id}`;
  const playLabel = isSeries ? "View Series" : "Play";

  const continueWatching = useSyncExternalStore(
    subscribeToContinueWatching,
    () => loadContinueWatching(20),
    () => [] as ContinueWatchingItem[],
  );

  return (
    <AppShell flush>
      <div className="flex flex-col gap-10 lg:gap-14">
        <HeroBanner
          item={heroMedia}
          variant="preview"
          primaryAction={{ href: playHref, label: playLabel }}
        />

        <div className="mx-auto w-full max-w-[1600px] space-y-10 px-4 pb-12 sm:px-6 lg:px-8 lg:space-y-14">
          {continueWatching.length > 0 ? (
            <ContinueWatchingRow
              title="Continue Watching"
              description="Pick up exactly where you left off — movies and series you've started in the last 15 days."
              items={continueWatching}
            />
          ) : null}
          {recentlyAdded.length > 0 ? (
            <MediaRow
              title="Recently Added"
              description="The newest arrivals in your library."
              items={recentlyAdded}
              href="/library"
            />
          ) : null}
          {libraryRows.map((row) => (
            <MediaRow
              key={row.title}
              title={row.title}
              description={row.description}
              items={row.items}
              href={row.href}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
