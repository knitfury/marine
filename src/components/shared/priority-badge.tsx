import { Badge } from "@/components/ui/badge";
import { formatServiceRequestPriority } from "@/lib/formatting/status";
import type { ServiceRequestPriority } from "@/types";

export interface PriorityBadgeProps {
  priority: ServiceRequestPriority;
  className?: string;
}

/** Renders a ServiceRequest priority Badge, using the centralized label/tone mapping in src/lib/formatting/status.ts. */
export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const presentation = formatServiceRequestPriority(priority);
  return (
    <Badge variant={presentation.tone} className={className}>
      {presentation.label}
    </Badge>
  );
}
