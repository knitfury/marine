"use client";

import { Info } from "@phosphor-icons/react";

/**
 * Persistent, always-visible strip (never hidden or dismissible) making it
 * unmistakable that MarineLink Phase 1 has no real authentication and all
 * data is mocked - see spec section 11. Rendered once by `AppShell`, above
 * the page content, so it shows on every route at every breakpoint.
 */
export function DemoModeBanner() {
  return (
    <div className="flex items-center justify-center gap-1.5 border-b border-warning/30 bg-warning-subtle px-4 py-1.5 text-center text-xs font-medium text-warning-subtle-foreground">
      <Info className="size-3.5 shrink-0" aria-hidden="true" />
      <span>Demo Mode — mock data only, no real authentication.</span>
    </div>
  );
}
