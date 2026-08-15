"use client";

import { useEffect, useState } from "react";
import { Check, MoonStar, SunMedium, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  applyTheme,
  persistMode,
  readStoredMode,
  resolveMode,
  resolveTheme,
  type ThemeMode,
} from "@/lib/theme";

const options: { value: ThemeMode; label: string; icon: typeof SunMedium; description: string }[] = [
  { value: "light", label: "Light", icon: SunMedium, description: "Bright surfaces" },
  { value: "dark", label: "Dark", icon: MoonStar, description: "Cinematic dark mode" },
  { value: "system", label: "System", icon: Monitor, description: "Match your OS preference" },
];

// SSR-safe default so the server-rendered HTML and the first client render
// agree. The stored value is hydrated from `localStorage` in an effect after
// mount to avoid a hydration mismatch.
const DEFAULT_MODE: ThemeMode = "system";

export function ThemePicker() {
  const [mode, setMode] = useState<ThemeMode>(DEFAULT_MODE);
  const resolved = resolveMode(mode);

  // Pick up the stored mode after mount (avoids reading `localStorage` during
  // the initial render, which would diverge between server and client).
  useEffect(() => {
    const stored = readStoredMode();
    if (stored && stored !== DEFAULT_MODE) setMode(stored);
  }, []);

  // Sync the resolved value into the document on mount and on any user pick.
  // ThemeProvider owns the same DOM write from the legacy key; we skip the
  // write here when mode is explicit so we don't double-mutate `<html>`.
  useEffect(() => {
    if (mode !== "system") {
      persistMode(mode);
      return;
    }
    persistMode(mode);
    applyTheme(resolved);
  }, [mode, resolved]);

  // When in `system` mode, follow the OS preference live.
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = resolveTheme();
      if (document.documentElement.classList.contains("dark") === (next === "dark")) return;
      applyTheme(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = option.value === mode;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setMode(option.value)}
            aria-pressed={isActive}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              isActive
                ? "border-accent bg-accent-soft"
                : "border-border-themed bg-surface hover:bg-surface-elevated",
            )}
          >
            <span
              className={cn(
                "inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl",
                isActive ? "bg-accent text-white" : "bg-surface-elevated text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {option.label}
                {isActive ? <Check className="h-3.5 w-3.5 text-accent" /> : null}
              </span>
              <span className="block text-xs text-muted">{option.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
