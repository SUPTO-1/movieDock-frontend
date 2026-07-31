import { MediaCollectionPage } from "@/components/media/MediaCollectionPage";
import { getMediaItems } from "@/lib/backend";

export default async function LibraryPage() {
  const items = await getMediaItems("all", 20);

  return (
    <MediaCollectionPage
      eyebrow="Library / View All"
      title="All sections"
      description="Browse the latest media pulled from your Jellyfin library."
      items={items}
    />
  );
}