import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DashboardSectionProps {
  title: string;
  description?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Consistent section wrapper (heading + optional description + optional
 * "View all" link + content) used by every section across all three role
 * dashboards, so the three experiences read as one family even though their
 * content differs.
 */
export function DashboardSection({
  title,
  description,
  viewAllHref,
  viewAllLabel = "View all",
  children,
  className,
}: DashboardSectionProps) {
  const headingId = `dashboard-section-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <section aria-labelledby={headingId} className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 id={headingId} className="text-sm font-semibold text-muted-foreground">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {viewAllHref && (
          <Button asChild variant="link" size="sm" className="h-auto shrink-0 px-0">
            <Link href={viewAllHref}>{viewAllLabel}</Link>
          </Button>
        )}
      </div>
      {children}
    </section>
  );
}
