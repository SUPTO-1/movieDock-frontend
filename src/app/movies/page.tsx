import { MediaCollectionPage } from "@/components/media/MediaCollectionPage";
import { getMediaItems } from "@/lib/backend";

export default async function MoviesPage() {
  const items = await getMediaItems("movie", 20);

  return <MediaCollectionPage eyebrow="Library / Movies" title="Movies" description="Curated cinematic picks from your Jellyfin library." items={items} />;
}