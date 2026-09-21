export interface CategoryBarListEntry {
  key: string;
  label: string;
  /** e.g. requestCount. */
  primaryValue: number;
  /** e.g. "requests". */
  primaryUnitLabel: string;
  /** e.g. "8 units fielded". */
  secondaryLabel?: string;
}

export interface CategoryBarListProps {
  /** In the order to render - the caller sorts. */
  entries: CategoryBarListEntry[];
  className?: string;
}

/**
 * Plain-CSS proportional bar list (not a Recharts chart) for the equipment
 * category breakdown - a label + value row per entry, with a slim bar
 * underneath sized relative to the largest entry so bars are comparable to
 * each other, not just to their own row. Renders nothing for an empty list
 * (the caller shows an EmptyState instead, same pattern as every other
 * dashboard section).
 */
export function CategoryBarList({ entries, className }: CategoryBarListProps) {
  if (entries.length === 0) return null;

  const maxPrimaryValue = Math.max(...entries.map((entry) => entry.primaryValue), 0);

  return (
    <div className={className}>
      <ul className="flex flex-col gap-4">
        {entries.map((entry) => {
          const pct = maxPrimaryValue === 0 ? 0 : (entry.primaryValue / maxPrimaryValue) * 100;
          return (
            <li key={entry.key} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-foreground">{entry.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {entry.primaryValue.toLocaleString()} {entry.primaryUnitLabel}
                  {entry.secondaryLabel ? ` · ${entry.secondaryLabel}` : ""}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
