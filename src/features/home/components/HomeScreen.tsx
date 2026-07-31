import { AppShell } from "@/components/layout/AppShell";
import { MediaRow } from "@/components/media/MediaRow";
import { ContinueWatching } from "@/features/home/components/ContinueWatching";
import { HeroBanner } from "@/features/home/components/HeroBanner";
import { RecentlyAdded } from "@/features/home/components/RecentlyAdded";
import type { MediaItem } from "@/types/media";

type HomeScreenProps = {
  heroMedia: MediaItem;
  continueWatching: MediaItem[];
  recentlyAdded: MediaItem[];
  libraryRows: Array<{
    title: string;
    description: string;
    href: string;
    items: MediaItem[];
  }>;
};

export function HomeScreen({ heroMedia, continueWatching, recentlyAdded, libraryRows }: HomeScreenProps) {

  
  return (
    <AppShell>
      <div className="flex flex-col gap-8 lg:gap-10">
        <HeroBanner media={heroMedia} />
        <ContinueWatching items={continueWatching} />
        <RecentlyAdded items={recentlyAdded} />
        {libraryRows.map((row) => (
          <MediaRow key={row.title} title={row.title} description={row.description} items={row.items} href={row.href} />
        ))}
      </div>
    </AppShell>
  );
}