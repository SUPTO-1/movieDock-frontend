import { MediaCollectionPage } from "@/components/media/MediaCollectionPage";
import { getMediaItems } from "@/lib/backend";

export default async function TVShowsPage() {
  const items = await getMediaItems("series", 20);

  return <MediaCollectionPage eyebrow="Library / TV Shows" title="TV Shows" description="Serialized stories from your Jellyfin library." items={items} />;
}