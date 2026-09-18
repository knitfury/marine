"use client";

import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { cn } from "@/lib/utils";

export interface RelatedRecordCardProps {
  href: string;
  title: string;
  subtitle?: string;
  className?: string;
}

/** Small card linking to a related dealer/customer/equipment/service-request from a detail page. */
export function RelatedRecordCard({ href, title, subtitle, className }: RelatedRecordCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:bg-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <EntityAvatar name={title} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <CaretRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}
