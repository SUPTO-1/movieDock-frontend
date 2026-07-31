export type MediaType = "movie" | "series" | "anime" | "music" | "photo";

export type MediaItem = {
  id: string;
  title: string;
  type: MediaType;
  posterUrl: string;
  backdropUrl: string;
  year: number;
  duration: string;
  rating: string;
  genres: string[];
  overview: string;
  progress?: number;
  resolution?: string;
  quality?: string;
};