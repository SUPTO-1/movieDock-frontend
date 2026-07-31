import { MediaCollectionPage } from "@/components/media/MediaCollectionPage";
import { getMediaItems } from "@/lib/backend";

export default async function AnimePage() {
  const items = await getMediaItems("anime", 20);

  return <MediaCollectionPage eyebrow="Library / Anime" title="Anime" description="Stylized worlds and character-first storytelling." items={items} />;
}