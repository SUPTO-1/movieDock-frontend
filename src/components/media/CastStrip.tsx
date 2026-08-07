import Image from "next/image";
import type { MediaItem } from "@/types/media";

type CastStripProps = {
  cast: NonNullable<MediaItem["cast"]>;
  eyebrow?: string;
};

export function CastStrip({ cast, eyebrow = "Cast & Crew" }: CastStripProps) {
  if (cast.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-(--accent)">{eyebrow}</p>
          <h2 className="mt-1 text-2xl font-semibold text-(--foreground)">People who made it</h2>
        </div>
        <p className="text-sm text-(--muted)">{cast.length} listed</p>
      </div>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {cast.map((person) => (
          <div key={person.id} className="flex w-28 flex-none snap-start flex-col items-center text-center sm:w-32">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border border-(--border) bg-(--surface-elevated) sm:h-28 sm:w-28">
              {person.imageUrl ? (
                <Image src={person.imageUrl} alt={person.name} fill unoptimized sizes="120px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-(--accent)">
                  {person.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <p className="mt-3 line-clamp-2 text-xs font-semibold text-(--foreground)">{person.name}</p>
            {person.role ? <p className="mt-0.5 line-clamp-2 text-[0.65rem] text-(--muted)">{person.role}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}