"use client";

import { useEffect, useRef } from "react";
import { Captions, Check, ChevronDown, Languages, Volume2 } from "lucide-react";
import type { MediaStream } from "@/types/media";

// ---------- helpers shared between the menu family ----------

export function trackLabel(stream: MediaStream) {
  return (
    stream.displayLanguage ||
    stream.language ||
    stream.title ||
    `${stream.codec ?? stream.type} #${stream.index}`
  );
}

export function audioSubtitle(stream: MediaStream) {
  if (stream.channels) {
    return `${stream.codec ?? "Audio"} · ${stream.channels}ch`;
  }
  return stream.codec ?? "Audio";
}

// ---------- TrackMenuGroup (audio + subtitle buttons rendered together) ----------

type TrackMenuGroupProps = {
  audioStreams: MediaStream[];
  subtitleStreams: MediaStream[];
  selectedAudio?: MediaStream;
  selectedSubtitle?: MediaStream;
  audioIndex: number | undefined;
  subtitleIndex: number | undefined;
  showAudioMenu: boolean;
  showSubtitleMenu: boolean;
  onToggleAudio: () => void;
  onToggleSubtitle: () => void;
  onCloseAudio: () => void;
  onCloseSubtitle: () => void;
  switchAudio: (index: number | undefined) => void;
  switchSubtitle: (index: number | undefined) => void;
  side?: "up" | "down";
};

export function TrackMenuGroup({
  audioStreams,
  subtitleStreams,
  selectedAudio,
  selectedSubtitle,
  audioIndex,
  subtitleIndex,
  showAudioMenu,
  showSubtitleMenu,
  onToggleAudio,
  onToggleSubtitle,
  onCloseAudio,
  onCloseSubtitle,
  switchAudio,
  switchSubtitle,
  side = "down",
}: TrackMenuGroupProps) {
  return (
    <>
      {audioStreams.length > 0 ? (
        <TrackMenu
          label={selectedAudio ? trackLabel(selectedAudio) : "Audio"}
          detail={selectedAudio ? audioSubtitle(selectedAudio) : undefined}
          icon={<Volume2 className="h-3.5 w-3.5" />}
          open={showAudioMenu}
          onToggle={onToggleAudio}
          onClose={onCloseAudio}
          side={side}
        >
          <MenuItem
            active={audioIndex === undefined}
            onClick={() => switchAudio(undefined)}
            title="Default"
            subtitle="Let Jellyfin choose"
            icon={audioIndex === undefined ? <Check className="h-4 w-4" /> : undefined}
          />
          {audioStreams.map((stream) => (
            <MenuItem
              key={`a-${stream.index}`}
              active={audioIndex === stream.index}
              onClick={() => switchAudio(stream.index)}
              title={trackLabel(stream)}
              subtitle={audioSubtitle(stream)}
              icon={audioIndex === stream.index ? <Check className="h-4 w-4" /> : undefined}
            />
          ))}
        </TrackMenu>
      ) : null}

      {subtitleStreams.length > 0 ? (
        <TrackMenu
          label={selectedSubtitle ? trackLabel(selectedSubtitle) : "Off"}
          detail={selectedSubtitle ? (selectedSubtitle.isForced ? "Forced" : "Subtitle") : undefined}
          icon={<Captions className="h-3.5 w-3.5" />}
          open={showSubtitleMenu}
          onToggle={onToggleSubtitle}
          onClose={onCloseSubtitle}
          side={side}
        >
          <MenuItem
            active={subtitleIndex === undefined}
            onClick={() => switchSubtitle(undefined)}
            title="Off"
            subtitle="No subtitles"
            icon={subtitleIndex === undefined ? <Check className="h-4 w-4" /> : undefined}
          />
          {subtitleStreams.map((stream) => (
            <MenuItem
              key={`s-${stream.index}`}
              active={subtitleIndex === stream.index}
              onClick={() => switchSubtitle(stream.index)}
              title={trackLabel(stream)}
              subtitle={stream.isForced ? "Forced" : stream.codec ?? "Subtitle"}
              icon={subtitleIndex === stream.index ? <Check className="h-4 w-4" /> : undefined}
            />
          ))}
        </TrackMenu>
      ) : null}
    </>
  );
}

// ---------- TrackMenu (the dropdown wrapper) ----------

type TrackMenuProps = {
  label: string;
  detail?: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
  side?: "up" | "down";
};

export function TrackMenu({
  label,
  detail,
  icon,
  open,
  onToggle,
  onClose,
  children,
  side = "down",
}: TrackMenuProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  const positionClass = side === "up" ? "bottom-full mb-2" : "top-11";

  return (
    <div ref={containerRef} className="pointer-events-auto relative">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-white/20 bg-black/55 px-3 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label={`${label} track options`}
      >
        {icon}
        <span className="max-w-[120px] truncate">{label}</span>
        {detail ? <span className="hidden text-white/60 sm:inline">· {detail}</span> : null}
        <ChevronDown
          className={`h-3.5 w-3.5 transition ${
            open ? (side === "up" ? "" : "rotate-180") : side === "up" ? "rotate-180" : ""
          }`}
        />
      </button>
      {open ? (
        <div
          className={`absolute right-0 z-50 w-72 overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur ${positionClass}`}
        >
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/60">
            <Languages className="h-3 w-3" />
            Track
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">{children}</ul>
        </div>
      ) : null}
    </div>
  );
}

// ---------- MenuItem (a single selectable row inside a TrackMenu) ----------

type MenuItemProps = {
  active: boolean;
  title: string;
  subtitle?: string;
  onClick: () => void;
  icon?: React.ReactNode;
};

export function MenuItem({ active, title, subtitle, onClick, icon }: MenuItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition focus-visible:bg-white/10 focus-visible:outline-none ${
          active ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/5"
        }`}
      >
        <span className="flex h-5 w-5 flex-none items-center justify-center text-(--accent)">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{title}</span>
          {subtitle ? (
            <span className="block truncate text-[0.7rem] text-white/50">{subtitle}</span>
          ) : null}
        </span>
      </button>
    </li>
  );
}