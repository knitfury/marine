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

/**
 * Fixed roster of teams a service request can be assigned to. This is a
 * real (if provisional) org chart, not derived from existing data - the
 * "Raise a service request" form used to offer whatever `assignedTeam`
 * values already existed across other requests, which broke on an empty
 * DataStore table (a fresh deployment has zero requests to derive options
 * from, so the dropdown had nothing to offer and the required field could
 * never be filled in). A fixed list has no such bootstrap problem.
 */
export const SERVICE_REQUEST_TEAMS: string[] = [
  "Field Service - Great Lakes",
  "Field Service - Gulf Coast",
  "Field Service - Pacific Northwest",
  "Field Service - Atlantic Coast",
  "Field Service - Mid-Atlantic",
  "Compliance & Certification",
  "Fleet Operations",
  "Sales Engineering",
];
