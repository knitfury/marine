export type DashboardInsightSeverity = "info" | "attention" | "critical";

export type DashboardInsightEntityType =
  | "dealer"
  | "customer"
  | "equipment"
  | "service";

export interface DashboardInsight {
  id: string;
  title: string;
  description: string;
  severity: DashboardInsightSeverity;
  entityType: DashboardInsightEntityType;
  entityId: string;
  actionLabel: string;
  /**
   * Convenience fields (not in the base spec) that let the mock API filter
   * insights to the dealer/customer org they concern without having to
   * cross-reference `entityId` against every other mock data set. Optional
   * because company-wide insights (e.g. internal-only observations) may not
   * belong to any single dealer or customer.
   */
  relatedDealerId?: string;
  relatedCustomerId?: string;
}
