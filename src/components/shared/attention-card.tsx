"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { Info, WarningCircle, WarningOctagon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { entityHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { DashboardInsight, DashboardInsightSeverity } from "@/types";

const SEVERITY_PRESENTATION: Record<
  DashboardInsightSeverity,
  { icon: ElementType; border: string; iconColor: string }
> = {
  info: { icon: Info, border: "border-l-info", iconColor: "text-info" },
  attention: { icon: WarningCircle, border: "border-l-warning", iconColor: "text-warning" },
  critical: { icon: WarningOctagon, border: "border-l-danger", iconColor: "text-danger" },
};

export interface AttentionCardProps {
  insight: DashboardInsight;
  className?: string;
}

/** Renders one DashboardInsight as a severity-colored card with a link to the related entity. */
export function AttentionCard({ insight, className }: AttentionCardProps) {
  const presentation = SEVERITY_PRESENTATION[insight.severity];
  const Icon = presentation.icon;
  const href = entityHref(insight.entityType, insight.entityId);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-l-4 border-border bg-surface p-4 shadow-sm",
        presentation.border,
        className
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", presentation.iconColor)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{insight.title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{insight.description}</p>
        <Button asChild variant="link" size="sm" className="mt-1 h-auto px-0">
          <Link href={href}>{insight.actionLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
