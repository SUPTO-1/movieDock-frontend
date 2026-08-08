import { notFound } from "next/navigation";
import { getMediaItem, getSeriesEpisodes } from "@/lib/backend";
import { playbackPath } from "@/lib/routes";
import { WatchView } from "./WatchView";

type WatchPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ episode?: string; audio?: string; subtitle?: string }>;
};

export default async function WatchPage({ params, searchParams }: WatchPageProps) {
  const [{ id }, { episode, audio, subtitle }] = await Promise.all([params, searchParams]);
  const [item, episodes] = await Promise.all([
    getMediaItem(id),
    getSeriesEpisodes(id),
  ]);

  if (!item) {
    notFound();
  }

  const activeEpisodeId = episode ?? item.id;
  const activeEpisode = episodes.find((entry) => entry.id === activeEpisodeId) ?? null;
  const activeItem = activeEpisode ?? item;

  const audioIndex = audio ? Number(audio) : undefined;
  const subtitleIndex = subtitle ? Number(subtitle) : undefined;

  const basePlaybackUrl = activeEpisode?.playbackUrl ?? item.playbackUrl ?? playbackPath(activeItem.id);
  const playbackUrl =
    Number.isFinite(audioIndex) || Number.isFinite(subtitleIndex)
      ? playbackPath(activeItem.id, {
          audioStreamIndex: Number.isFinite(audioIndex as number) ? (audioIndex as number) : undefined,
          subtitleStreamIndex: Number.isFinite(subtitleIndex as number) ? (subtitleIndex as number) : undefined,
        })
      : basePlaybackUrl;

  // The Back button on the watch page should land on the parent series'
  // details page, not on the episode's own detail page (which 404s). For a
  // movie this is just the URL id; for an episode we use the parent series'
  // id Jellyfin reported on the item.
  const parentSeriesId = activeItem.seriesId ?? item.seriesId ?? id;

  return (
    <main className="min-h-screen bg-black">
      <WatchView
        item={activeItem}
        seriesId={id}
        parentSeriesId={parentSeriesId}
        seriesTitle={item.title}
        parentSeriesArtwork={
          activeEpisode
            ? { posterUrl: item.posterUrl, backdropUrl: item.backdropUrl }
            : undefined
        }
        playbackUrl={playbackUrl}
        resumePositionTicks={activeEpisode?.playbackPositionTicks ?? item.playbackPositionTicks ?? 0}
        episodes={episodes}
        activeEpisodeId={activeEpisodeId}
      />
    </main>
  );
}