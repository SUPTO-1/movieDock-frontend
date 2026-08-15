"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, RefreshCw } from "lucide-react";
import { refreshLibrary } from "@/lib/backend";

type ScanState = "idle" | "scanning" | "done";

export function ScanLibraryButton() {
  const [state, setState] = useState<ScanState>("idle");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (state !== "scanning") return;
    // Jellyfin's /Library/Refresh is fire-and-forget — the backend doesn't return
    // a real progress number, so we animate an indeterminate bar over ~12 seconds
    // and then flash a "done" state for 2 seconds before going back to idle.
    let cancelled = false;
    setProgress(0);
    const totalMs = 12_000;
    const stepMs = 200;
    const tick = () => {
      if (cancelled) return;
      setProgress((value) => {
        const next = value + (stepMs / totalMs) * 100;
        if (next >= 100) {
          setState("done");
          setTimeout(() => {
            if (!cancelled) setState("idle");
          }, 2_000);
          return 100;
        }
        return next;
      });
    };
    const interval = setInterval(tick, stepMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [state]);

  const triggerScan = async () => {
    if (state !== "idle") return;
    setState("scanning");
    try {
      await refreshLibrary();
    } catch {
      setState("idle");
    }
  };

  const label =
    state === "scanning" ? "Scanning library" : state === "done" ? "Library updated" : "Scan library";

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={triggerScan}
        disabled={state !== "idle"}
        aria-label="Scan Jellyfin library"
        title="Scan Jellyfin library for new media"
        className="relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-full border border-border-themed bg-surface px-3 text-xs font-medium text-foreground transition hover:bg-surface-elevated disabled:cursor-progress disabled:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 transition-[width] duration-200 ease-linear"
          style={{
            width: `${state === "scanning" ? progress : state === "done" ? 100 : 0}%`,
            background:
              state === "done"
                ? "linear-gradient(90deg, rgba(16,185,129,0.18), rgba(16,185,129,0.32))"
                : "linear-gradient(90deg, rgba(225,29,72,0.12), rgba(225,29,72,0.28))",
          }}
        />
        <span className="relative inline-flex items-center gap-2">
          {state === "idle" ? (
            <RefreshCw className="h-4 w-4" />
          ) : state === "scanning" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4 text-emerald-400" />
          )}
          <span className="hidden lg:inline">{label}</span>
          {state === "scanning" ? (
            <span className="hidden rounded bg-accent/15 px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums text-accent lg:inline">
              {Math.min(99, Math.round(progress))}%
            </span>
          ) : null}
        </span>
      </button>
    </div>
  );
}