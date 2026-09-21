import type { Equipment, ServiceRequest, ServiceRequestPriority } from "@/types";
import { OPEN_SERVICE_REQUEST_STATUSES, SERVICE_REQUEST_PRIORITIES } from "@/lib/constants";
import { formatServiceRequestPriority } from "@/lib/formatting/status";
import type { StatusTone } from "@/lib/formatting/status";

/**
 * Pure, framework-free analytics helpers for the internal dashboard's
 * "Service performance" row and related breakdowns. Every function here
 * takes already-fetched entity arrays as plain arguments (no React, no
 * fetching, no Recharts) - the same shape as chart-data.ts's aggregate*
 * helpers, just for metrics that need a trend/comparison rather than a
 * single snapshot. Every metric here is honestly computable from fields
 * this app already tracks (ServiceRequest's status/priority/equipmentId/
 * createdAt/updatedAt/estimatedValue, Equipment's equipmentType); nothing
 * here is fabricated or backed by a field the domain model doesn't have.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

/**
 * Standard SLA ladder used for the compliance metric below - a disclosed,
 * industry-standard convention (shown in the UI caption, not hidden), not
 * tied to any specific competitor. Hours from a request's createdAt to its
 * updatedAt (the last status change) must be <= this to count as "met" once
 * the request reaches resolved/closed.
 */
export const SLA_TARGET_HOURS: Record<ServiceRequestPriority, number> = {
  urgent: 24,
  high: 48,
  medium: 120, // 5 days
  low: 240, // 10 days
};

/**
 * Percent change from `previous` to `current`. `null` means "no baseline to
 * compare against" (previous was 0 and current isn't) rather than a
 * misleading +Infinity%; both being 0 is a real (flat) 0% change.
 */
export function computeTrendPct(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return ((current - previous) / previous) * 100;
}

export interface DateWindow {
  start: Date;
  end: Date;
}

export interface MonthToDateWindow {
  current: DateWindow;
  previous: DateWindow;
}

/**
 * `current` = [start of this UTC month, now). `previous` = [start of last
 * UTC month, start of last UTC month + same elapsed days) - an
 * apples-to-apples partial-month comparison so a mid-month reading is never
 * compared against a full prior month.
 */
export function monthToDateWindow(now: Date = new Date()): MonthToDateWindow {
  const currentStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const elapsedMs = now.getTime() - currentStart.getTime();

  const previousStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const previousEnd = new Date(previousStart.getTime() + elapsedMs);

  return {
    current: { start: currentStart, end: now },
    previous: { start: previousStart, end: previousEnd },
  };
}

function inWindow(timestamp: string, window: DateWindow): boolean {
  const t = new Date(timestamp).getTime();
  return t >= window.start.getTime() && t < window.end.getTime();
}

function startOfWeekUTC(date: Date): number {
  const midnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const dayOfWeek = new Date(midnight).getUTCDay(); // 0 (Sun) - 6 (Sat)
  return midnight - dayOfWeek * DAY_MS;
}

