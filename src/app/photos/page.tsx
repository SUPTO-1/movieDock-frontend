import { PhotosPage } from "@/components/media/PhotosPage";
import { getMediaItems } from "@/lib/backend";

export default async function Page() {
  const photos = await getMediaItems("photo", 100);
  return <PhotosPage photos={photos} />;
}
