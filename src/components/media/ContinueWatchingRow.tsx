"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ContinueWatchingItem } from "@/types/media";
import { ContinueWatchingCard } from "@/components/media/ContinueWatchingCard";

type ContinueWatchingRowProps = {
  title: string;
  description?: string;
  items: ContinueWatchingItem[];
  href?: string;
};

export function ContinueWatchingRow({ title, description, items, href }: ContinueWatchingRowProps) {
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

  // The card does the actual removal via `clearProgress`. The row just
  // needs to know it happened so it can drop the focus to the next focusable
  // element in tab order, otherwise TV/keyboard users get stranded with no
  // focused card. We use a tiny ref-keyed lookup so the focus shift is
  // accurate even when the removed item was somewhere in the middle.
  const cardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const handleRemoved = useCallback((removed: ContinueWatchingItem) => {
    const removedKey = cardKey(removed);
    const remaining = items.filter((entry) => cardKey(entry) !== removedKey);
    if (remaining.length === 0) return; // Row will unmount; focus falls back to document.
    const removedIndex = items.findIndex((entry) => cardKey(entry) === removedKey);
    const fallbackIndex = removedIndex >= remaining.length ? remaining.length - 1 : removedIndex;
    const nextKey = cardKey(remaining[fallbackIndex]);
    // Wait one frame so React has removed the old card before we try to
    // focus the neighbour — otherwise the browser may refuse the focus.
    requestAnimationFrame(() => {
      const target = cardRefs.current.get(nextKey);
      if (!target) return;
      const focusable = target.querySelector<HTMLElement>(
        "a, button:not([aria-label^='Remove'])",
      );
      focusable?.focus();
    });
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-(--foreground) sm:text-2xl">{title}</h2>
          {description ? <p className="mt-1 max-w-3xl text-sm text-(--muted)">{description}</p> : null}
        </div>
        {href ? (
          <Link
            href={href}
            className="inline-flex h-9 items-center gap-1 text-sm font-medium text-(--accent) transition hover:text-(--foreground) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
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
          {items.map((entry) => {
            const key = cardKey(entry);
            return (
              <ContinueWatchingCard
                key={key}
                item={entry}
                onRemoved={handleRemoved}
                containerRef={(node) => {
                  // React invokes the ref callback with `null` on unmount;
                  // mirror that so we don't leak stale nodes in the map.
                  if (node) cardRefs.current.set(key, node);
                  else cardRefs.current.delete(key);
                }}
              />
            );
          })}
        </div>

        {showLeft ? (
          <button
            type="button"
            onClick={() => scrollBy("left")}
            aria-label="Scroll left"
            className="absolute left-0 top-1/2 -translate-y-1/2 hidden h-full items-center bg-gradient-to-r from-(--background)/90 via-(--background)/60 to-transparent px-3 text-(--foreground) opacity-0 transition group-hover/row:opacity-100 md:flex"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
        ) : null}
        {showRight ? (
          <button
            type="button"
            onClick={() => scrollBy("right")}
            aria-label="Scroll right"
            className="absolute right-0 top-1/2 -translate-y-1/2 hidden h-full items-center bg-gradient-to-l from-(--background)/90 via-(--background)/60 to-transparent px-3 text-(--foreground) opacity-0 transition group-hover/row:opacity-100 md:flex"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        ) : null}
      </div>
    </section>
  );
}

// Stable key for a Continue Watching entry — episodes collapse onto the
// parent series, movies use their own id. Matches the storage key in
// `continueWatching.ts` so removals look up the right slot.
function cardKey(entry: ContinueWatchingItem): string {
  return entry.episode?.id ? `series:${entry.media.id}` : `item:${entry.media.id}`;
}