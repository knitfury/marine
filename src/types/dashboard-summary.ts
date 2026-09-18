/**
 * Aggregate counts shown at the top of each role's dashboard. Internal
 * users get a company-wide rollup; dealer and customer users get the same
 * shape scoped to their own organization (see src/lib/mock-api).
 */
export interface DashboardSummary {
  openServiceRequests: number;
  highPriorityRequests: number;
  activeDealers: number;
  activeCustomers: number;
  activeEquipment: number;
  equipmentInMaintenance: number;
}
