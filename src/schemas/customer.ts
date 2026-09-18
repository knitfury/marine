import { z } from "zod";

export const customerStatusSchema = z.enum(["active", "inactive", "prospect"]);

export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: customerStatusSchema,
  organizationName: z.string().optional(),
  primaryContactName: z.string(),
  primaryContactEmail: z.string().email(),
  dealerId: z.string().optional(),
  equipmentCount: z.number().int().nonnegative(),
  openServiceRequestCount: z.number().int().nonnegative(),
});
