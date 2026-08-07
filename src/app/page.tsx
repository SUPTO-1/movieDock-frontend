import { HomeScreen } from "@/features/home/components/HomeScreen";
import { EmptyState } from "@/components/media/EmptyState";
import { AppShell } from "@/components/layout/AppShell";
import { getMediaItems } from "@/lib/backend";
import { animePath, libraryPath, moviesPath, tvShowsPath } from "@/lib/routes";
import type { MediaItem } from "@/types/media";

function pickHero(movies: MediaItem[], all: MediaItem[]) {
  return movies[0] ?? all[0];
}

function groupItems(all: MediaItem[]) {
  const movieItems = all.filter((item) => item.type === "movie");
  const seriesItems = all.filter((item) => item.type === "series");
  const animeItems = all.filter((item) => item.type === "anime");

  return [
    {
      title: "Movies",
      description: "Curated cinematic picks for the big-screen feeling.",
      href: moviesPath(),
      items: movieItems.slice(0, 20),
    },
    {
      title: "TV Shows",
      description: "Serialized stories designed for late-night viewing.",
      href: tvShowsPath(),
      items: seriesItems.slice(0, 20),
    },
    {
      title: "Anime",
      description: "Stylized worlds and character-first storytelling.",
      href: animePath(),
      items: animeItems.slice(0, 20),
    },
  ].filter((row) => row.items.length > 0);
}

export default async function HomePage() {
  const [movies, series, anime] = await Promise.all([
    getMediaItems("movie", 30),
    getMediaItems("series", 30),
    getMediaItems("anime", 30),
  ]);

  if (movies.length === 0 && series.length === 0 && anime.length === 0) {
    return (
      <AppShell>
        <EmptyState
          variant="no-content"
          title="Your library is empty"
          description="Add media to your Jellyfin library and refresh this page to see your content here."
          action={{ href: libraryPath(), label: "Browse library" }}
        />
      </AppShell>
    );
  }

  const seen = new Set<string>();
  const merged = [...movies, ...series, ...anime].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  const heroMedia = pickHero(movies, merged);
  const recentlyAdded = merged.slice(0, 20);
  const libraryRows = groupItems(merged);

  return (
    <HomeScreen
      heroMedia={heroMedia}
      recentlyAdded={recentlyAdded}
      libraryRows={libraryRows}
    />
  );
}