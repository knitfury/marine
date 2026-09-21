const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const CURRENCY_COMPACT_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Formats a number as USD currency, e.g. 12450 -> "$12,450". The app has no multi-currency concept yet - USD is assumed throughout. */
export function formatCurrency(value: number): string {
  return CURRENCY_FORMATTER.format(value);
}

/** Compact USD formatting for tight spaces (chart axis ticks), e.g. 12450 -> "$12.5K". */
export function formatCurrencyCompact(value: number): string {
  return CURRENCY_COMPACT_FORMATTER.format(value);
}
