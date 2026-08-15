"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/media/EmptyState";
import { PhotoGallery } from "@/components/media/PhotoGallery";
import { AddMediaButton } from "@/components/media/AddMediaButton";
import { UploadPanel } from "@/components/media/UploadPanel";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { refreshLibrary } from "@/lib/backend";
import { homePath } from "@/lib/routes";
import type { MediaItem } from "@/types/media";

type PhotosPageProps = {
  photos: MediaItem[];
};

export function PhotosPage({ photos }: PhotosPageProps) {
  const router = useRouter();
  const [batch, setBatch] = useState<{ id: number; files: File[] } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handlePicked = useCallback((files: File[]) => {
    // Each new pick gets a fresh id so React unmounts the previous panel
    // and mounts a clean one — avoids setState-in-effect for batch changes.
    setBatch({ id: Date.now(), files });
  }, []);

  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshLibrary();
      router.refresh();
    } finally {
      setRefreshing(false);
    }
  }, [router]);

  const dismissStaged = useCallback(() => setBatch(null), []);

  return (
    <AppShell>
      <section className="space-y-6 sm:space-y-8">
        <Card variant="elevated" radius="xl" className="p-5 sm:p-8">
          <CardHeader
            eyebrow="Library / Photos"
            title="Photos"
            description="Browse and preview images from your Jellyfin photo library."
            trailing={
              <>
                <Button variant="secondary" size="md" onClick={handleManualRefresh} disabled={refreshing}>
                  Refresh
                </Button>
                <AddMediaButton kind="photos" onFilesSelected={handlePicked} disabled={batch !== null} />
              </>
            }
          />
        </Card>

        {batch ? (
          <UploadPanel key={batch.id} kind="photos" files={batch.files} onDismiss={dismissStaged} />
        ) : null}

        {photos.length > 0 ? (
          <PhotoGallery photos={photos} />
        ) : (
          <EmptyState
            variant="no-content"
            title="No photos found"
            description={
              <span>
                Add a photo library to Jellyfin, refresh your library, and your images will appear
                here automatically. Or tap <b>+ Add Photos</b> to upload from your phone or TV.
              </span>
            }
            action={{ href: homePath(), label: "Back to home" }}
          />
        )}
      </section>
    </AppShell>
  );
}
