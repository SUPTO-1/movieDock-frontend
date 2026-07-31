import type { MediaItem } from "@/types/media";
import { MediaRow } from "@/components/media/MediaRow";

type ContinueWatchingProps = {
  items: MediaItem[];
};

export function ContinueWatching({ items }: ContinueWatchingProps) {
  return (
    <MediaRow
      title="Continue Watching"
      description="Pick up where you left off across movies, shows, and anime."
      items={items}
      href="/library"
    />
  );
}