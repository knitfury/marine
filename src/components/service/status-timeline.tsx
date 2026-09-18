import { Check } from "@phosphor-icons/react";
import { formatServiceRequestStatus } from "@/lib/formatting/status";
import { SERVICE_REQUEST_STATUSES } from "@/lib/constants/status";
import { cn } from "@/lib/utils";
import type { ServiceRequestStatus } from "@/types";

export interface StatusTimelineProps {
  status: ServiceRequestStatus;
  className?: string;
}

/**
 * Read-only progress indicator across the fixed status sequence in
 * SERVICE_REQUEST_STATUSES. The mock data has no per-status history log, so
 * this deliberately does not fabricate per-step dates - it just highlights
 * the request's current step and marks earlier steps (by array order) as
 * passed. "Waiting" isn't strictly before "resolved" in a real workflow;
 * this is an honest, simplified linear visual, not a claim about history.
 */
export function StatusTimeline({ status, className }: StatusTimelineProps) {
  const currentIndex = SERVICE_REQUEST_STATUSES.indexOf(status);

  return (
    <ol
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-0",
        className
      )}
      aria-label="Service request status progress"
    >
      {SERVICE_REQUEST_STATUSES.map((step, i) => {
        const isPassed = i < currentIndex;
        const isCurrent = i === currentIndex;
        const label = formatServiceRequestStatus(step).label;

        return (
          <li
            key={step}
            className={cn(
              "flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center"
            )}
            aria-current={isCurrent ? "step" : undefined}
          >
            <div className="flex items-center sm:w-full">
              {i > 0 && (
                <div
                  className={cn(
                    "hidden h-0.5 flex-1 sm:block",
                    isPassed || isCurrent ? "bg-primary" : "bg-border"
                  )}
                  aria-hidden="true"
                />
              )}
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  isPassed
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCurrent
                      ? "border-primary bg-surface text-primary"
                      : "border-border bg-surface text-muted-foreground"
                )}
              >
                {isPassed ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
              </div>
              {i < SERVICE_REQUEST_STATUSES.length - 1 && (
                <div
                  className={cn("hidden h-0.5 flex-1 sm:block", isPassed ? "bg-primary" : "bg-border")}
                  aria-hidden="true"
                />
              )}
            </div>
            <span
              className={cn(
                "text-xs font-medium",
                isCurrent ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
