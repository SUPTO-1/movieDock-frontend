import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared surface primitive. Three variants:
 *
 *  - `default`: bordered, surface background, used for content blocks
 *    (panels, settings groups, synopsis sections).
 *  - `elevated`: same border, but with a stronger shadow for cards that
 *    sit above other content (collection-page header).
 *  - `interactive`: adds hover/active states for clickable cards.
 *
 * Cards are intentionally not buttons — when a card needs to be
 * clickable, wrap it in a `<Link>` or add an interactive handler in the
 * consumer. This keeps `<a>` / `<button>` semantics intact for screen
 * readers.
 */

type CardVariant = "default" | "elevated" | "interactive";

const variantClasses: Record<CardVariant, string> = {
  default:
    "border border-border-themed bg-surface shadow-sm",
  elevated:
    "border border-border-themed bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_60px_rgba(15,23,42,0.08)]",
  interactive:
    "border border-border-themed bg-surface shadow-sm transition hover:bg-surface-elevated hover:shadow-md focus-within:ring-2 focus-within:ring-accent",
};

const radiusClasses = {
  sm: "rounded-lg",
  md: "rounded-2xl",
  lg: "rounded-3xl",
  xl: "rounded-4xl",
} as const;

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  radius?: keyof typeof radiusClasses;
  /** Optional eyebrow / kicker line rendered above the title. */
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
};

export function Card({
  variant = "default",
  radius = "xl",
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(variantClasses[variant], radiusClasses[radius], className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * Convenience wrapper for the standard "eyebrow + title + description"
 * header that the app uses in dozens of places (collection pages,
 * settings, search results). Keeps the spacing consistent.
 */
export function CardHeader({
  eyebrow,
  title,
  description,
  trailing,
  className,
}: {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4", className)}>
      <div className="min-w-0 flex-1 space-y-3">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-accent">{eyebrow}</p>
        ) : null}
        {title ? (
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">{title}</h1>
        ) : null}
        {description ? (
          <p className="max-w-3xl text-sm text-muted sm:text-base">{description}</p>
        ) : null}
      </div>
      {trailing ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 self-start sm:self-end">{trailing}</div>
      ) : null}
    </div>
  );
}