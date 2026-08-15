"use client";

import { useEffect, useState } from "react";
import { Loader2, PlugZap, ServerOff } from "lucide-react";
import { getBackendHealth, pingBackend, type BackendHealth } from "@/lib/backend";

const POLL_INTERVAL_MS = 30_000;

type ServerStatusState =
  | { kind: "checking" }
  | { kind: "backend-offline" }
  | { kind: "jellyfin-offline"; health: BackendHealth }
  | { kind: "online"; health: BackendHealth };

export function ServerStatus() {
  const [state, setState] = useState<ServerStatusState>({ kind: "checking" });

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const backendUp = await pingBackend();
      if (!backendUp) {
        if (!cancelled) setState({ kind: "backend-offline" });
        return;
      }

      try {
        const health = await getBackendHealth();
        if (cancelled) return;
        if (health.connected) {
          setState((prev) =>
            prev.kind === "online" && prev.health.serverName === health.serverName
              ? prev
              : { kind: "online", health },
          );
        } else {
          setState((prev) =>
            prev.kind === "jellyfin-offline" && prev.health.jellyfinUrl === health.jellyfinUrl
              ? prev
              : { kind: "jellyfin-offline", health },
          );
        }
      } catch {
        if (!cancelled) setState({ kind: "jellyfin-offline", health: { connected: false } });
      }
    };

    void check();
    const interval = setInterval(check, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (state.kind === "checking") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-border-themed bg-surface px-3 py-2 text-xs font-medium text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Checking…</span>
      </div>
    );
  }

  if (state.kind === "backend-offline") {
    return (
      <div
        title="Backend API is unreachable"
        className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-300"
      >
        <PlugZap className="h-3.5 w-3.5" />
        <span>Backend offline</span>
      </div>
    );
  }

  if (state.kind === "jellyfin-offline") {
    return (
      <div
        title={state.health.jellyfinUrl ?? "Jellyfin unreachable"}
        className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300"
      >
        <span className="h-2 w-2 rounded-full bg-rose-400" />
        <span className="max-w-[140px] truncate">Jellyfin offline</span>
        <ServerOff className="h-3 w-3" />
      </div>
    );
  }

  const { health } = state;
  return (
    <div
      title={health.jellyfinUrl ?? undefined}
      className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300"
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
      <span className="max-w-[160px] truncate">Movie dock Running</span>
    </div>
  );
}