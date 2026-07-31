"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (resolvedTheme ?? theme) === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-(--border) bg-(--surface) px-4 text-sm font-medium text-(--foreground) transition duration-200 hover:bg-(--surface-elevated) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
      aria-label="Toggle theme"
    >
      {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
      <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}