import type { MediaType } from "@/types/media";

export type CollectionPageSlug = "movies" | "tv-shows" | "anime" | "library";

export type CollectionPageConfig = {
  slug: CollectionPageSlug;
  type: MediaType | "all";
  eyebrow: string;
  title: string;
  description: string;
  emptyVariant?: "no-matches" | "no-content";
  emptyTitle?: string;
  emptyDescription?: string;
};

export const collectionPages: CollectionPageConfig[] = [
  {
    slug: "movies",
    type: "movie",
    eyebrow: "Library / Movies",
    title: "Movies",
    description: "Curated cinematic picks from your Jellyfin library.",
  },
  {
    slug: "tv-shows",
    type: "series",
    eyebrow: "Library / TV Shows",
    title: "TV Shows",
    description: "Serialized stories from your Jellyfin library.",
  },
  {
    slug: "anime",
    type: "anime",
    eyebrow: "Library / Anime",
    title: "Anime",
    description: "Stylized worlds and character-first storytelling.",
    emptyVariant: "no-content",
    emptyTitle: "No anime in your library",
    emptyDescription: "Add an anime library to Jellyfin and it will appear here automatically.",
  },
  {
    slug: "library",
    type: "all",
    eyebrow: "Library / View All",
    title: "All sections",
    description: "Browse the latest media pulled from your Jellyfin library.",
  },
];

export const findCollectionPage = (slug: string): CollectionPageConfig | undefined =>
  collectionPages.find((page) => page.slug === slug);