import { findCollectionPage } from "@/config/collection-pages";
import { renderCollectionPage } from "@/lib/collection-page";

const config = findCollectionPage("movies")!;

export default async function MoviesPage() {
  return renderCollectionPage(config.slug, config.type);
}