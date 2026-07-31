import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import type { MediaItem } from "@/types/media";
import { cn } from "@/lib/utils";

type MediaCardProps = {
  item: MediaItem;
  href?: string;
  className?: string;
};

export function MediaCard({ item, href = `/media/${item.id}`, className }: MediaCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group block overflow-hidden rounded-4xl border border-(--border) bg-(--surface) shadow-[0_18px_45px_rgba(0,0,0,0.16)] transition duration-300 hover:-translate-y-1 hover:scale-[1.015] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)",
        className,
      )}
    >
      <div className="relative aspect-2/3 overflow-hidden">
        <Image
          src={item.posterUrl}
          alt={item.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 240px"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/88 via-black/18 to-transparent opacity-95 transition group-hover:opacity-100" />
        <div className="absolute left-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-white/90 text-slate-950 shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition duration-300 group-hover:scale-105">
          <Play className="h-4 w-4 fill-current" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <div className="mb-2 flex flex-wrap gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/72">
            <span>{item.year}</span>
            <span>•</span>
            <span>{item.rating}</span>
            {item.resolution ? (
              <>
                <span>•</span>
                <span>{item.resolution}</span>
              </>
            ) : null}
          </div>
          <h3 className="text-lg font-semibold leading-tight">{item.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/78">{item.overview}</p>
          {typeof item.progress === "number" ? (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs text-white/68">
                <span>Continue watching</span>
                <span>{item.progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/18">
                <div className="h-full rounded-full bg-(--accent)" style={{ width: `${item.progress}%` }} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}