/** Trailing N calendar weeks (Sunday-UTC, ending with the week containing `now`), oldest -> newest. */
function trailingWeekStarts(now: Date, weekCount: number): number[] {
  const currentWeekStart = startOfWeekUTC(now);
  const starts: number[] = [];
  for (let i = weekCount - 1; i >= 0; i--) {
    starts.push(currentWeekStart - i * WEEK_MS);
  }
  return starts;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

const SPARKLINE_WEEKS = 8;

export interface OpenRequestsTrend {
  openNow: number;
  openedThisPeriod: number;
  openedPreviousPeriod: number;
  deltaPct: number | null;
  weeklySparkline: number[];
}

/**
 * Open-request volume and how many new requests came in this month-to-date
 * vs. the same elapsed window last month. `openNow` is a point-in-time
 * count (ignores the window entirely); `openedThisPeriod`/`openedPreviousPeriod`
 * count by `createdAt` falling in each monthToDateWindow bucket.
 */
export function computeOpenRequestsTrend(
  requests: ServiceRequest[],
  now: Date = new Date()
): OpenRequestsTrend {
  const openNow = requests.filter((r) =>
    OPEN_SERVICE_REQUEST_STATUSES.includes(r.status)
  ).length;

  const { current, previous } = monthToDateWindow(now);
  const openedThisPeriod = requests.filter((r) => inWindow(r.createdAt, current)).length;
  const openedPreviousPeriod = requests.filter((r) => inWindow(r.createdAt, previous)).length;

  const weekStarts = trailingWeekStarts(now, SPARKLINE_WEEKS);
  const weekStartSet = new Set(weekStarts);
  const weekCounts = new Map<number, number>();
  for (const request of requests) {
    const weekStart = startOfWeekUTC(new Date(request.createdAt));
    if (!weekStartSet.has(weekStart)) continue;
    weekCounts.set(weekStart, (weekCounts.get(weekStart) ?? 0) + 1);
  }
  const weeklySparkline = weekStarts.map((ws) => weekCounts.get(ws) ?? 0);

  return {
    openNow,
    openedThisPeriod,
    openedPreviousPeriod,
    deltaPct: computeTrendPct(openedThisPeriod, openedPreviousPeriod),
    weeklySparkline,
  };
}

function isClosedRequest(request: ServiceRequest): boolean {
  return request.status === "resolved" || request.status === "closed";
}

function resolutionDays(request: ServiceRequest): number {
  const created = new Date(request.createdAt).getTime();
  const updated = new Date(request.updatedAt).getTime();
  return (updated - created) / DAY_MS;
}

export interface ResolutionTimeTrend {
  avgDaysThisPeriod: number | null;
  avgDaysPreviousPeriod: number | null;
  deltaPct: number | null;
  weeklySparkline: number[];
}

/**
 * Average days from createdAt to updatedAt for requests that closed
 * (resolved/closed) in each month-to-date window, bucketed by `updatedAt`
 * (when they closed) rather than `createdAt`. `null` for a bucket with zero
 * closures rather than a misleading 0.
 */
export function computeResolutionTimeTrend(
  requests: ServiceRequest[],
  now: Date = new Date()
): ResolutionTimeTrend {
  const closed = requests.filter(isClosedRequest);
  const { current, previous } = monthToDateWindow(now);

  const thisPeriodDays = closed
    .filter((r) => inWindow(r.updatedAt, current))
    .map(resolutionDays);
  const previousPeriodDays = closed
    .filter((r) => inWindow(r.updatedAt, previous))
    .map(resolutionDays);

  const avgDaysThisPeriod = mean(thisPeriodDays);
  const avgDaysPreviousPeriod = mean(previousPeriodDays);

  const weekStarts = trailingWeekStarts(now, SPARKLINE_WEEKS);
  const weekStartSet = new Set(weekStarts);
  const weekDays = new Map<number, number[]>();
  for (const request of closed) {
    const weekStart = startOfWeekUTC(new Date(request.updatedAt));
    if (!weekStartSet.has(weekStart)) continue;
    const list = weekDays.get(weekStart) ?? [];
    list.push(resolutionDays(request));
    weekDays.set(weekStart, list);
  }
  const weeklySparkline = weekStarts.map((ws) => mean(weekDays.get(ws) ?? []) ?? 0);

  return {
    avgDaysThisPeriod,
    avgDaysPreviousPeriod,
    deltaPct:
      avgDaysThisPeriod === null || avgDaysPreviousPeriod === null
        ? null
        : computeTrendPct(avgDaysThisPeriod, avgDaysPreviousPeriod),
    weeklySparkline,
  };
}

export interface SlaComplianceTrend {
  pctThisPeriod: number | null;
  pctPreviousPeriod: number | null;
  deltaPoints: number | null;
  metCount: number;
  totalCount: number;
  weeklySparkline: number[];
}

function metSla(request: ServiceRequest): boolean {
  const created = new Date(request.createdAt).getTime();
  const updated = new Date(request.updatedAt).getTime();
  const hours = (updated - created) / (60 * 60 * 1000);
  return hours <= SLA_TARGET_HOURS[request.priority];
}

/**
 * SLA compliance rate for requests that closed (resolved/closed) in each
 * month-to-date window, bucketed by `updatedAt`. "Met" = resolution time
 * within `SLA_TARGET_HOURS[priority]`. `deltaPoints` is a percentage-POINT
 * difference (not a percent-of-a-percent), named explicitly to avoid that
 * confusion in the UI. `metCount`/`totalCount` describe THIS period only.
 */
export function computeSlaComplianceTrend(
  requests: ServiceRequest[],
  now: Date = new Date()
): SlaComplianceTrend {
  const closed = requests.filter(isClosedRequest);
  const { current, previous } = monthToDateWindow(now);

  const thisPeriod = closed.filter((r) => inWindow(r.updatedAt, current));
  const previousPeriod = closed.filter((r) => inWindow(r.updatedAt, previous));

  const metCount = thisPeriod.filter(metSla).length;
  const totalCount = thisPeriod.length;
  const pctThisPeriod = totalCount === 0 ? null : (metCount / totalCount) * 100;

  const previousTotalCount = previousPeriod.length;
  const pctPreviousPeriod =
    previousTotalCount === 0
      ? null
      : (previousPeriod.filter(metSla).length / previousTotalCount) * 100;

  const weekStarts = trailingWeekStarts(now, SPARKLINE_WEEKS);
  const weekStartSet = new Set(weekStarts);
  const weekBuckets = new Map<number, ServiceRequest[]>();
  for (const request of closed) {
    const weekStart = startOfWeekUTC(new Date(request.updatedAt));
    if (!weekStartSet.has(weekStart)) continue;
    const list = weekBuckets.get(weekStart) ?? [];
    list.push(request);
    weekBuckets.set(weekStart, list);
  }
  const weeklySparkline = weekStarts.map((ws) => {
    const bucket = weekBuckets.get(ws) ?? [];
    if (bucket.length === 0) return 0;
    return (bucket.filter(metSla).length / bucket.length) * 100;
  });

  return {
    pctThisPeriod,
    pctPreviousPeriod,
    deltaPoints:
      pctThisPeriod === null || pctPreviousPeriod === null ? null : pctThisPeriod - pctPreviousPeriod,
    metCount,
    totalCount,
    weeklySparkline,
  };
}

export interface RepeatServiceRate {
  pct: number | null;
  repeatUnitCount: number;
  totalUnitCount: number;
}

/**
 * Share of serviced equipment units that needed a second visit within
 * `windowDays` of a prior visit. Requests with no `equipmentId` are excluded
 * entirely (there's no unit to attribute them to). A unit counts as
 * "repeat" if any two consecutive requests (sorted by createdAt) for it are
 * <= windowDays apart.
 */
export function computeRepeatServiceRate(
  requests: ServiceRequest[],
  windowDays = 90
): RepeatServiceRate {
  const byEquipment = new Map<string, ServiceRequest[]>();
  for (const request of requests) {
    if (!request.equipmentId) continue;
    const list = byEquipment.get(request.equipmentId) ?? [];
    list.push(request);
    byEquipment.set(request.equipmentId, list);
  }

  const totalUnitCount = byEquipment.size;
  const windowMs = windowDays * DAY_MS;
  let repeatUnitCount = 0;

  for (const unitRequests of byEquipment.values()) {
    const sorted = [...unitRequests].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    let isRepeat = false;
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (!prev || !curr) continue;
      const gap = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
      if (gap <= windowMs) {
        isRepeat = true;
        break;
      }
    }
    if (isRepeat) repeatUnitCount++;
  }

  return {
    pct: totalUnitCount === 0 ? null : (repeatUnitCount / totalUnitCount) * 100,
    repeatUnitCount,
    totalUnitCount,
  };
}

