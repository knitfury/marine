import { getCatalystApp } from "@/lib/catalyst/client";
import {
  createServiceRequestRow,
  listServiceRequests,
} from "@/lib/catalyst/service-requests-table";
import { createServiceRequestPayloadSchema } from "@/schemas/service-request";

// The Catalyst SDK is Node-only (it uses Node's `http`/`fs` under the hood)
// - App Router routes can default to the Edge runtime in some configs, so
// this is explicit rather than relying on that default.
export const runtime = "nodejs";

function errorResponse(error: unknown, status = 500): Response {
  const message = error instanceof Error ? error.message : String(error);
  return Response.json({ error: message }, { status });
}

export async function GET(request: Request): Promise<Response> {
  try {
    const app = getCatalystApp(request);
    const requests = await listServiceRequests(app);
    return Response.json(requests);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = createServiceRequestPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request body.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const app = getCatalystApp(request);
    const created = await createServiceRequestRow(app, parsed.data);
    return Response.json(created, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
