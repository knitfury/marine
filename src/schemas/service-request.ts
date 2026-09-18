import { z } from "zod";

export const serviceRequestStatusSchema = z.enum([
  "new",
  "in_progress",
  "waiting",
  "resolved",
  "closed",
]);

export const serviceRequestPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "urgent",
]);

export const serviceRequestSchema = z.object({
  id: z.string(),
  referenceNumber: z.string(),
  subject: z.string(),
  status: serviceRequestStatusSchema,
  priority: serviceRequestPrioritySchema,
  assignedTeam: z.string(),
  equipmentId: z.string().optional(),
  customerId: z.string().optional(),
  dealerId: z.string().optional(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  summary: z.string(),
});
