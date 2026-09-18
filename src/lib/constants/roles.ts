import type { UserRole } from "@/types";

export const USER_ROLES: UserRole[] = ["internal", "dealer", "customer"];

export const ROLE_LABELS: Record<UserRole, string> = {
  internal: "Marine Travelift Staff",
  dealer: "Dealer",
  customer: "Customer",
};
