import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/media/EmptyState";
import { MediaRow } from "@/components/media/MediaRow";
import { SearchFilters } from "@/components/media/SearchFilters";
import { Card } from "@/components/ui/Card";
import { searchMediaItems } from "@/lib/backend";
import { MEDIA_TYPES, type MediaType } from "@/types/media";

type SearchPageProps = {
  searchParams: Promise<{ q?: string; type?: string; genre?: string }>;
};

const SEARCHABLE_TYPES = new Set<MediaType>(MEDIA_TYPES.slice(0, 3) as MediaType[]);

function isMediaType(value: string | undefined): value is MediaType {
  return typeof value === "string" && SEARCHABLE_TYPES.has(value as MediaType);
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, type, genre } = await searchParams;
  const query = (q ?? "").trim();
  const typeFilter: MediaType | null = isMediaType(type) ? type : null;
  const genreFilter = (genre ?? "").trim();

  const items = query ? await searchMediaItems(query, 60) : [];

  // Filter in memory until the backend accepts filter params; fine for the
  // current 60-item cap.
  const filtered = items.filter((item) => {
    if (typeFilter && item.type !== typeFilter) return false;
    if (genreFilter && !item.genres?.some((g) => g.toLowerCase() === genreFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  const availableGenres = Array.from(
    new Set(items.flatMap((item) => item.genres ?? [])),
  )
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 12);

  return (
    <AppShell>
      <section className="space-y-6">
        <Card variant="elevated" radius="xl" className="flex items-center gap-3 p-6 sm:p-8">
          <div className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Search className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-accent">Search</p>
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
              {query ? <>Results for &ldquo;{query}&rdquo;</> : "Find titles across the catalog"}
            </h1>
            {query ? (
              <p className="mt-1 text-sm text-muted">
                {filtered.length} of {items.length}{" "}
                {items.length === 1 ? "match" : "matches"} from your Jellyfin library
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted">
                Use the search bar in the navigation to look up a movie, series, or anime by title.
              </p>
            )}
          </div>
        </Card>

        {query && items.length > 0 ? (
          <SearchFilters
            query={query}
            type={typeFilter}
            genre={genreFilter || null}
            availableGenres={availableGenres}
          />
        ) : null}

        {query && filtered.length === 0 ? (
          <EmptyState
            variant="no-matches"
            title="No results"
            description={
              typeFilter || genreFilter
                ? `No titles matched your query and filters. Try removing a filter or searching for something else.`
                : `We couldn't find anything matching "${query}". Try a different keyword, or refresh your library if you just added media.`
            }
          />
        ) : null}

        {filtered.length > 0 ? (
          <MediaRow
            title={query ? `Results for “${query}”` : "Browse the catalog"}
            description="Movies and series from your Jellyfin library"
            items={filtered}
          />
        ) : null}
      </section>
    </AppShell>
  );
}
