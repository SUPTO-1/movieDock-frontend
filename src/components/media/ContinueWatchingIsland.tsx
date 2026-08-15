"use client";

import { useSyncExternalStore } from "react";
import { ContinueWatchingRow } from "@/components/media/ContinueWatchingRow";
import {
  EMPTY_CONTINUE_WATCHING,
  loadContinueWatching,
  subscribeToContinueWatching,
} from "@/lib/continueWatching";

export function ContinueWatchingIsland() {
  const items = useSyncExternalStore(
    subscribeToContinueWatching,
    () => loadContinueWatching(20),
    () => EMPTY_CONTINUE_WATCHING,
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <ContinueWatchingRow
      title="Continue Watching"
      description="Pick up exactly where you left off — movies and series you've started in the last 15 days."
      items={items}
    />
  );
}
