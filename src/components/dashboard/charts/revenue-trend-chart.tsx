"use client";

import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { EmptyState } from "@/components/shared";
import { ChartTooltipCard, ChartTooltipRow } from "./chart-tooltip";
import { useChartColors } from "./chart-colors";
import { bucketServiceRequestsRevenueByWeek, pickTicks, type WeeklyRevenuePoint } from "./chart-data";
import { formatCurrency, formatCurrencyCompact } from "@/lib/formatting";
import type { ServiceRequest } from "@/types";

export interface RevenueTrendChartProps {
  requests: ServiceRequest[];
  className?: string;
}

const MIN_WEEKS_FOR_TREND = 2;

function TrendTooltip({
  active,
  payload,
  accentColor,
}: TooltipContentProps & { accentColor: string }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as WeeklyRevenuePoint | undefined;
  if (!point) return null;

  return (
    <ChartTooltipCard>
      <p className="mb-1 font-medium text-foreground">Week of {point.label}</p>
      <ChartTooltipRow
        color={accentColor}
        label="Estimated value"
        value={formatCurrency(point.value)}
      />
    </ChartTooltipCard>
  );
}

/**
 * Weekly estimated request value over time - a single-series area chart
 * (the "trend over time" job from the dataviz skill's form heuristic), one
 * hue (the `success` semantic token, reused from StatusBadge/PriorityBadge
 * rather than a new color, and chosen so this chart is visually distinct
 * from the accent-colored Request volume chart), 10% wash fill, 2px line,
 * end markers with a surface ring. Buckets `requests` by ISO week from
 * `createdAt`, summing `estimatedValue`; the parent dashboard is expected to
 * have already handled the loading/error/empty states for the underlying
 * query before rendering this.
 */
export function RevenueTrendChart({ requests, className }: RevenueTrendChartProps) {
  const colors = useChartColors();
  const prefersReducedMotion = useReducedMotion();

  const points = useMemo(() => bucketServiceRequestsRevenueByWeek(requests), [requests]);
  const ticks = useMemo(() => pickTicks(points.map((p) => p.weekStart), 6), [points]);

  if (points.length < MIN_WEEKS_FOR_TREND) {
    return (
      <EmptyState
        heading="Not enough data yet"
        description="Once requests span more than one week, a revenue trend will appear here."
        className={className}
      />
    );
  }

  const total = points.reduce((sum, p) => sum + p.value, 0);
  const summary = points.map((p) => `week of ${p.label}: ${formatCurrency(p.value)}`).join(", ");

  return (
    <div className={className}>
      <div role="img" aria-label={`Weekly estimated request value: ${summary}`} style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke={colors.border} />
            <XAxis
              dataKey="weekStart"
              ticks={ticks}
              tickFormatter={(value: string) => points.find((p) => p.weekStart === value)?.label ?? ""}
              tickLine={false}
              axisLine={{ stroke: colors.border }}
              tick={{ fill: colors.mutedForeground, fontSize: 12 }}
            />
            <YAxis
              width={44}
              tickLine={false}
              axisLine={false}
              tick={{ fill: colors.mutedForeground, fontSize: 12 }}
              tickFormatter={(value: number) => formatCurrencyCompact(value)}
            />
            <Tooltip
              cursor={{ stroke: colors.border, strokeWidth: 1 }}
              content={(props) => <TrendTooltip {...props} accentColor={colors.success} />}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={colors.success}
              strokeWidth={2}
              fill={colors.success}
              fillOpacity={0.12}
              dot={{ r: 4, fill: colors.success, stroke: colors.surface, strokeWidth: 2 }}
              activeDot={{ r: 5, fill: colors.success, stroke: colors.surface, strokeWidth: 2 }}
              isAnimationActive={!prefersReducedMotion}
              animationDuration={prefersReducedMotion ? 0 : 450}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <span className="sr-only">
        Weekly estimated request value, {points[0]?.label} through {points[points.length - 1]?.label}: {summary}.{" "}
        {formatCurrency(total)} total.
      </span>
    </div>
  );
}
