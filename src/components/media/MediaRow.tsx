"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MediaItem } from "@/types/media";
import { MediaCard } from "@/components/media/MediaCard";

type MediaRowProps = {
  title: string;
  description?: string;
  items: MediaItem[];
  href?: string;
};

export function MediaRow({ title, description, items, href }: MediaRowProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const nextLeft = scrollLeft > 4;
    const nextRight = scrollLeft + clientWidth < scrollWidth - 4;
    setShowLeft((prev) => (prev === nextLeft ? prev : nextLeft));
    setShowRight((prev) => (prev === nextRight ? prev : nextRight));
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows, items.length]);

  const scrollBy = (direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
          {description ? <p className="mt-1 max-w-3xl text-sm text-muted">{description}</p> : null}
        </div>
        {href ? (
          <Link
            href={href}
            className="inline-flex h-9 items-center gap-1 text-sm font-medium text-accent transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Explore all
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      <div className="group/row relative">
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
        >
          {items.slice(0, 30).map((item) => (
            <MediaCard key={item.id} item={item} showRail />
          ))}
        </div>

        {showLeft ? (
          <button
            type="button"
            onClick={() => scrollBy("left")}
            aria-label="Scroll left"
            className="absolute left-0 top-1/2 -translate-y-1/2 hidden h-full items-center bg-gradient-to-r from-background/90 via-background/60 to-transparent px-3 text-foreground opacity-0 transition group-hover/row:opacity-100 md:flex"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
        ) : null}
        {showRight ? (
          <button
            type="button"
            onClick={() => scrollBy("right")}
            aria-label="Scroll right"
            className="absolute right-0 top-1/2 -translate-y-1/2 hidden h-full items-center bg-gradient-to-l from-background/90 via-background/60 to-transparent px-3 text-foreground opacity-0 transition group-hover/row:opacity-100 md:flex"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        ) : null}
      </div>
    </section>
  );
}