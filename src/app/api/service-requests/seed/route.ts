import { getCatalystApp } from "@/lib/catalyst/client";
import { seedServiceRequestsIfEmpty } from "@/lib/catalyst/service-requests-table";
import { mockServiceRequests } from "@/data/mock-service-requests";

// See src/app/api/service-requests/route.ts for why this is explicit.
export const runtime = "nodejs";

function errorResponse(error: unknown, status = 500): Response {
  const message = error instanceof Error ? error.message : String(error);
  return Response.json({ error: message }, { status });
}

/**
 * One-time sample-data loader for a freshly created `ServiceRequests`
 * table. Triggered by the "Load sample data" button on the Service
 * Requests page (internal role, empty table only - see
 * service-directory.tsx). No-ops if the table already has any rows, so
 * it's safe to call more than once.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const app = getCatalystApp(request);
    const result = await seedServiceRequestsIfEmpty(
      app,
      mockServiceRequests.map((sr) => ({
        referenceNumber: sr.referenceNumber,
        subject: sr.subject,
        summary: sr.summary,
        status: sr.status,
        priority: sr.priority,
        assignedTeam: sr.assignedTeam,
        equipmentId: sr.equipmentId,
        customerId: sr.customerId,
        dealerId: sr.dealerId,
        estimatedValue: sr.estimatedValue,
        // Reuses the fixture's own historical `createdAt` as the seed-only
        // `requestedAt` override, so seeded rows get a realistic date
        // spread instead of every row landing on "now" (see
        // seedServiceRequestsIfEmpty's doc comment).
        requestedAt: sr.createdAt,
      }))
    );
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
