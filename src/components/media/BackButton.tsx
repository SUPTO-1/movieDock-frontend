"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useCallback } from "react";

type BackButtonProps = {
  fallbackHref?: string;
  className?: string;
  label?: string;
};

export function BackButton({ fallbackHref = "/", className, label = "Back" }: BackButtonProps) {
  const router = useRouter();

  const handleBack = useCallback(() => {
    // Always navigate to the explicit fallback to avoid the back-history loop
    // between sibling deep destinations (e.g. details ↔ watch).
    router.push(fallbackHref);
  }, [router, fallbackHref]);

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={label}
      className={
        className ??
        "inline-flex h-11 items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 text-sm font-medium text-white backdrop-blur transition hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      }
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}