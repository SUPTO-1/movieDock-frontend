"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/types/media";

type PhotoGalleryProps = {
  photos: MediaItem[];
};

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const isOpen = activeIndex !== null;
  const activePhoto = isOpen ? photos[activeIndex] : null;

  const orderedPhotos = useMemo(() => photos, [photos]);

  const close = () => setActiveIndex(null);
  const next = () =>
    setActiveIndex((index) => (index === null ? null : (index + 1) % orderedPhotos.length));
  const previous = () =>
    setActiveIndex((index) =>
      index === null ? null : (index - 1 + orderedPhotos.length) % orderedPhotos.length,
    );

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      } else if (event.key === "ArrowRight") {
        next();
      } else if (event.key === "ArrowLeft") {
        previous();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <div
        className={cn(
          "grid gap-3",
          "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
          "auto-rows-[160px] sm:auto-rows-[180px] lg:auto-rows-[200px]",
        )}
      >
        {orderedPhotos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="group relative overflow-hidden rounded-xl border border-border-themed bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={`Open preview for ${photo.title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.posterUrl}
              alt={photo.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-x-0 bottom-0 line-clamp-1 bg-gradient-to-t from-black/80 to-transparent px-3 py-2 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
              {photo.title}
            </span>
          </button>
        ))}
      </div>

      {activePhoto && isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo preview for ${activePhoto.title}`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={close}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              close();
            }}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close photo preview"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              previous();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              next();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <figure
            className="relative max-h-[88vh] max-w-[92vw]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePhoto.backdropUrl || activePhoto.posterUrl}
              alt={activePhoto.title}
              className="max-h-[88vh] w-auto max-w-[92vw] rounded-lg object-contain shadow-2xl"
            />
            <figcaption className="mt-3 text-center text-sm font-medium text-white/80">
              {activePhoto.title}
            </figcaption>
          </figure>
        </div>
      ) : null}
    </>
  );
}
