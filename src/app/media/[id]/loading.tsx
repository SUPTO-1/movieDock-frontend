import { AppShell } from "@/components/layout/AppShell";
import { HeroSkeleton, RowSkeleton, SkeletonBlock } from "@/components/media/MediaSkeleton";

export default function Loading() {
  return (
    <AppShell>
      <div className="space-y-12">
        <HeroSkeleton />
        <div className="mx-auto max-w-[1600px] space-y-12 px-4 pb-12 sm:px-6 lg:px-8">
          <section className="rounded-3xl border border-border-themed bg-surface p-6 sm:p-8">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="mt-3 h-5 w-full" />
            <SkeletonBlock className="mt-2 h-5 w-11/12" />
            <SkeletonBlock className="mt-2 h-5 w-9/12" />
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonBlock key={index} className="h-6 w-20 rounded-full" />
              ))}
            </div>
          </section>
          <RowSkeleton count={6} />
        </div>
      </div>
    </AppShell>
  );
}