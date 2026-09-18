import { z } from "zod";

export const userRoleSchema = z.enum(["internal", "dealer", "customer"]);

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  organizationId: z.string(),
  organizationName: z.string(),
  avatarUrl: z.string().optional(),
  permissions: z.array(z.string()),
  dashboardType: userRoleSchema,
});
