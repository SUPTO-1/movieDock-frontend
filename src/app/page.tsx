import { HomeScreen } from "@/features/home/components/HomeScreen";
import { getMediaItems } from "@/lib/backend";
import type { MediaItem } from "@/types/media";

function pickHero(items: MediaItem[]) {
  return items.find((item) => item.type === "movie") ?? items[0];
}

function groupItems(items: MediaItem[]) {
  const movieItems = items.filter((item) => item.type === "movie");
  const seriesItems = items.filter((item) => item.type === "series");
  const animeItems = items.filter((item) => item.type === "anime");

  return [
    {
      title: "Movies",
      description: "Curated cinematic picks for the big-screen feeling.",
      href: "/movies",
      items: movieItems.slice(0, 20),
    },
    {
      title: "TV Shows",
      description: "Serialized stories designed for late-night viewing.",
      href: "/tv-shows",
      items: seriesItems.slice(0, 20),
    },
    {
      title: "Anime",
      description: "Stylized worlds and character-first storytelling.",
      href: "/anime",
      items: animeItems.slice(0, 20),
    },
  ].filter((row) => row.items.length > 0);
}

export default async function HomePage() {
  const allItems = await getMediaItems("all", 20);
  const heroMedia = pickHero(allItems);
  const continueWatching = allItems.filter((item) => typeof item.progress === "number").slice(0, 20);
  const recentlyAdded = allItems.slice(0, 20);
  const libraryRows = groupItems(allItems);

  return <HomeScreen heroMedia={heroMedia} continueWatching={continueWatching} recentlyAdded={recentlyAdded} libraryRows={libraryRows} />;
}
