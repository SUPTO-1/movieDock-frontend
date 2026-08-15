import { findCollectionPage } from "@/config/collection-pages";
import { renderCollectionPage } from "@/lib/collection-page";

const config = findCollectionPage("library")!;

export default async function LibraryPage() {
  return renderCollectionPage(config.slug, config.type);
}