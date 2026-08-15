import { AppShell } from "@/components/layout/AppShell";
import { RowSkeleton } from "@/components/media/MediaSkeleton";

export default function Loading() {
  return (
    <AppShell>
      <section className="space-y-6">
        <div className="rounded-4xl border border-border-themed bg-surface p-6 sm:p-8">
          <div className="h-12 w-12 animate-pulse rounded-2xl bg-accent-soft" />
          <div className="mt-3 h-3 w-24 animate-pulse rounded-md bg-surface-elevated" />
          <div className="mt-3 h-7 w-1/3 animate-pulse rounded-md bg-surface-elevated" />
        </div>
        <RowSkeleton count={8} />
      </section>
    </AppShell>
  );
}