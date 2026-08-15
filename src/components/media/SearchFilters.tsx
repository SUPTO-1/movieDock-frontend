"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { MediaType } from "@/types/media";

type SearchFiltersProps = {
  query: string;
  type: MediaType | null;
  genre: string | null;
  availableGenres: string[];
};

const TYPE_OPTIONS: { value: MediaType; label: string }[] = [
  { value: "movie", label: "Movies" },
  { value: "series", label: "TV Shows" },
  { value: "anime", label: "Anime" },
];

export function SearchFilters({ query, type, genre, availableGenres }: SearchFiltersProps) {
  const router = useRouter();

  const buildHref = (nextType: MediaType | null, nextGenre: string | null) => {
    const params = new URLSearchParams();
    params.set("q", query);
    if (nextType) params.set("type", nextType);
    if (nextGenre) params.set("genre", nextGenre);
    return `/search?${params.toString()}`;
  };

  const chooseType = (value: MediaType | null) => {
    router.push(buildHref(value, genre));
  };

  const chooseGenre = (value: string | null) => {
    router.push(buildHref(type, value === genre ? null : value));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
          Type
        </span>
        <FilterChip active={type === null} onClick={() => chooseType(null)}>
          All
        </FilterChip>
        {TYPE_OPTIONS.map((option) => (
          <FilterChip
            key={option.value}
            active={type === option.value}
            onClick={() => chooseType(option.value)}
          >
            {option.label}
          </FilterChip>
        ))}
      </div>

      {availableGenres.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
            Genre
          </span>
          <FilterChip active={genre === null} onClick={() => chooseGenre(null)}>
            Any
          </FilterChip>
          {availableGenres.map((g) => (
            <FilterChip
              key={g}
              active={genre === g}
              onClick={() => chooseGenre(g)}
            >
              {g}
            </FilterChip>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        active
          ? "border-accent bg-accent text-white"
          : "border-border-themed bg-surface text-muted hover:border-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