export interface OpenPriorityBreakdown {
  key: ServiceRequestPriority;
  label: string;
  tone: StatusTone;
  count: number;
}

/** Open (status in OPEN_SERVICE_REQUEST_STATUSES) request counts by priority, in canonical low -> urgent order. */
export function aggregateOpenRequestsByPriority(requests: ServiceRequest[]): OpenPriorityBreakdown[] {
  const open = requests.filter((r) => OPEN_SERVICE_REQUEST_STATUSES.includes(r.status));
  return SERVICE_REQUEST_PRIORITIES.map((priority) => {
    const presentation = formatServiceRequestPriority(priority);
    return {
      key: priority,
      label: presentation.label,
      tone: presentation.tone,
      count: open.filter((r) => r.priority === priority).length,
    };
  });
}

export interface EquipmentCategoryBreakdown {
  category: string;
  requestCount: number;
  unitCount: number;
}

/**
 * Service volume and fielded-unit counts per distinct equipment type,
 * sorted descending by requestCount. A request's equipmentId is resolved
 * against `equipment` to find its type; requests whose equipmentId doesn't
 * resolve to a known unit are excluded (never counted against a bogus
 * category).
 */
export function aggregateEquipmentCategoryBreakdown(
  requests: ServiceRequest[],
  equipment: Equipment[]
): EquipmentCategoryBreakdown[] {
  const equipmentById = new Map(equipment.map((item) => [item.id, item]));
  const categories = [...new Set(equipment.map((item) => item.equipmentType))];

  const breakdown = categories.map((category) => {
    const unitCount = equipment.filter((item) => item.equipmentType === category).length;
    const requestCount = requests.filter((request) => {
      if (!request.equipmentId) return false;
      const item = equipmentById.get(request.equipmentId);
      return item?.equipmentType === category;
    }).length;
    return { category, requestCount, unitCount };
  });

  return breakdown.sort((a, b) => b.requestCount - a.requestCount);
}
