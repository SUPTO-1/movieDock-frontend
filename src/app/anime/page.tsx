import { findCollectionPage } from "@/config/collection-pages";
import { renderCollectionPage } from "@/lib/collection-page";

const config = findCollectionPage("anime")!;

export default async function AnimePage() {
  return renderCollectionPage(config.slug, config.type);
}