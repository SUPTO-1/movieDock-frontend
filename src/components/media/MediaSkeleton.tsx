import { AppShell } from "@/components/layout/AppShell";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-elevated ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

export { SkeletonBlock };

export function HeroSkeleton() {
  return (
    <div className="relative h-[64vh] min-h-[440px] w-full overflow-hidden">
      <SkeletonBlock className="absolute inset-0 rounded-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 px-6 pb-12 sm:px-10 sm:pb-14 lg:px-16 lg:pb-20">
        <div className="mx-auto max-w-4xl space-y-5">
          <SkeletonBlock className="h-3 w-32" />
          <SkeletonBlock className="h-12 w-3/4 sm:h-16" />
          <SkeletonBlock className="h-4 w-1/2" />
          <SkeletonBlock className="h-20 w-full max-w-3xl" />
          <div className="flex gap-3">
            <SkeletonBlock className="h-12 w-32 rounded-full" />
            <SkeletonBlock className="h-12 w-32 rounded-full" />
            <SkeletonBlock className="h-12 w-32 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <SkeletonBlock className="h-5 w-40" />
        <SkeletonBlock className="h-4 w-72 max-w-full" />
      </div>
      <div className="flex gap-3 overflow-hidden pb-4 sm:gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="min-w-[180px] flex-none sm:min-w-[210px] xl:min-w-[240px]"
          >
            <SkeletonBlock className="aspect-2/3 w-full rounded-md" />
            <SkeletonBlock className="mt-2 h-4 w-3/4" />
            <SkeletonBlock className="mt-1 h-3 w-1/2" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          <SkeletonBlock className="aspect-2/3 w-full rounded-md" />
          <SkeletonBlock className="mt-2 h-4 w-3/4" />
          <SkeletonBlock className="mt-1 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/**
 * Shared shimmer placeholders for routes that are waiting on Jellyfin.
 */
export function HomeSkeleton() {
  return (
    <AppShell flush>
      <div className="flex flex-col gap-10 lg:gap-14">
        <HeroSkeleton />
        <div className="mx-auto w-full max-w-[1600px] space-y-10 px-4 pb-12 sm:px-6 lg:px-8 lg:space-y-14">
          <RowSkeleton count={6} />
          <RowSkeleton count={6} />
          <RowSkeleton count={6} />
        </div>
      </div>
    </AppShell>
  );
}

export function CollectionSkeleton() {
  return (
    <AppShell>
      <section className="space-y-8">
        <div className="rounded-4xl border border-border-themed bg-surface p-6 sm:p-8">
          <SkeletonBlock className="h-3 w-32" />
          <SkeletonBlock className="mt-4 h-9 w-1/3" />
          <SkeletonBlock className="mt-3 h-4 w-2/3" />
        </div>
        <GridSkeleton />
      </section>
    </AppShell>
  );
}
