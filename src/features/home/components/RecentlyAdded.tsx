import type { MediaItem } from "@/types/media";
import { MediaRow } from "@/components/media/MediaRow";

type RecentlyAddedProps = {
  items: MediaItem[];
};

export function RecentlyAdded({ items }: RecentlyAddedProps) {
  return <MediaRow title="Recently Added" description="Fresh arrivals from the local library." items={items} href="/library" />;
}