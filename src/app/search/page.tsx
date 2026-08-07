import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/media/EmptyState";
import { MediaRow } from "@/components/media/MediaRow";
import { searchMediaItems } from "@/lib/backend";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const items = query ? await searchMediaItems(query, 60) : [];

  return (
    <AppShell>
      <section className="space-y-6">
        <header className="flex items-center gap-3 rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:p-8">
          <div className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-(--accent)/12 text-(--accent)">
            <Search className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-(--accent)">Search</p>
            <h1 className="text-2xl font-semibold text-(--foreground) sm:text-3xl">
              {query ? <>Results for &ldquo;{query}&rdquo;</> : "Find titles across the catalog"}
            </h1>
            {query ? (
              <p className="mt-1 text-sm text-(--muted)">
                {items.length} {items.length === 1 ? "match" : "matches"} from your Jellyfin library
              </p>
            ) : (
              <p className="mt-1 text-sm text-(--muted)">
                Use the search bar in the navigation to look up a movie, series, or anime by title.
              </p>
            )}
          </div>
        </header>

        {query && items.length === 0 ? (
          <EmptyState
            variant="no-matches"
            title="No results"
            description={`We couldn't find anything matching "${query}". Try a different keyword, or refresh your library if you just added media.`}
          />
        ) : null}

        {items.length > 0 ? (
          <MediaRow
            title={query ? `Results for “${query}”` : "Browse the catalog"}
            description="Movies and series from your Jellyfin library"
            items={items}
          />
        ) : null}
      </section>
    </AppShell>
  );
}