import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared button primitive. Three variants:
 *
 *  - `primary`: filled accent background (Play, Watch, Submit). The single
 *    highest-contrast option on any page.
 *  - `secondary`: bordered surface button (More info, Cancel). Sits on top
 *    of any background.
 *  - `ghost`: transparent, used for low-emphasis actions (icon-only
 *    buttons in toolbars, theme toggle, back chevrons).
 *
 * Sizes are deliberately coarse (`sm` / `md` / `lg`) so we don't end up
 * with seven different heights scattered across the app.
 */

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white shadow-sm hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  secondary:
    "border border-border-themed bg-surface text-foreground hover:bg-surface-elevated focus-visible:ring-2 focus-visible:ring-accent",
  ghost:
    "text-foreground hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-7 text-base gap-2",
  icon: "h-10 w-10",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Render as a full-width block. Useful inside cards / dropdowns. */
  block?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    block = false,
    leadingIcon,
    trailingIcon,
    className,
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold transition focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        block && "w-full",
        className,
      )}
      {...rest}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
});