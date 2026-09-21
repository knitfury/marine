"use client";

import { useMemo } from "react";
import type { ServiceRequest } from "@/types";
import { CategoryBarChart } from "./category-bar-chart";
import { aggregateServiceRequestsByPriority } from "./chart-data";

export interface ServicePriorityChartProps {
  requests: ServiceRequest[];
  className?: string;
}

/** Service request counts by priority - a horizontal bar per priority, colored by the same tone PriorityBadge uses. */
export function ServicePriorityChart({ requests, className }: ServicePriorityChartProps) {
  const data = useMemo(() => aggregateServiceRequestsByPriority(requests), [requests]);

  return (
    <CategoryBarChart
      data={data}
      ariaLabel="Service requests by priority"
      unitLabel="requests"
      className={className}
    />
  );
}
