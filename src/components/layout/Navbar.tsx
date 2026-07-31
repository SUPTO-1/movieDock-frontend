"use client";

import Link from "next/link";
import { Search, Settings2 } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ServerStatus } from "@/components/layout/ServerStatus";

const navItems = [
  { href: "/movies", label: "Movies" },
  { href: "/tv-shows", label: "TV Shows" },
  { href: "/anime", label: "Anime" },
  { href: "/library", label: "Library" },
  { href: "/search", label: "Search" },
  { href: "/settings", label: "Settings" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-(--border) bg-(--background)/80 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="group flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-(--accent) text-sm font-black text-white shadow-lg shadow-(color:--accent)/25 transition duration-300 group-hover:scale-[1.04]">
                M
              </span>
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.38em] text-(--accent)">MovieDock</p>
                <p className="text-sm text-(--muted)">Jellyfin-powered streaming front end</p>
              </div>
            </Link>

            <div className="xl:hidden">
              <ThemeToggle />
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-3">
            <label className="relative w-full max-w-105">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--muted)" />
              <input
                type="search"
                placeholder="Search title, category, or description"
                className="h-11 w-full rounded-full border border-(--border) bg-(--surface) pl-11 pr-4 text-sm text-(--foreground) shadow-sm outline-none transition placeholder:text-(--muted) focus:border-(--accent) focus:ring-2 focus:ring-(--accent-soft)"
              />
            </label>
            <div className="hidden xl:block">
              <ThemeToggle />
            </div>
            <Link
              href="/settings"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-(--border) bg-(--surface) px-4 text-sm font-medium text-(--foreground) transition duration-200 hover:bg-(--surface-elevated) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
            >
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-transparent px-4 py-2 text-sm font-medium text-(--muted) transition hover:border-(--border) hover:bg-(--surface) hover:text-(--foreground) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
            >
              {item.label}
            </Link>
          ))}
          <div className="ml-auto hidden xl:block">
            <ServerStatus connected />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-(--border) bg-(--surface) px-4 py-2 text-sm font-medium text-(--foreground) xl:hidden">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            Connected to local media server
          </div>
        </div>
      </div>
    </header>
  );
}