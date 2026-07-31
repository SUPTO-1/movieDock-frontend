import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export default function SearchPage() {
  return (
    <AppShell>
      <section className="mx-auto flex max-w-4xl flex-col gap-6 rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:p-10">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-(--accent)/12 text-(--accent)">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-(--accent)">Search</p>
            <h1 className="text-2xl font-semibold text-(--foreground) sm:text-4xl">Find titles across the catalog</h1>
          </div>
        </div>

        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--muted)" />
          <input
            type="search"
            placeholder="Search movies, shows, or anime"
            className="h-12 w-full rounded-full border border-(--border) bg-(--surface-elevated) pl-11 pr-4 text-sm text-(--foreground) outline-none transition placeholder:text-(--muted) focus:border-(--accent) focus:ring-2 focus:ring-(--accent-soft)"
          />
        </label>

        <p className="text-sm text-(--muted)">Search results can be wired to the Jellyfin API later. The route is now in place.</p>
      </section>
    </AppShell>
  );
}