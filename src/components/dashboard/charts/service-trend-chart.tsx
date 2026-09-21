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
import { bucketServiceRequestsByWeek, pickTicks, type WeeklyTrendPoint } from "./chart-data";
import type { ServiceRequest } from "@/types";

export interface ServiceTrendChartProps {
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
  const point = payload[0]?.payload as WeeklyTrendPoint | undefined;
  if (!point) return null;

  return (
    <ChartTooltipCard>
      <p className="mb-1 font-medium text-foreground">Week of {point.label}</p>
      <ChartTooltipRow
        color={accentColor}
        label="New requests"
        value={point.count.toLocaleString()}
      />
    </ChartTooltipCard>
  );
}

/**
 * Weekly service request volume over time - a single-series area chart
 * (the "trend over time" job from the dataviz skill's form heuristic), one
 * hue (the app's accent), 10% wash fill, 2px line, end markers with a
 * surface ring. Buckets `requests` by ISO week from `createdAt`; the parent
 * dashboard is expected to have already handled the loading/error/empty
 * states for the underlying query before rendering this.
 */
export function ServiceTrendChart({ requests, className }: ServiceTrendChartProps) {
  const colors = useChartColors();
  const prefersReducedMotion = useReducedMotion();

  const points = useMemo(() => bucketServiceRequestsByWeek(requests), [requests]);
  const ticks = useMemo(() => pickTicks(points.map((p) => p.weekStart), 6), [points]);

  if (points.length < MIN_WEEKS_FOR_TREND) {
    return (
      <EmptyState
        heading="Not enough data yet"
        description="Once requests span more than one week, a volume trend will appear here."
        className={className}
      />
    );
  }

  const total = points.reduce((sum, p) => sum + p.count, 0);
  const summary = points.map((p) => `week of ${p.label}: ${p.count}`).join(", ");

  return (
    <div className={className}>
      <div role="img" aria-label={`Weekly service request volume: ${summary}`} style={{ height: 240 }}>
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
              allowDecimals={false}
              width={28}
              tickLine={false}
              axisLine={false}
              tick={{ fill: colors.mutedForeground, fontSize: 12 }}
            />
            <Tooltip
              cursor={{ stroke: colors.border, strokeWidth: 1 }}
              content={(props) => <TrendTooltip {...props} accentColor={colors.accent} />}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke={colors.accent}
              strokeWidth={2}
              fill={colors.accent}
              fillOpacity={0.12}
              dot={{ r: 4, fill: colors.accent, stroke: colors.surface, strokeWidth: 2 }}
              activeDot={{ r: 5, fill: colors.accent, stroke: colors.surface, strokeWidth: 2 }}
              isAnimationActive={!prefersReducedMotion}
              animationDuration={prefersReducedMotion ? 0 : 450}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <span className="sr-only">
        Weekly service request volume, {points[0]?.label} through {points[points.length - 1]?.label}: {summary}.{" "}
        {total.toLocaleString()} requests total.
      </span>
    </div>
  );
}
