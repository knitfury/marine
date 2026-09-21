import { z } from "zod";
import { getCatalystApp } from "@/lib/catalyst/client";
import { updateServiceRequestStatusRow } from "@/lib/catalyst/service-requests-table";
import { serviceRequestStatusSchema } from "@/schemas/service-request";

// See src/app/api/service-requests/route.ts for why this is explicit.
export const runtime = "nodejs";

// Reuses the same status enum the rest of the app validates against
// (src/schemas/service-request.ts, itself derived from
// SERVICE_REQUEST_STATUSES in src/lib/constants/status.ts) rather than
// re-deriving a z.enum from the constants array, which would lose the
// literal-union typing z.enum needs.
const patchBodySchema = z.object({
  status: serviceRequestStatusSchema,
});

function errorResponse(error: unknown, status = 500): Response {
  const message = error instanceof Error ? error.message : String(error);
  return Response.json({ error: message }, { status });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ rowId: string }> }
): Promise<Response> {
  const { rowId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request body.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const app = getCatalystApp(request);
    const updated = await updateServiceRequestStatusRow(app, rowId, parsed.data.status);
    return Response.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = /was not found/i.test(message) ? 404 : 500;
    return errorResponse(error, status);
  }
}
