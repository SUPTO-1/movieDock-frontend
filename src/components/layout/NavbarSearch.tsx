"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X, Film, Tv } from "lucide-react";
import type { MediaItem } from "@/types/media";
import { searchMediaItems } from "@/lib/backend";
import { mediaPath } from "@/lib/routes";

const DEBOUNCE_MS = 250;

export function NavbarSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const items = await searchMediaItems(query.trim(), 12);
        if (!controller.signal.aborted) {
          setResults(items);
        }
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const goToSearchPage = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          goToSearchPage();
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--muted)" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search titles, genres, people"
          className="h-10 w-full rounded-full border border-(--border) bg-(--surface)/80 pl-11 pr-10 text-sm text-(--foreground) outline-none transition placeholder:text-(--muted) focus:border-(--accent) focus:bg-(--surface) focus:ring-2 focus:ring-(--accent-soft)"
          aria-label="Search"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-(--muted) transition hover:bg-(--surface-elevated) hover:text-(--foreground)"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </form>

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border border-(--border) bg-(--surface) shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
          {loading ? (
            <p className="px-4 py-3 text-xs text-(--muted)">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-xs text-(--muted)">No matches for "{query.trim()}"</p>
          ) : (
            <>
              <ul className="max-h-96 overflow-y-auto divide-y divide-(--border)">
                {results.map((item) => {
                  const Icon = item.type === "series" || item.type === "anime" ? Tv : Film;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          setQuery("");
                          router.push(mediaPath(item.id));
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-(--surface-elevated) focus-visible:bg-(--surface-elevated) focus-visible:outline-none"
                      >
                        <div className="relative h-12 w-9 flex-none overflow-hidden rounded-md bg-(--surface-elevated)">
                          {item.posterUrl ? (
                            <Image
                              src={item.posterUrl}
                              alt={item.title}
                              fill
                              unoptimized
                              sizes="36px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-medium text-(--foreground)">{item.title}</p>
                          <p className="flex items-center gap-1 text-[0.7rem] text-(--muted)">
                            <Icon className="h-3 w-3" />
                            <span className="capitalize">{item.type}</span>
                            <span>•</span>
                            <span>{item.year}</span>
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={goToSearchPage}
                className="block w-full border-t border-(--border) bg-(--surface-elevated) px-4 py-2 text-left text-xs font-semibold text-(--accent) transition hover:text-(--foreground)"
              >
                See all results for "{query.trim()}"
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}