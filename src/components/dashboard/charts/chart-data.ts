import {
  formatEquipmentStatus,
  formatServiceRequestPriority,
  formatServiceRequestStatus,
  type StatusTone,
} from "@/lib/formatting/status";
import {
  EQUIPMENT_STATUSES,
  SERVICE_REQUEST_PRIORITIES,
  SERVICE_REQUEST_STATUSES,
} from "@/lib/constants";
import type { Equipment, ServiceRequest } from "@/types";

/**
 * Aggregation + bucketing helpers for the dashboard charts. Every chart
 * component takes raw entity arrays (the same arrays the dashboards already
 * fetch via TanStack Query) and calls one of these colocated, pure helpers
 * to shape them for Recharts - no aggregation logic lives inside the mock
 * API layer, and no chart duplicates a query.
 */

export interface CategoryCount {
  key: string;
  label: string;
  count: number;
  tone: StatusTone;
}

/** Service request counts by status, in the app's canonical status order (new -> closed). */
export function aggregateServiceRequestsByStatus(requests: ServiceRequest[]): CategoryCount[] {
  return SERVICE_REQUEST_STATUSES.map((status) => {
    const presentation = formatServiceRequestStatus(status);
    return {
      key: status,
      label: presentation.label,
      count: requests.filter((request) => request.status === status).length,
      tone: presentation.tone,
    };
  });
}

/** Service request counts by priority, in the app's canonical priority order (low -> urgent). */
export function aggregateServiceRequestsByPriority(requests: ServiceRequest[]): CategoryCount[] {
  return SERVICE_REQUEST_PRIORITIES.map((priority) => {
    const presentation = formatServiceRequestPriority(priority);
    return {
      key: priority,
      label: presentation.label,
      count: requests.filter((request) => request.priority === priority).length,
      tone: presentation.tone,
    };
  });
}

/** Equipment counts by operational status, in the app's canonical status order. */
export function aggregateEquipmentByStatus(equipment: Equipment[]): CategoryCount[] {
  return EQUIPMENT_STATUSES.map((status) => {
    const presentation = formatEquipmentStatus(status);
    return {
      key: status,
      label: presentation.label,
      count: equipment.filter((item) => item.currentStatus === status).length,
      tone: presentation.tone,
    };
  });
}

export interface WeeklyTrendPoint {
  /** ISO timestamp for the start (Sunday, UTC midnight) of this week. */
  weekStart: string;
  /** Short display label, e.g. "Jun 22". */
  label: string;
  count: number;
}

const WEEK_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function startOfWeekUTC(date: Date): number {
  const midnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const dayOfWeek = new Date(midnight).getUTCDay(); // 0 (Sun) - 6 (Sat)
  return midnight - dayOfWeek * 24 * 60 * 60 * 1000;
}

/**
 * Buckets service requests by calendar week (Sunday-Saturday, UTC) based on
 * `createdAt`, filling in any week that had zero requests so the trend line
 * stays continuous instead of skipping gaps between data points.
 */
export function bucketServiceRequestsByWeek(requests: ServiceRequest[]): WeeklyTrendPoint[] {
  if (requests.length === 0) return [];

  const counts = new Map<number, number>();
  for (const request of requests) {
    const weekStart = startOfWeekUTC(new Date(request.createdAt));
    counts.set(weekStart, (counts.get(weekStart) ?? 0) + 1);
  }

  const weekStarts = [...counts.keys()].sort((a, b) => a - b);
  const first = weekStarts[0];
  const last = weekStarts[weekStarts.length - 1];
  if (first === undefined || last === undefined) return [];

  const points: WeeklyTrendPoint[] = [];
  for (let t = first; t <= last; t += WEEK_MS) {
    points.push({
      weekStart: new Date(t).toISOString(),
      label: WEEK_LABEL_FORMATTER.format(new Date(t)),
      count: counts.get(t) ?? 0,
    });
  }
  return points;
}

/**
 * An evenly-spaced subset of `values` (always including the first and last),
 * capped at `max` entries - keeps axis tick labels from overlapping on
 * narrow screens regardless of how many buckets the data produced.
 */
export function pickTicks<T>(values: T[], max = 6): T[] {
  if (values.length <= max) return values;
  const step = (values.length - 1) / (max - 1);
  const picked: T[] = [];
  for (let i = 0; i < max; i++) {
    const value = values[Math.round(i * step)];
    if (value !== undefined) picked.push(value);
  }
  return [...new Set(picked)];
}
