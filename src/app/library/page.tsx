import { MediaCollectionPage } from "@/components/media/MediaCollectionPage";
import { findCollectionPage } from "@/config/collection-pages";
import { getMediaItems } from "@/lib/backend";

const config = findCollectionPage("library")!;

export default async function LibraryPage() {
  const items = await getMediaItems(config.type, 20);
  return <MediaCollectionPage slug={config.slug} items={items} />;
}