import type { MediaItem } from "@/types/media";

function buildCollection(items: MediaItem[], total: number, collectionId: string): MediaItem[] {
  return Array.from({ length: total }, (_, index) => {
    const source = items[index % items.length];

    return {
      ...source,
      id: `${collectionId}-${index + 1}`,
    };
  });
}

export const heroMedia: MediaItem = {
  id: "midnight-run",
  title: "Midnight Run",
  type: "movie",
  posterUrl: "/images/mock/posters/midnight-run.jpg",
  backdropUrl: "/images/mock/backdrops/midnight-run.jpg",
  year: 2025,
  duration: "2h 14m",
  rating: "TV-MA",
  genres: ["Thriller", "Crime", "Neo-noir"],
  overview:
    "A fugitive archivist crosses a rain-soaked city to recover a stolen drive that could expose the truth behind a missing library of films.",
  resolution: "4K HDR",
  quality: "HEVC",
};

const continueWatchingSeed: MediaItem[] = [
  {
    id: "city-lines",
    title: "City Lines",
    type: "series",
    posterUrl: "/images/mock/posters/city-lines.jpg",
    backdropUrl: "/images/mock/backdrops/city-lines.jpg",
    year: 2024,
    duration: "48m",
    rating: "TV-14",
    genres: ["Drama", "Mystery"],
    overview: "A detective follows a cold case through the city’s network of tunnels and surveillance.",
    progress: 68,
    resolution: "1080p",
    quality: "AAC 5.1",
  },
  {
    id: "deep-focus",
    title: "Deep Focus",
    type: "movie",
    posterUrl: "/images/mock/posters/deep-focus.jpg",
    backdropUrl: "/images/mock/backdrops/deep-focus.jpg",
    year: 2023,
    duration: "1h 56m",
    rating: "PG-13",
    genres: ["Sci-Fi", "Adventure"],
    overview: "A signal analyst decodes a transmission hidden inside a satellite’s repair logs.",
    progress: 41,
    resolution: "4K",
    quality: "Dolby Vision",
  },
  {
    id: "paper-moon",
    title: "Paper Moon",
    type: "anime",
    posterUrl: "/images/mock/posters/paper-moon.jpg",
    backdropUrl: "/images/mock/backdrops/paper-moon.jpg",
    year: 2024,
    duration: "24m",
    rating: "TV-14",
    genres: ["Anime", "Drama"],
    overview: "A quiet coming-of-age story about memory, music, and midnight train stations.",
    progress: 22,
    resolution: "1080p",
    quality: "Stereo",
  },
];

const recentlyAddedSeed: MediaItem[] = [
  {
    id: "cinematic-notes",
    title: "Cinematic Notes",
    type: "movie",
    posterUrl: "/images/mock/posters/cinematic-notes.jpg",
    backdropUrl: "/images/mock/backdrops/cinematic-notes.jpg",
    year: 2025,
    duration: "2h 02m",
    rating: "PG-13",
    genres: ["Drama", "Music"],
    overview: "An editor discovers a set of unreleased cuts that change the story of a classic film.",
    resolution: "4K",
    quality: "HDR10",
  },
  {
    id: "signal-room",
    title: "Signal Room",
    type: "series",
    posterUrl: "/images/mock/posters/signal-room.jpg",
    backdropUrl: "/images/mock/backdrops/signal-room.jpg",
    year: 2025,
    duration: "51m",
    rating: "TV-MA",
    genres: ["Drama", "Tech Thriller"],
    overview: "Inside a remote operations center, every alert reveals a larger conspiracy.",
    resolution: "4K",
    quality: "Dolby Atmos",
  },
  {
    id: "moon-channel",
    title: "Moon Channel",
    type: "anime",
    posterUrl: "/images/mock/posters/moon-channel.jpg",
    backdropUrl: "/images/mock/backdrops/moon-channel.jpg",
    year: 2024,
    duration: "26m",
    rating: "TV-14",
    genres: ["Anime", "Fantasy"],
    overview: "A relay operator on the moon receives calls from places that should not exist.",
    resolution: "1080p",
    quality: "AAC 5.1",
  },
];

const movieSeed: MediaItem[] = [heroMedia, continueWatchingSeed[1], recentlyAddedSeed[0]];
const tvSeed: MediaItem[] = [continueWatchingSeed[0], recentlyAddedSeed[1]];
const animeSeed: MediaItem[] = [continueWatchingSeed[2], recentlyAddedSeed[2]];

export const continueWatching = buildCollection(continueWatchingSeed, 20, "continue-watching");
export const recentlyAdded = buildCollection(recentlyAddedSeed, 20, "recently-added");

export const libraryRows = [
  {
    title: "Movies",
    description: "Curated cinematic picks for the big-screen feeling.",
    href: "/movies",
    items: buildCollection(movieSeed, 20, "movies"),
  },
  {
    title: "TV Shows",
    description: "Serialized stories designed for late-night viewing.",
    href: "/tv-shows",
    items: buildCollection(tvSeed, 20, "tv-shows"),
  },
  {
    title: "Anime",
    description: "Stylized worlds and character-first storytelling.",
    href: "/anime",
    items: buildCollection(animeSeed, 20, "anime"),
  },
];

export const libraryCollection = buildCollection([...movieSeed, ...tvSeed, ...animeSeed], 20, "library");

export const allMediaItems = [
  heroMedia,
  ...continueWatching,
  ...recentlyAdded,
  ...libraryRows.flatMap((row) => row.items),
];