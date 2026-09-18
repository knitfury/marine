"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DetailHeaderProps {
  title: string;
  subtitle?: string;
  badges?: ReactNode;
  actions?: ReactNode;
  /** Called instead of `router.back()` when set (e.g. to always land on a known list route). */
  onBack?: () => void;
  className?: string;
}

/** Page-level header for detail screens: back button, title, subtitle/meta line, badges, and a primary-action slot. */
export function DetailHeader({ title, subtitle, badges, actions, onBack, className }: DetailHeaderProps) {
  const router = useRouter();

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack ?? (() => router.back())}
        className="w-fit gap-1.5 px-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            {badges}
          </div>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
