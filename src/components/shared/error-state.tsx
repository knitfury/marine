"use client";

import { WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  heading?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

/** Icon + message + retry button, shown when a mock API call fails (including the dev "forceError" simulation). */
export function ErrorState({
  heading = "Something went wrong",
  description = "We couldn't load this data. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-danger/30 bg-danger-subtle px-6 py-12 text-center",
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-surface">
        <WarningCircle className="size-6 text-danger" aria-hidden="true" />
      </div>
      <div className="max-w-sm">
        <p className="text-sm font-semibold text-danger-subtle-foreground">{heading}</p>
        <p className="mt-1 text-sm text-danger-subtle-foreground/80">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
