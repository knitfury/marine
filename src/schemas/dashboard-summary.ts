import { z } from "zod";

export const dashboardSummarySchema = z.object({
  openServiceRequests: z.number().int().nonnegative(),
  highPriorityRequests: z.number().int().nonnegative(),
  activeDealers: z.number().int().nonnegative(),
  activeCustomers: z.number().int().nonnegative(),
  activeEquipment: z.number().int().nonnegative(),
  equipmentInMaintenance: z.number().int().nonnegative(),
  totalRevenue: z.number().nonnegative(),
});
