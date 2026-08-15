import { findCollectionPage } from "@/config/collection-pages";
import { renderCollectionPage } from "@/lib/collection-page";

const config = findCollectionPage("tv-shows")!;

export default async function TVShowsPage() {
  return renderCollectionPage(config.slug, config.type);
}