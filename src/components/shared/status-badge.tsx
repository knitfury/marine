import { Badge } from "@/components/ui/badge";
import {
  formatCustomerStatus,
  formatDealerStatus,
  formatEquipmentStatus,
  formatServiceRequestStatus,
} from "@/lib/formatting/status";
import type { CustomerStatus, DealerStatus, EquipmentStatus, ServiceRequestStatus } from "@/types";

/**
 * Renders a status Badge for any of the four entity status enums in the
 * domain model, always going through src/lib/formatting/status.ts for the
 * label + semantic tone so that mapping stays centralized in one place.
 * `kind` disambiguates which formatter to use (several of these enums share
 * string values like "active"/"inactive", so a single untyped `status` prop
 * couldn't tell them apart).
 */
export type StatusBadgeProps =
  | { kind: "dealer"; status: DealerStatus; className?: string }
  | { kind: "customer"; status: CustomerStatus; className?: string }
  | { kind: "equipment"; status: EquipmentStatus; className?: string }
  | { kind: "service-request"; status: ServiceRequestStatus; className?: string };

export function StatusBadge(props: StatusBadgeProps) {
  const presentation =
    props.kind === "dealer"
      ? formatDealerStatus(props.status)
      : props.kind === "customer"
        ? formatCustomerStatus(props.status)
        : props.kind === "equipment"
          ? formatEquipmentStatus(props.status)
          : formatServiceRequestStatus(props.status);

  return (
    <Badge variant={presentation.tone} className={props.className}>
      {presentation.label}
    </Badge>
  );
}
