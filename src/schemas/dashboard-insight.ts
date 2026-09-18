import { z } from "zod";

export const dashboardInsightSeveritySchema = z.enum([
  "info",
  "attention",
  "critical",
]);

export const dashboardInsightEntityTypeSchema = z.enum([
  "dealer",
  "customer",
  "equipment",
  "service",
]);

export const dashboardInsightSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: dashboardInsightSeveritySchema,
  entityType: dashboardInsightEntityTypeSchema,
  entityId: z.string(),
  actionLabel: z.string(),
  relatedDealerId: z.string().optional(),
  relatedCustomerId: z.string().optional(),
});
