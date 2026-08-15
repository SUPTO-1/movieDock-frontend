"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { MediaCard } from "@/components/media/MediaCard";
import { Button } from "@/components/ui/Button";
import type { MediaItem } from "@/types/media";

type MediaCollectionGridProps = {
  items: MediaItem[];
  /** Initial number of items to render. Subsequent "Load more" clicks
   *  add this many each time. */
  pageSize?: number;
};

export function MediaCollectionGrid({ items, pageSize = 20 }: MediaCollectionGridProps) {
  const [visible, setVisible] = useState(pageSize);

  if (items.length === 0) {
    return null;
  }

  const shown = items.slice(0, visible);
  const hasMore = visible < items.length;

  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map((item) => (
          <MediaCard key={item.id} item={item} className="h-full" />
        ))}
      </div>

      {hasMore ? (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            leadingIcon={<ChevronDown className="h-4 w-4" />}
            onClick={() => setVisible((value) => Math.min(value + pageSize, items.length))}
          >
            Load more
            <span className="text-xs text-muted">({items.length - visible} remaining)</span>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
