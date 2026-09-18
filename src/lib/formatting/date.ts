/**
 * Date/time formatting helpers. Real implementations (not just stubs) so a
 * later UI phase can use them directly for things like service request
 * timelines and "last updated" labels.
 */

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** Formats an ISO 8601 timestamp as e.g. "Sep 18, 2026". */
export function formatDate(iso: string): string {
  return DATE_FORMATTER.format(new Date(iso));
}

/** Formats an ISO 8601 timestamp as e.g. "Sep 18, 2026, 2:30 PM". */
export function formatDateTime(iso: string): string {
  return DATE_TIME_FORMATTER.format(new Date(iso));
}

const LONG_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

/** Formats a Date (defaults to now) as e.g. "Wednesday, September 18" - used for dashboard greeting/context lines. */
export function formatLongDate(date: Date = new Date()): string {
  return LONG_DATE_FORMATTER.format(date);
}

const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("en-US", {
  numeric: "auto",
});

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "seconds" },
  { amount: 60, unit: "minutes" },
  { amount: 24, unit: "hours" },
  { amount: 7, unit: "days" },
  { amount: 4.34524, unit: "weeks" },
  { amount: 12, unit: "months" },
  { amount: Number.POSITIVE_INFINITY, unit: "years" },
];

/**
 * Formats an ISO 8601 timestamp relative to now, e.g. "3 days ago" or
 * "in 2 hours". `now` is injectable for deterministic tests/storybook.
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  let duration = (new Date(iso).getTime() - now.getTime()) / 1000;

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return RELATIVE_TIME_FORMATTER.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return RELATIVE_TIME_FORMATTER.format(Math.round(duration), "years");
}
