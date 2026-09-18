import type {
  CustomerStatus,
  DealerStatus,
  EquipmentStatus,
  ServiceRequestPriority,
  ServiceRequestStatus,
} from "@/types";

/**
 * Human-readable labels and semantic tone for every status/priority enum in
 * the domain model. `tone` maps to the semantic design tokens defined in
 * src/app/globals.css (success/warning/danger/info/neutral) - a later UI
 * phase reads `tone` to pick badge colors instead of hardcoding them.
 */
export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

interface StatusPresentation {
  label: string;
  tone: StatusTone;
}

const DEALER_STATUS_MAP: Record<DealerStatus, StatusPresentation> = {
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "neutral" },
  pending: { label: "Pending", tone: "warning" },
};

const CUSTOMER_STATUS_MAP: Record<CustomerStatus, StatusPresentation> = {
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "neutral" },
  prospect: { label: "Prospect", tone: "info" },
};

const EQUIPMENT_STATUS_MAP: Record<EquipmentStatus, StatusPresentation> = {
  active: { label: "Active", tone: "success" },
  maintenance: { label: "In Maintenance", tone: "warning" },
  inactive: { label: "Inactive", tone: "neutral" },
  retired: { label: "Retired", tone: "danger" },
};

const SERVICE_REQUEST_STATUS_MAP: Record<ServiceRequestStatus, StatusPresentation> = {
  new: { label: "New", tone: "info" },
  in_progress: { label: "In Progress", tone: "warning" },
  waiting: { label: "Waiting", tone: "warning" },
  resolved: { label: "Resolved", tone: "success" },
  closed: { label: "Closed", tone: "neutral" },
};

const SERVICE_REQUEST_PRIORITY_MAP: Record<ServiceRequestPriority, StatusPresentation> = {
  low: { label: "Low", tone: "neutral" },
  medium: { label: "Medium", tone: "info" },
  high: { label: "High", tone: "warning" },
  urgent: { label: "Urgent", tone: "danger" },
};

export function formatDealerStatus(status: DealerStatus): StatusPresentation {
  return DEALER_STATUS_MAP[status];
}

export function formatCustomerStatus(status: CustomerStatus): StatusPresentation {
  return CUSTOMER_STATUS_MAP[status];
}

export function formatEquipmentStatus(status: EquipmentStatus): StatusPresentation {
  return EQUIPMENT_STATUS_MAP[status];
}

export function formatServiceRequestStatus(
  status: ServiceRequestStatus
): StatusPresentation {
  return SERVICE_REQUEST_STATUS_MAP[status];
}

export function formatServiceRequestPriority(
  priority: ServiceRequestPriority
): StatusPresentation {
  return SERVICE_REQUEST_PRIORITY_MAP[priority];
}
