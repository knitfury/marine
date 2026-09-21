"use client";

import { useMemo } from "react";
import type { Equipment } from "@/types";
import { CategoryBarChart } from "./category-bar-chart";
import { aggregateEquipmentByStatus } from "./chart-data";

export interface EquipmentStatusChartProps {
  equipment: Equipment[];
  className?: string;
}

/** Equipment counts by operational status - a horizontal bar per status, colored by the same tone StatusBadge uses. */
export function EquipmentStatusChart({ equipment, className }: EquipmentStatusChartProps) {
  const data = useMemo(() => aggregateEquipmentByStatus(equipment), [equipment]);

  return (
    <CategoryBarChart
      data={data}
      ariaLabel="Equipment by status"
      unitLabel="units"
      className={className}
    />
  );
}
