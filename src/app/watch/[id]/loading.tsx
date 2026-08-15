import { SkeletonBlock } from "@/components/media/MediaSkeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-black">
      <div className="mx-auto max-w-6xl space-y-6 px-4 pb-24 pt-20 sm:px-8 sm:pt-24 lg:px-12">
        <div className="space-y-3">
          <SkeletonBlock className="h-9 w-20 rounded-full" />
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-32 bg-white/10" />
            <SkeletonBlock className="h-9 w-1/2 bg-white/10" />
          </div>
        </div>
        <SkeletonBlock className="aspect-video w-full rounded-2xl bg-white/5" />
      </div>
    </main>
  );
}