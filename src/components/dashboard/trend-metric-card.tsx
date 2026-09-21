"use client";

import * as React from "react";
import { TrendUp, TrendDown } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/dashboard/sparkline";
import { useChartColors } from "@/components/dashboard/charts";
import { cn } from "@/lib/utils";

export interface TrendMetricCardProps {
  label: string;
  icon?: React.ElementType;
  /** Pre-formatted headline, e.g. "12", "4.4 days avg", "50%". */
  value: string;
  /** Pre-formatted, e.g. "+18% vs last month", "5.2 pts vs last month", or "Not enough data yet". */
  deltaLabel?: string;
  /**
   * Business-meaning color for the delta line. "warning" is included
   * alongside the base success/danger/neutral set because at least one
   * dashboard metric (open requests) treats an *increase* as
   * attention-worthy rather than flatly bad - a plain success/danger
   * dichotomy can't express that distinction.
   */
  deltaTone?: "success" | "warning" | "danger" | "neutral";
  /**
   * Which arrow icon to show next to the delta, if any - kept independent
   * of `deltaTone` because tone encodes "is this good or bad" while the
   * arrow encodes "did the number go up or down", and those two disagree
   * for some metrics (e.g. a *lower* resolution time is a "success" but the
   * number itself went down, not up).
   */
  deltaDirection?: "up" | "down";
  /** Small muted footer line, e.g. the SLA target breakdown text. */
  caption?: string;
  sparklineValues?: number[];
  isLoading?: boolean;
  className?: string;
}

const DELTA_TONE_CLASS: Record<NonNullable<TrendMetricCardProps["deltaTone"]>, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  neutral: "text-muted-foreground",
};

/**
 * A bigger sibling of MetricCard for the "Service performance" row - room
 * for a sparkline next to the headline number, plus a colored delta line
 * and an optional caption (e.g. disclosing the SLA ladder). Mirrors
 * MetricCard's Card/CardContent structure and trend row so the two read as
 * one family.
 */
export function TrendMetricCard({
  label,
  icon: Icon,
  value,
  deltaLabel,
  deltaTone = "neutral",
  deltaDirection,
  caption,
  sparklineValues,
  isLoading,
  className,
}: TrendMetricCardProps) {
  const colors = useChartColors();

  return (
    <Card className={className}>
      <CardContent className="flex flex-col gap-2 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          {Icon && <Icon className="size-5 text-muted-foreground" aria-hidden="true" />}
        </div>

        {isLoading ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <div className="flex items-center justify-between gap-3">
            <span className="text-3xl font-semibold tracking-tight text-foreground">{value}</span>
            {sparklineValues && sparklineValues.length > 0 && (
              <Sparkline values={sparklineValues} color={colors.accent} />
            )}
          </div>
        )}

        {isLoading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          deltaLabel && (
            <div className={cn("flex items-center gap-1 text-xs font-medium", DELTA_TONE_CLASS[deltaTone])}>
              {deltaDirection === "up" && <TrendUp className="size-3.5" aria-hidden="true" />}
              {deltaDirection === "down" && <TrendDown className="size-3.5" aria-hidden="true" />}
              <span>{deltaLabel}</span>
            </div>
          )
        )}

        {caption && !isLoading && <p className="text-xs text-muted-foreground">{caption}</p>}
      </CardContent>
    </Card>
  );
}
