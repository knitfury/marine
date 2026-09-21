import type { StatusTone } from "@/lib/formatting/status";
import { cn } from "@/lib/utils";

export interface SegmentedBarSegment {
  key: string;
  label: string;
  count: number;
  tone: StatusTone;
}

export interface SegmentedBarProps {
  segments: SegmentedBarSegment[];
  className?: string;
}

/**
 * Tone -> background class for a segment. Reuses the exact semantic color
 * tokens StatusBadge/PriorityBadge/chart bars already render with (see
 * src/lib/formatting/status.ts), registered in src/app/globals.css's
 * @theme block as --color-success/-warning/-danger/-info and
 * --color-muted-foreground, so these utility classes resolve to real,
 * theme-aware colors rather than being invented here.
 */
export const TONE_BG_CLASS: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-muted-foreground",
};

/**
 * One continuous horizontal proportional bar, segmented by tone-colored
 * shares of `segments`. Used for "open work by priority" - a single glance
 * at how the current queue is weighted, company-wide.
 */
export function SegmentedBar({ segments, className }: SegmentedBarProps) {
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  const summary = segments.map((s) => `${s.label}: ${s.count}`).join(", ");

  return (
    <div className={className}>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label={summary}>
        {total === 0
          ? null
          : segments
              .filter((segment) => segment.count > 0)
              .map((segment) => (
                <div
                  key={segment.key}
                  className={cn(TONE_BG_CLASS[segment.tone])}
                  style={{ width: `${(segment.count / total) * 100}%` }}
                />
              ))}
      </div>
      <span className="sr-only">
        Open work by priority: {summary}. {total.toLocaleString()} open requests total.
      </span>
    </div>
  );
}
