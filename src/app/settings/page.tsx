import type { ReactNode } from "react";
import { Info, Paintbrush, Server } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ThemePicker } from "@/components/layout/ThemePicker";
import { Card } from "@/components/ui/Card";

function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card variant="default" radius="xl" className="p-6 sm:p-8">
      <div className="mb-5 flex items-start gap-3">
        <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-accent/15 text-accent">
          {icon}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted">{description}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

export default function SettingsPage() {
  const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:5000";

  return (
    <AppShell>
      <section className="space-y-6">
        <Card variant="elevated" radius="xl" className="p-6 sm:p-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-themed bg-surface-elevated px-4 py-2 text-sm font-medium text-foreground">
              <Paintbrush className="h-4 w-4" />
              Settings
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Tune the MovieDock experience
            </h1>
            <p className="max-w-3xl text-sm text-muted sm:text-base">
              Adjust how MovieDock looks and which backend it talks to. Changes
              are saved in your browser; nothing here touches your Jellyfin
              server.
            </p>
          </div>
        </Card>

        <SettingsSection
          icon={<Paintbrush className="h-5 w-5" />}
          title="Appearance"
          description={
            <>
              Pick a theme. &ldquo;System&rdquo; follows your operating system
              preference automatically.
            </>
          }
        >
          <ThemePicker />
        </SettingsSection>

        <SettingsSection
          icon={<Server className="h-5 w-5" />}
          title="Connection"
          description={
            <>
              Where MovieDock looks for the Jellyfin proxy. Set
              <code className="mx-1 rounded bg-surface-elevated px-1.5 py-0.5 text-xs">BACKEND_URL</code>
              in <code className="mx-1 rounded bg-surface-elevated px-1.5 py-0.5 text-xs">.env.local</code>
              and restart the dev server to change it.
            </>
          }
        >
          <div className="rounded-2xl border border-border-themed bg-surface-elevated px-4 py-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.34em] text-muted">
              Backend URL
            </p>
            <p className="mt-1 break-all font-mono text-sm text-foreground">{backendUrl}</p>
          </div>
        </SettingsSection>

        <SettingsSection
          icon={<Info className="h-5 w-5" />}
          title="About"
          description="Personal media front-end backed by your own Jellyfin server. Built with Next.js and React."
        >
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-2xl border border-border-themed bg-surface-elevated px-4 py-3">
              <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.34em] text-muted">
                Stack
              </dt>
              <dd className="mt-1 font-semibold text-foreground">Next.js 16 · React 19</dd>
            </div>
            <div className="rounded-2xl border border-border-themed bg-surface-elevated px-4 py-3">
              <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.34em] text-muted">
                Source
              </dt>
              <dd className="mt-1 font-semibold text-foreground">Jellyfin (proxy)</dd>
            </div>
            <div className="rounded-2xl border border-border-themed bg-surface-elevated px-4 py-3">
              <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.34em] text-muted">
                Version
              </dt>
              <dd className="mt-1 font-semibold text-foreground">0.1.0</dd>
            </div>
          </dl>
        </SettingsSection>
      </section>
    </AppShell>
  );
}
