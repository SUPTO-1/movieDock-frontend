import type { ReactElement } from "react";
import type { MediaItem, MediaType } from "@/types/media";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/media/EmptyState";
import { MediaCollectionPage } from "@/components/media/MediaCollectionPage";
import { getMediaItemsResult } from "@/lib/backend";

/** Initial fetch cap for collection pages. Sized so the Load-more affordance
 *  actually reveals something (two pages of 20 items), not so large that we
 *  pay for items the user never sees. */
export const COLLECTION_PAGE_LIMIT = 40;

export async function renderCollectionPage(
  slug: string,
  type: MediaType | "all",
): Promise<ReactElement> {
  const result = await getMediaItemsResult(type, COLLECTION_PAGE_LIMIT);
  if (result.status === "unreachable") {
    return (
      <AppShell>
        <EmptyState
          variant="offline"
          tone="warning"
          title="MovieDock backend is unreachable"
          description={
            <>
              The Next.js server can&rsquo;t reach the Jellyfin proxy. Make sure
              the backend is running and your <code className="rounded bg-surface-elevated px-1.5 py-0.5 text-xs">BACKEND_URL</code>
              {" "}environment variable points to it, then refresh.
            </>
          }
        />
      </AppShell>
    );
  }
  return (
    <MediaCollectionPage
      slug={slug}
      items={result.items satisfies MediaItem[]}
    />
  );
}


