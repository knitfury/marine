import { z } from "zod";

export const equipmentStatusSchema = z.enum([
  "active",
  "maintenance",
  "inactive",
  "retired",
]);

export const equipmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  equipmentType: z.string(),
  model: z.string(),
  serialNumber: z.string(),
  currentStatus: equipmentStatusSchema,
  customerId: z.string().optional(),
  dealerId: z.string().optional(),
});
