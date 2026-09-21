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

/**
 * Validates the "Raise request" form (src/components/service/
 * raise-request-dialog.tsx). Deliberately does not include `customerId`/
 * `dealerId` - those are inferred from the current user's role/org (or the
 * selected equipment's own org, for internal users) at submit time, never
 * chosen directly in the form, so a dealer/customer can't attribute a
 * request to a different org.
 */
export const createServiceRequestSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required."),
  summary: z.string().trim().min(1, "Summary is required."),
  priority: serviceRequestPrioritySchema,
  assignedTeam: z.string().trim().min(1, "Assigned team is required."),
  /** "none" is the form's sentinel for "no equipment selected" (Radix
   * Select doesn't allow an empty-string item value) - translated to
   * `undefined` before being sent to the mock API. */
  equipmentId: z.string().min(1).optional(),
});

export type CreateServiceRequestFormValues = z.infer<typeof createServiceRequestSchema>;

/**
 * Validates the full `POST /api/service-requests` request body, i.e. the
 * mock-api layer's `CreateServiceRequestInput` shape (src/lib/mock-api/
 * index.ts) sent over the wire by `createServiceRequest`. Extends the
 * form-level `createServiceRequestSchema` above with `customerId`/
 * `dealerId` - deliberately absent from the form schema (they're never
 * entered directly, see that schema's docstring) but present once the
 * client has resolved them from the current user/equipment, and required
 * by the server to attribute the row to the right org.
 */
export const createServiceRequestPayloadSchema = createServiceRequestSchema.extend({
  customerId: z.string().min(1).optional(),
  dealerId: z.string().min(1).optional(),
});

export type CreateServiceRequestPayload = z.infer<typeof createServiceRequestPayloadSchema>;
