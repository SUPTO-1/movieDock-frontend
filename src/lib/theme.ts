export type ThemeMode = "light" | "dark" | "system";
export type Theme = "light" | "dark";

export const STORAGE_KEY_MODE = "moviedock-theme-mode";
export const STORAGE_KEY_LEGACY = "moviedock-theme";

const isBrowser = () => typeof window !== "undefined";

export function readStoredMode(): ThemeMode | null {
  if (!isBrowser()) return null;
  const mode = window.localStorage.getItem(STORAGE_KEY_MODE);
  if (mode === "light" || mode === "dark" || mode === "system") return mode;
  return null;
}

export function readStoredLegacy(): Theme | null {
  if (!isBrowser()) return null;
  const legacy = window.localStorage.getItem(STORAGE_KEY_LEGACY);
  if (legacy === "light" || legacy === "dark") return legacy;
  return null;
}

export function resolveTheme(): Theme {
  // Guarded for SSR — `useState` initializers and module-level `useMemo`
  // call this on the server, where `window` doesn't exist. The pre-hydration
  // value is irrelevant; the client effect re-resolves on mount.
  if (!isBrowser()) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveMode(mode: ThemeMode): Theme {
  return mode === "system" ? resolveTheme() : mode;
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function persistMode(mode: ThemeMode) {
  if (!isBrowser()) return;
  if (mode === "system") {
    window.localStorage.removeItem(STORAGE_KEY_MODE);
  } else {
    window.localStorage.setItem(STORAGE_KEY_MODE, mode);
  }
}

export function persistLegacy(theme: Theme) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY_LEGACY, theme);
}
