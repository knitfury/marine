"use client";

import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/shared";
import { entityHref } from "@/lib/routes";
import { formatRelativeTime } from "@/lib/formatting/date";
import { cn } from "@/lib/utils";
import type { ServiceRequest } from "@/types";

export interface ServiceRequestListRowProps {
  request: ServiceRequest;
  /** Display name for the associated equipment, when known/authorized. */
  equipmentName?: string;
  /** Display name for the associated customer, when known/authorized. */
  customerName?: string;
  /** Display name for the associated dealer, when known/authorized. */
  dealerName?: string;
  className?: string;
}

/**
 * A more complete service request row than the generic `ServiceRequestRow`
 * wrapper (src/components/shared/entity-card.tsx): the Service Request list
 * needs reference number, subject, priority, status, an equipment
 * reference, customer/dealer reference (when authorized), and an updated
 * timestamp all visible at once - more than `EntityCard`'s single-badge,
 * fixed-stats shape supports. Purpose-built here rather than by extending
 * the shared component, to avoid touching a file other in-flight work reads.
 */
export function ServiceRequestListRow({
  request,
  equipmentName,
  customerName,
  dealerName,
  className,
}: ServiceRequestListRowProps) {
  const stats: { label: string; value: string }[] = [{ label: "Team", value: request.assignedTeam }];
  if (equipmentName) stats.push({ label: "Equipment", value: equipmentName });
  if (customerName) stats.push({ label: "Customer", value: customerName });
  if (dealerName) stats.push({ label: "Dealer", value: dealerName });

  return (
    <Link
      href={entityHref("service", request.id)}
      className={cn(
        "block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <Card className="flex items-center gap-4 p-4 transition-shadow hover:shadow-md sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{request.subject}</p>
            <StatusBadge kind="service-request" status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>
          <p className="truncate text-sm text-muted-foreground">{request.referenceNumber}</p>

          <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-1 text-xs">
                <dt className="text-muted-foreground">{stat.label}</dt>
                <dd className="font-medium text-foreground">{stat.value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-1.5 text-xs text-muted-foreground">
            Updated {formatRelativeTime(request.updatedAt)}
          </p>
        </div>

        <CaretRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Card>
    </Link>
  );
}
