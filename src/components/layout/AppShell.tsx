import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  flush?: boolean;
};

export function AppShell({ children, flush = false }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className={cn(
        "w-full pb-10",
        flush ? "" : "mx-auto max-w-[1600px] px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8",
      )}>
        {children}
      </main>
    </div>
  );
}