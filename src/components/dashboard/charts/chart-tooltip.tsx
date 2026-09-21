import type { ReactNode } from "react";

export interface ChartTooltipCardProps {
  children: ReactNode;
}

/**
 * Shared box styling for every custom Recharts tooltip in this folder - a
 * small surfaced card matching the app's Card component (border/surface/
 * shadow tokens) rather than Recharts' unstyled default tooltip.
 */
export function ChartTooltipCard({ children }: ChartTooltipCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-md">
      {children}
    </div>
  );
}

export interface ChartTooltipRowProps {
  /** Line-key swatch color (a short stroke, not a filled box - see the dataviz skill's interaction rules). */
  color: string;
  label: string;
  value: ReactNode;
}

/** One tooltip row: a colored line-key, the series label, then the value (bold, leading). */
export function ChartTooltipRow({ color, label, value }: ChartTooltipRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden="true" className="h-0.5 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}
