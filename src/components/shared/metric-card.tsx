"use client";

import * as React from "react";
import Link from "next/link";
import { TrendUp, TrendDown } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  label: string;
  /** The headline number. Accepts a pre-formatted string (e.g. "12") or a number. */
  value: string | number;
  icon?: React.ElementType;
  /** Positive = upward trend (success tone), negative = downward (danger tone). */
  trend?: number;
  trendLabel?: string;
  href?: string;
  isLoading?: boolean;
  className?: string;
}

/**
 * Big-number summary card used across dashboards - a plain <Card> when no
 * `href` is given, or a clickable card (wrapped in a Next `<Link>`) when one
 * is. Renders a skeleton layout instead of content while `isLoading`.
 */
export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  href,
  isLoading,
  className,
}: MetricCardProps) {
  const body = (
    <CardContent className="flex flex-col gap-2 p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {Icon && <Icon className="size-5 text-muted-foreground" aria-hidden="true" />}
      </div>

      {isLoading ? (
        <Skeleton className="h-9 w-20" />
      ) : (
        <span className="text-3xl font-semibold tracking-tight text-foreground">{value}</span>
      )}

      {typeof trend === "number" && !isLoading && (
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            trend >= 0 ? "text-success" : "text-danger"
          )}
        >
          {trend >= 0 ? (
            <TrendUp className="size-3.5" aria-hidden="true" />
          ) : (
            <TrendDown className="size-3.5" aria-hidden="true" />
          )}
          <span>
            {trend >= 0 ? "+" : ""}
            {trend}
            {trendLabel ? ` ${trendLabel}` : ""}
          </span>
        </div>
      )}
    </CardContent>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className
        )}
      >
        <Card className="h-full transition-shadow hover:shadow-md">{body}</Card>
      </Link>
    );
  }

  return <Card className={className}>{body}</Card>;
}
