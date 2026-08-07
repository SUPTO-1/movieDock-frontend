import Link from "next/link";
import { Film, Search, WifiOff, Sparkles } from "lucide-react";

type EmptyStateProps = {
  variant: "offline" | "no-matches" | "no-content";
  title: string;
  description?: string;
  action?: { href: string; label: string };
  icon?: React.ReactNode;
};

function defaultIcon(variant: EmptyStateProps["variant"]) {
  if (variant === "offline") {
    return <WifiOff className="h-10 w-10" />;
  }
  if (variant === "no-matches") {
    return <Search className="h-10 w-10" />;
  }
  return <Film className="h-10 w-10" />;
}

export function EmptyState({ variant, title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-(--border) bg-(--surface) px-8 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-(--accent-soft) text-(--accent)">
        {icon ?? defaultIcon(variant)}
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-(--accent)">
          {variant === "offline" ? "Disconnected" : variant === "no-matches" ? "No matches" : "Nothing here yet"}
        </p>
        <h3 className="text-xl font-semibold text-(--foreground)">{title}</h3>
        {description ? <p className="mx-auto max-w-md text-sm text-(--muted)">{description}</p> : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-(--foreground) px-5 text-sm font-semibold text-(--background) transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
        >
          <Sparkles className="h-4 w-4" />
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
