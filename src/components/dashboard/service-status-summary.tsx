import { Badge } from "@/components/ui/badge";
import { formatServiceRequestStatus } from "@/lib/formatting/status";
import { SERVICE_REQUEST_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ServiceRequest } from "@/types";

export interface ServiceStatusSummaryProps {
  requests: ServiceRequest[];
  className?: string;
}

/**
 * Compact row of status chips summarizing a set of service requests by
 * status. Reuses the same label/tone mapping as StatusBadge (via
 * src/lib/formatting/status.ts) so the chips stay visually consistent with
 * status badges shown elsewhere, without pulling in a charting dependency.
 */
export function ServiceStatusSummary({ requests, className }: ServiceStatusSummaryProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {SERVICE_REQUEST_STATUSES.map((status) => {
        const count = requests.filter((request) => request.status === status).length;
        const presentation = formatServiceRequestStatus(status);
        return (
          <Badge key={status} variant={presentation.tone} className="gap-1.5 px-3 py-1 text-sm">
            <span className="font-semibold tabular-nums">{count}</span>
            <span>{presentation.label}</span>
          </Badge>
        );
      })}
    </div>
  );
}
