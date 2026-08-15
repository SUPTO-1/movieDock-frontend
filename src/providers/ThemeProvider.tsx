"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  applyTheme,
  persistLegacy,
  readStoredLegacy,
  readStoredMode,
  resolveTheme,
  type Theme,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const mode = readStoredMode();
    if (mode === "light" || mode === "dark") return mode;
    if (mode === "system") return resolveTheme();
    return readStoredLegacy() ?? resolveTheme();
  });

  const lastAppliedRef = useRef<Theme | null>(null);

  useEffect(() => {
    if (lastAppliedRef.current === theme) return;
    lastAppliedRef.current = theme;
    applyTheme(theme);
    persistLegacy(theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme: theme, setTheme }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return context;
}
