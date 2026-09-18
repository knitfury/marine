import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface KeyValueItem {
  label: string;
  value: ReactNode;
}

export interface KeyValueListProps {
  items: KeyValueItem[];
  className?: string;
}

/** Label/value pairs - stacks to one column on mobile, two columns on desktop. */
export function KeyValueList({ items, className }: KeyValueListProps) {
  return (
    <dl className={cn("grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2", className)}>
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {item.label}
          </dt>
          <dd className="text-sm text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
