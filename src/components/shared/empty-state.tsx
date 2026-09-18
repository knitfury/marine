"use client";

import type { ElementType, ReactNode } from "react";
import { Tray } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: ElementType;
  heading: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Icon + heading + description + optional action, for zero-results/empty-data states. */
export function EmptyState({ icon: Icon = Tray, heading, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center",
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="max-w-sm">
        <p className="text-sm font-semibold text-foreground">{heading}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
