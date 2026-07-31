import { Settings2, SlidersHorizontal, Shield } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

const settingsGroups = [
  {
    icon: SlidersHorizontal,
    title: "Playback",
    description: "Default quality, autoplay behavior, and progress handling.",
  },
  {
    icon: Shield,
    title: "Privacy",
    description: "Local session preferences, server access, and account visibility.",
  },
];

export default function SettingsPage() {
  return (
    <AppShell>
      <section className="space-y-6">
        <div className="rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-(--border) bg-(--surface-elevated) px-4 py-2 text-sm font-medium text-(--foreground)">
                <Settings2 className="h-4 w-4" />
                Settings
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-(--foreground) sm:text-5xl">Tune the MovieDock experience</h1>
              <p className="max-w-3xl text-sm text-(--muted) sm:text-base">
                The route exists now, so the navbar link no longer lands on a missing page.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {settingsGroups.map((group) => {
            const Icon = group.icon;

            return (
              <article key={group.title} className="rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-(--accent)/12 text-(--accent)">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold text-(--foreground)">{group.title}</h2>
                <p className="mt-2 text-sm leading-6 text-(--muted)">{group.description}</p>
              </article>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}