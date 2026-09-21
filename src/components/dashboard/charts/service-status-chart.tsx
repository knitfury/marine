"use client";

import { useMemo } from "react";
import type { ServiceRequest } from "@/types";
import { CategoryBarChart } from "./category-bar-chart";
import { aggregateServiceRequestsByStatus } from "./chart-data";

export interface ServiceStatusChartProps {
  requests: ServiceRequest[];
  className?: string;
}

/** Service request counts by status - a horizontal bar per status, colored by the same tone StatusBadge uses. */
export function ServiceStatusChart({ requests, className }: ServiceStatusChartProps) {
  const data = useMemo(() => aggregateServiceRequestsByStatus(requests), [requests]);

  return (
    <CategoryBarChart
      data={data}
      ariaLabel="Service requests by status"
      unitLabel="requests"
      className={className}
    />
  );
}
