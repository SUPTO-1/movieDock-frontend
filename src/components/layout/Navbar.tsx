"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings2 } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ServerStatus } from "@/components/layout/ServerStatus";
import { NavbarSearch } from "@/components/layout/NavbarSearch";
import { ScanLibraryButton } from "@/components/layout/ScanLibraryButton";
import { homePath, moviesPath, tvShowsPath, animePath, photosPath, libraryPath } from "@/lib/routes";

const navItems = [
  { href: homePath(), label: "Home", exact: true },
  { href: moviesPath(), label: "Movies" },
  { href: tvShowsPath(), label: "TV Shows" },
  { href: animePath(), label: "Anime" },
  { href: photosPath(), label: "Photos" },
  { href: libraryPath(), label: "Library" },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="sticky top-0 z-50 border-b border-border-themed bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href={homePath()} className="group flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-sm font-black text-white shadow-lg shadow-accent/25 transition group-hover:scale-[1.04]">
            M
          </span>
          <span className="hidden text-[0.95rem] font-bold tracking-tight text-foreground sm:inline">
            Movie<span className="text-accent">Dock</span>
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  active
                    ? "bg-accent text-white shadow-sm"
                    : "text-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex flex-1 items-center justify-end gap-2 sm:gap-3">
          <div className="hidden flex-1 sm:flex sm:max-w-sm">
            <NavbarSearch />
          </div>

          <ScanLibraryButton />

          <div className="hidden md:block">
            <ServerStatus />
          </div>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          <Link
            href="/settings"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-themed bg-surface text-foreground transition hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:px-3 md:w-auto md:gap-2"
            aria-label="Settings"
          >
            <Settings2 className="h-4 w-4" />
            <span className="hidden md:inline text-sm font-medium">Settings</span>
          </Link>
        </div>
      </div>

      <div className="border-t border-border-themed md:hidden">
        <div className="mx-auto flex w-full max-w-[1600px] items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  active
                    ? "bg-accent text-white"
                    : "text-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}