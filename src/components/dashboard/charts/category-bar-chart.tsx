"use client";

import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { EmptyState } from "@/components/shared";
import { ChartTooltipCard, ChartTooltipRow } from "./chart-tooltip";
import { toneToColor, useChartColors } from "./chart-colors";
import type { CategoryCount } from "./chart-data";

export interface CategoryBarChartProps {
  /** Pre-aggregated category counts - see chart-data.ts's aggregate* helpers. */
  data: CategoryCount[];
  /** Accessible label for the chart region, e.g. "Service requests by status". */
  ariaLabel: string;
  /** Noun used in the tooltip/sr-only summary, e.g. "requests" or "units". */
  unitLabel: string;
  className?: string;
}

const ROW_HEIGHT = 40;
const MIN_HEIGHT = 160;

function BarTooltip({
  active,
  payload,
  total,
  unitLabel,
}: TooltipContentProps & { total: number; unitLabel: string }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0]?.payload as CategoryCount | undefined;
  if (!entry) return null;

  const percent = total > 0 ? Math.round((entry.count / total) * 100) : 0;

  return (
    <ChartTooltipCard>
      <ChartTooltipRow
        color={String(payload[0]?.color ?? "currentColor")}
        label={entry.label}
        value={`${entry.count.toLocaleString()} ${unitLabel} (${percent}%)`}
      />
    </ChartTooltipCard>
  );
}

/**
 * Horizontal bar chart for a small set of status/priority/equipment-status
 * categories. Bars are colored by the same semantic tone StatusBadge and
 * PriorityBadge already use, and each row is direct-labeled by its category
 * name on the axis, so identity never depends on color alone.
 */
export function CategoryBarChart({ data, ariaLabel, unitLabel, className }: CategoryBarChartProps) {
  const colors = useChartColors();
  const prefersReducedMotion = useReducedMotion();

  const total = useMemo(() => data.reduce((sum, entry) => sum + entry.count, 0), [data]);

  const summary = useMemo(
    () => data.map((entry) => `${entry.label}: ${entry.count}`).join(", "),
    [data]
  );

  if (total === 0) {
    return (
      <EmptyState
        heading="No data to chart yet"
        description={`Once there's data, a ${unitLabel} breakdown will appear here.`}
        className={className}
      />
    );
  }

  const height = Math.max(MIN_HEIGHT, data.length * ROW_HEIGHT + 24);

  return (
    <div className={className}>
      <div role="img" aria-label={`${ariaLabel}: ${summary}`} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 28, bottom: 4, left: 0 }}
            barCategoryGap={10}
          >
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={92}
              tickLine={false}
              axisLine={false}
              tick={{ fill: colors.foreground, fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: colors.border, fillOpacity: 0.35 }}
              content={(props) => <BarTooltip {...props} total={total} unitLabel={unitLabel} />}
            />
            <Bar
              dataKey="count"
              radius={[0, 4, 4, 0]}
              maxBarSize={22}
              isAnimationActive={!prefersReducedMotion}
              animationDuration={prefersReducedMotion ? 0 : 350}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={toneToColor(colors, entry.tone)} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                className="tabular-nums"
                fill={colors.mutedForeground}
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <span className="sr-only">
        {ariaLabel}: {summary}. {total.toLocaleString()} {unitLabel} total.
      </span>
    </div>
  );
}
