import Link from "next/link";
import { Film, Search, WifiOff, PlugZap, Sparkles } from "lucide-react";

type EmptyStateProps = {
  variant: "offline" | "no-matches" | "no-content";
  tone?: "default" | "warning";
  title: string;
  description?: React.ReactNode;
  hint?: string;
  action?: { href: string; label: string };
  icon?: React.ReactNode;
};

const defaultIcon = {
  offline: WifiOff,
  "no-matches": Search,
  "no-content": Film,
};

const toneClass = {
  default: {
    container: "border-dashed border-border-themed bg-surface",
    icon: "bg-accent-soft text-accent",
    eyebrow: "text-accent",
  },
  warning: {
    container: "border-dashed border-amber-500/40 bg-amber-500/5",
    icon: "bg-amber-500/15 text-amber-500",
    eyebrow: "text-amber-500",
  },
} as const;

const eyebrowText = {
  offline: "Disconnected",
  "no-matches": "No matches",
  "no-content": "Nothing here yet",
} as const;

export function EmptyState({ variant, tone = "default", title, description, hint, action, icon }: EmptyStateProps) {
  const ToneIcon = tone === "warning" ? PlugZap : defaultIcon[variant];
  const palette = toneClass[tone];

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 rounded-3xl border px-8 py-16 text-center ${palette.container}`}
    >
      <div className={`flex h-16 w-16 items-center justify-center rounded-full ${palette.icon}`}>
        {icon ?? <ToneIcon className="h-8 w-8" />}
      </div>
      <div className="space-y-2">
        <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${palette.eyebrow}`}>
          {eyebrowText[variant]}
        </p>
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        {description ? <p className="mx-auto max-w-md text-sm text-muted">{description}</p> : null}
        {hint ? <p className="mx-auto max-w-md text-xs text-muted">{hint}</p> : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Sparkles className="h-4 w-4" />
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
