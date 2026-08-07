import { notFound } from "next/navigation";
import { getMediaItem, getSeriesEpisodes } from "@/lib/backend";
import { MediaDetailsView } from "./MediaDetailsView";
import { SimilarRail } from "@/components/media/SimilarRail";

type MediaDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MediaDetailPage({ params }: MediaDetailPageProps) {
  const { id } = await params;
  const item = await getMediaItem(id);

  if (!item) {
    notFound();
  }

  const isSeries = item.type === "series" || item.type === "anime";
  const episodes = isSeries ? await getSeriesEpisodes(id) : [];

  return (
    <div className="space-y-12">
      <MediaDetailsView item={item} episodes={episodes} />
      <div className="mx-auto max-w-[1600px] px-4 pb-12 sm:px-6 lg:px-8">
        <SimilarRail item={item} />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: MediaDetailPageProps) {
  const { id } = await params;
  const item = await getMediaItem(id);
  if (!item) {
    return { title: "MovieDock" };
  }
  return {
    title: `${item.title} • MovieDock`,
    description: item.overview,
  };
}