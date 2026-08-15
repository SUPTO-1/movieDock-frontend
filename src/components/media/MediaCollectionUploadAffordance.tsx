"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AddMediaButton } from "@/components/media/AddMediaButton";
import { UploadPanel } from "@/components/media/UploadPanel";
import { Button } from "@/components/ui/Button";
import { refreshLibrary } from "@/lib/backend";
import type { MediaUploadKind } from "@/lib/routes";

type StagedBatch = { id: number; files: File[] };

/**
 * Client-side host for the upload affordance on a collection page header.
 * Renders only the action buttons (Refresh + Add) — the `UploadPanel` is
 * intentionally NOT rendered here. The card-trailing slot is too narrow at
 * most breakpoints to host a wide progress panel; the page renders the
 * panel as a sibling of the header card so the layout stays tidy on TV,
 * mobile, and desktop.
 *
 * The page that uses this component is responsible for rendering the
 * `UploadPanel` (via `MediaCollectionUploadPanel`) and threading the
 * `batch` state between them. Keeping the button island and the panel as
 * siblings without a shared React parent would force them to be
 * independent, leaving the "Refresh/Add" buttons without a way to know
 * what the user picked.
 */
export function MediaCollectionUploadButtons({
  kind,
  onPick,
  isBatchActive,
}: {
  kind: MediaUploadKind;
  onPick: (files: File[]) => void;
  isBatchActive: boolean;
}) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshLibrary();
      router.refresh();
    } finally {
      setRefreshing(false);
    }
  }, [router]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="md" onClick={handleManualRefresh} disabled={refreshing || isBatchActive}>
        Refresh
      </Button>
      <AddMediaButton kind={kind} onFilesSelected={onPick} disabled={isBatchActive} />
    </div>
  );
}

export function MediaCollectionUploadPanel({
  kind,
  batch,
  onDismiss,
}: {
  kind: MediaUploadKind;
  batch: StagedBatch | null;
  onDismiss: () => void;
}) {
  if (!batch) return null;
  return (
    <div className="mt-6">
      <UploadPanel key={batch.id} kind={kind} files={batch.files} onDismiss={onDismiss} />
    </div>
  );
}
