import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(225,29,72,0.15),transparent_22%),linear-gradient(180deg,var(--background),var(--background))]">
      <Navbar />
      <main className="mx-auto w-full max-w-[1600px] px-4 pb-10 pt-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}