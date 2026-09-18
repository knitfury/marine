import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Pulsing placeholder block. Uses Tailwind's `animate-pulse`, which is
 * automatically disabled by the global `prefers-reduced-motion` override in
 * globals.css... except we don't have one there, so we guard directly with
 * the `motion-safe:` variant instead of always animating.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("motion-safe:animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
