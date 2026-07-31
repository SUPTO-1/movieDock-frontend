import { notFound } from "next/navigation";
import Image from "next/image";
import { Play, Info } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getMediaItem } from "@/lib/backend";

type MediaDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MediaDetailPage({ params }: MediaDetailPageProps) {
  const { id } = await params;
  const item = await getMediaItem(id);

  if (!item) {
    notFound();
  }

  return (
    <AppShell>
      <section className="rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
          <div className="overflow-hidden rounded-4xl border border-(--border) bg-(--surface-elevated)">
            <Image src={item.posterUrl} alt={item.title} width={640} height={960} className="h-full w-full object-cover" sizes="(max-width: 1024px) 100vw, 320px" />
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.34em] text-(--accent)">{item.type}</p>
              <h1 className="text-3xl font-semibold tracking-tight text-(--foreground) sm:text-5xl">{item.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-(--muted)">
                <span>{item.year}</span>
                <span>•</span>
                <span>{item.duration}</span>
                <span>•</span>
                <span>{item.rating}</span>
                {item.resolution ? (
                  <>
                    <span>•</span>
                    <span>{item.resolution}</span>
                  </>
                ) : null}
              </div>
            </div>

            <p className="max-w-3xl text-base leading-8 text-(--muted) sm:text-lg">{item.overview}</p>

            <div className="flex flex-wrap gap-3">
              <button className="inline-flex h-12 items-center gap-2 rounded-full bg-(--foreground) px-6 text-sm font-semibold text-(--background) transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)">
                <Play className="h-4 w-4 fill-current" />
                Play
              </button>
              <button className="inline-flex h-12 items-center gap-2 rounded-full border border-(--border) bg-(--surface-elevated) px-6 text-sm font-semibold text-(--foreground) transition hover:bg-(--surface) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)">
                <Info className="h-4 w-4" />
                More info
              </button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}