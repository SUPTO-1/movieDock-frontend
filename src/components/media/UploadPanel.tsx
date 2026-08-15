"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Upload, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { refreshLibrary, UploadCancelledError, uploadFiles, type UploadController, type UploadOutcome, type UploadProgress } from "@/lib/backend";
import type { MediaUploadKind } from "@/lib/routes";

type PendingFile = {
  /** Stable fieldname used as the multipart part name — matches the server's response. */
  fieldName: string;
  file: File;
  status: "waiting" | "uploading" | "done" | "rejected" | "error";
  progress: number;
  loaded: number;
  message?: string;
};

type Phase = "idle" | "uploading" | "done" | "cancelled" | "error";

type UploadPanelProps = {
  kind: MediaUploadKind;
  files: File[];
  onDismiss?: () => void;
};

/** Singular/plural copy shown in the panel heading and the start button. */
const KIND_COPY: Record<MediaUploadKind, { singular: string; plural: string }> = {
  photos: { singular: "Photo", plural: "Photos" },
  movies: { singular: "Movie", plural: "Movies" },
  series: { singular: "Episode", plural: "Episodes" },
  anime: { singular: "Anime", plural: "Anime" },
};

/** Per-row status label for the right-hand column of the file list. */
const STATUS_LABEL: Record<PendingFile["status"], string> = {
  waiting: "waiting",
  uploading: "",
  done: "saved",
  rejected: "",
  error: "",
};

function buildPending(files: File[]): PendingFile[] {
  return files.map((file, index) => ({
    fieldName: `files[${index}]`,
    file,
    status: "waiting" as const,
    progress: 0,
    loaded: 0,
  }));
}

export function UploadPanel({ kind, files, onDismiss }: UploadPanelProps) {
  const copy = KIND_COPY[kind];
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingFile[]>(() => buildPending(files));
  const controllerRef = useRef<UploadController | null>(null);

  const totalBytes = useMemo(() => pending.reduce((sum, p) => sum + p.file.size, 0), [pending]);
  const uploadedBytes = useMemo(() => pending.reduce((sum, p) => sum + p.loaded, 0), [pending]);
  const aggregateProgress = totalBytes > 0 ? Math.min(1, uploadedBytes / totalBytes) : 0;

  // Coalesce per-tick XHR progress updates to one React render per animation
  // frame — without this, Chrome can fire 60+ events/sec during a LAN upload.
  const rafPending = useRef<number | null>(null);
  const applyProgress = useCallback((progress: UploadProgress) => {
    if (!progress.total) return;
    if (rafPending.current !== null) return;
    rafPending.current = requestAnimationFrame(() => {
      rafPending.current = null;
      setPending((current) => {
        let allocated = 0;
        return current.map((entry) => {
          if (entry.status !== "uploading") return entry;
          const loaded = Math.max(0, Math.min(entry.file.size, progress.loaded - allocated));
          allocated += entry.file.size;
          return {
            ...entry,
            loaded,
            progress: entry.file.size > 0 ? loaded / entry.file.size : 0,
          };
        });
      });
    });
  }, []);

  // Cancel any pending RAF if the panel unmounts mid-frame.
  useEffect(() => {
    return () => {
      if (rafPending.current !== null) {
        cancelAnimationFrame(rafPending.current);
        rafPending.current = null;
      }
    };
  }, []);

  const start = useCallback(() => {
    setPhase("uploading");
    setErrorMessage(null);
    setPending(buildPending(files).map((p) => ({ ...p, status: "uploading" as const })));

    const controller = uploadFiles(kind, files, applyProgress);
    controllerRef.current = controller;

    void controller.promise
      .then((response) => {
        setPhase("done");
        setPending((current) => {
          const byField = new Map<string, UploadOutcome>();
          for (const outcome of response.results) byField.set(outcome.fieldName, outcome);
          return current.map((entry) => {
            const outcome = byField.get(entry.fieldName);
            if (!outcome) {
              return { ...entry, status: "done", progress: 1, loaded: entry.file.size };
            }
            if (outcome.status === "ok") {
              return { ...entry, status: "done", progress: 1, loaded: entry.file.size };
            }
            return {
              ...entry,
              status: outcome.status === "rejected" ? "rejected" : "error",
              message: outcome.reason,
              progress: 0,
            };
          });
        });
        if (response.summary.ok > 0) {
          void refreshLibrary();
        }
      })
      .catch((error: unknown) => {
        if (error instanceof UploadCancelledError) {
          setPhase("cancelled");
          setPending((current) =>
            current.map((p) => (p.status === "uploading" ? { ...p, status: "rejected", message: "Cancelled" } : p)),
          );
          return;
        }
        const message = error instanceof Error ? error.message : "Upload failed";
        setErrorMessage(message);
        setPhase("error");
        setPending((current) =>
          current.map((p) => (p.status === "uploading" ? { ...p, status: "error", message } : p)),
        );
      });
  }, [kind, files, applyProgress]);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  if (files.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border-themed bg-surface-elevated p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Upload {files.length} {files.length === 1 ? copy.singular.toLowerCase() : copy.plural.toLowerCase()}
          </h2>
          <p className="mt-1 text-xs text-muted">
            Streaming directly to your MovieDock SSD over your local network.
          </p>
        </div>
        {phase === "idle" && onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss upload"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface" aria-hidden="true">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-200 ease-linear"
          style={{ width: `${Math.round(aggregateProgress * 100)}%` }}
        />
      </div>

      <ul className="mt-4 max-h-72 space-y-1 overflow-y-auto pr-1 text-sm">
        {pending.map((entry) => (
          <li key={entry.fieldName} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-surface/60">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted">
              {entry.status === "done" ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : entry.status === "uploading" ? (
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
              ) : entry.status === "rejected" || entry.status === "error" ? (
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              ) : (
                <span className="block h-2 w-2 rounded-full bg-muted" />
              )}
            </span>
            <span className="flex-1 truncate text-foreground">{entry.file.name}</span>
            <span className="w-28 truncate text-right text-xs tabular-nums text-muted">
              {entry.status === "uploading"
                ? `${Math.round(entry.progress * 100)}%`
                : STATUS_LABEL[entry.status] || entry.message || "failed"}
            </span>
          </li>
        ))}
      </ul>

      {errorMessage ? (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {phase === "idle" ? (
          <Button
            variant="primary"
            size="md"
            leadingIcon={<Upload className="h-4 w-4" />}
            onClick={start}
          >
            Upload {files.length} {files.length === 1 ? copy.singular : copy.plural}
          </Button>
        ) : phase === "uploading" ? (
          <Button variant="secondary" size="md" onClick={cancel}>
            Cancel upload
          </Button>
        ) : phase === "done" ? (
          <Button variant="primary" size="md" onClick={onDismiss}>
            Done
          </Button>
        ) : null}
      </div>
    </div>
  );
}
