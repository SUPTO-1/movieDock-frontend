import { AppShell } from "@/components/layout/AppShell";
import { SkeletonBlock } from "@/components/media/MediaSkeleton";

export default function Loading() {
  return (
    <AppShell>
      <section className="space-y-6">
        <div className="rounded-4xl border border-border-themed bg-surface p-6 sm:p-10">
          <SkeletonBlock className="h-6 w-32" />
          <SkeletonBlock className="mt-4 h-9 w-2/3" />
          <SkeletonBlock className="mt-3 h-4 w-1/2" />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="rounded-4xl border border-border-themed bg-surface p-6"
            >
              <SkeletonBlock className="h-12 w-12 rounded-2xl" />
              <SkeletonBlock className="mt-4 h-5 w-1/3" />
              <SkeletonBlock className="mt-2 h-4 w-5/6" />
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}