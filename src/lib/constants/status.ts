import type {
  CustomerStatus,
  DealerStatus,
  EquipmentStatus,
  ServiceRequestPriority,
  ServiceRequestStatus,
} from "@/types";

export const DEALER_STATUSES: DealerStatus[] = ["active", "inactive", "pending"];
export const CUSTOMER_STATUSES: CustomerStatus[] = [
  "active",
  "inactive",
  "prospect",
];
export const EQUIPMENT_STATUSES: EquipmentStatus[] = [
  "active",
  "maintenance",
  "inactive",
  "retired",
];
export const SERVICE_REQUEST_STATUSES: ServiceRequestStatus[] = [
  "new",
  "in_progress",
  "waiting",
  "resolved",
  "closed",
];
export const SERVICE_REQUEST_PRIORITIES: ServiceRequestPriority[] = [
  "low",
  "medium",
  "high",
  "urgent",
];

/** Service request statuses considered "open" for dashboard rollups. */
export const OPEN_SERVICE_REQUEST_STATUSES: ServiceRequestStatus[] = [
  "new",
  "in_progress",
  "waiting",
];
