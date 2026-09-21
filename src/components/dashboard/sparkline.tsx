"use client";

import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

export interface SparklineProps {
  values: number[];
  /** A resolved color string, e.g. from useChartColors().accent. */
  color: string;
  /** Pixel height of the chart. Width always fills its container - callers
   * control actual rendered width via a wrapper (a fixed-width flex item for
   * the compact inline style, or a full-width block for the "illustrated"
   * style - see TrendMetricCard). */
  height?: number;
  className?: string;
}

const DEFAULT_HEIGHT = 36;

/**
 * Decorative trend line for a TrendMetricCard - no grid/axes/tooltip, just a
 * thin area under a stroke. Purely illustrative (the headline number and
 * delta label carry the actual meaning), so it never animates in and renders
 * nothing rather than a broken/empty chart for under 2 points.
 */
export function Sparkline({ values, color, height = DEFAULT_HEIGHT, className }: SparklineProps) {
  const data = useMemo(() => values.map((value, i) => ({ i, value })), [values]);

  if (values.length < 2) return null;

  return (
    <div className={className} style={{ height, width: "100%" }} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 1, bottom: 2, left: 1 }}>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={color}
            fillOpacity={0.15}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
