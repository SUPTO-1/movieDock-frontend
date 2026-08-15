"use client";

import { useRef } from "react";
import { Film, ImagePlus, Tv } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { MediaUploadKind } from "@/lib/routes";

type AddMediaButtonProps = {
  kind: MediaUploadKind;
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
};

const COPY: Record<
  MediaUploadKind,
  { label: string; accept: string; description: string; icon: typeof ImagePlus }
> = {
  photos: {
    label: "+ Add Photos",
    accept: "image/*",
    description: "Pick photos from your device",
    icon: ImagePlus,
  },
  movies: {
    label: "+ Add Movies",
    accept: "video/*",
    description: "Pick movie files from your device",
    icon: Film,
  },
  series: {
    label: "+ Add Episodes",
    accept: "video/*",
    description: "Pick episode files from your device",
    icon: Tv,
  },
  anime: {
    label: "+ Add Anime",
    accept: "video/*",
    description: "Pick anime files from your device",
    icon: Film,
  },
};

/**
 * Triggers the native file picker. We use a hidden `<input type="file">`
 * rather than the File System Access API because the latter is desktop-Chromium
 * only and breaks on Safari (iOS), Firefox, and most TV browsers.
 *
 * `accept` is set per kind so mobile pickers jump straight to the relevant
 * media library (photos vs videos).
 */
export function AddMediaButton({ kind, onFilesSelected, disabled = false }: AddMediaButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const copy = COPY[kind];
  const Icon = copy.icon;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={copy.accept}
        multiple
        className="hidden"
        onChange={(event) => {
          const fileList = event.target.files;
          if (!fileList || fileList.length === 0) return;
          onFilesSelected(Array.from(fileList));
          // Reset so picking the same files again still fires onChange.
          event.target.value = "";
        }}
      />
      <Button
        variant="primary"
        size="md"
        disabled={disabled}
        leadingIcon={<Icon className="h-5 w-5" />}
        onClick={() => inputRef.current?.click()}
      >
        {copy.label}
      </Button>
    </>
  );
}