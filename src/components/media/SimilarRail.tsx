import type { MediaItem } from "@/types/media";
import { MediaRow } from "@/components/media/MediaRow";
import { getMediaItems } from "@/lib/backend";

type SimilarRailProps = {
  item: MediaItem;
};

function pickSimilar(current: MediaItem, pool: MediaItem[]) {
  const currentGenres = new Set((current.genres ?? []).map((genre) => genre.toLowerCase()));

  return pool
    .filter((candidate) => candidate.id !== current.id)
    .filter((candidate) => candidate.type === current.type)
    .map((candidate) => {
      const overlap = (candidate.genres ?? []).filter((genre) => currentGenres.has(genre.toLowerCase())).length;
      return { item: candidate, overlap };
    })
    .filter((entry) => entry.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 12)
    .map((entry) => entry.item);
}

export async function SimilarRail({ item }: SimilarRailProps) {
  const pool = await getMediaItems(item.type === "series" || item.type === "anime" ? "series" : "movie", 30);
  const matches = pickSimilar(item, pool);

  if (matches.length === 0) {
    return null;
  }

  return (
    <MediaRow
      title="More like this"
      description={`Other ${item.type === "anime" ? "anime" : item.type === "series" ? "series" : "movies"} you might enjoy based on shared genres.`}
      items={matches}
    />
  );
}