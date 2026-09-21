/**
 * Server-side DataStore access for the `ServiceRequests` table.
 * -----------------------------------------------------------------------
 * Pure CRUD functions against Catalyst's `ServiceRequests` DataStore table.
 * Each function takes an already-built `CatalystApp` instance (see
 * `src/lib/catalyst/client.ts`) as a parameter rather than constructing one
 * itself, so this module stays testable/pure and has no knowledge of the
 * inbound HTTP request - that's the Route Handlers' job (`src/app/api/
 * service-requests/**`), which own turning a `Request` into an app instance
 * and turning thrown errors into HTTP responses.
 *
 * Every function here lets real SDK errors propagate. Nothing in this
 * module swallows an error into a fallback/empty value - a thrown error is
 * the correct, already-supported behavior (the Route Handlers catch it and
 * return a proper error response; the frontend already has full
 * ErrorState/retry handling wired up for fetch failures).
 *
 * COLUMN MAPPING (DataStore row <-> `ServiceRequest`, from `@/types`)
 * -----------------------------------------------------------------------
 *   id             <- String(row.ROWID)                 (Catalyst system column)
 *   referenceNumber <-> row.referenceNumber              (1:1)
 *   subject         <-> row.subject                      (1:1)
 *   status          <-> row.status                       (1:1)
 *   priority        <-  row.requestPriority               ("priority" is a
 *                        reserved keyword in Catalyst DataStore - the column
 *                        is named `requestPriority` instead; NEVER write a
 *                        `priority` key to the table, see the
 *                        catalyst-datastore skill's "Reserved Column Names")
 *   assignedTeam    <-> row.assignedTeam                 (1:1)
 *   equipmentId     <-> row.equipmentId                  (1:1, nullable)
 *   customerId      <-> row.customerId                   (1:1, nullable)
 *   dealerId        <-> row.dealerId                     (1:1, nullable)
 *   summary         <-> row.summary                      (1:1)
 *   createdAt       <-  row.requestedAt || row.CREATEDTIME (see
 *                        parseCatalystTimeApprox below; `requestedAt` is an
 *                        OPTIONAL varchar override, only ever written by the
 *                        seed path, that lets seeded historical demo rows
 *                        get a realistic createdAt instead of every seeded
 *                        row landing on "now" - see seedServiceRequestsIfEmpty)
 *   updatedAt       <-  row.MODIFIEDTIME (see parseCatalystTimeApprox below)
 *   estimatedValue  <-> row.estimatedValue                (1:1, nullable
 *                        decimal/double - the dollar value of the work)
 */
import type { CatalystApp } from "zcatalyst-sdk-node/lib/catalyst-app";
import type { ICatalystRow } from "zcatalyst-sdk-node/lib/utils/pojo/common";
import { serviceRequestSchema } from "@/schemas";
import type { ServiceRequest, ServiceRequestPriority, ServiceRequestStatus } from "@/types";
import type { CreateServiceRequestInput } from "@/lib/mock-api";

const TABLE_NAME = "ServiceRequests";

/**
 * CREATEDTIME/MODIFIEDTIME timezone approximation - READ BEFORE CHANGING.
 * -----------------------------------------------------------------------
 * Catalyst stores `CREATEDTIME`/`MODIFIEDTIME` as the *project's configured
 * timezone*, with NO UTC offset marker in the string (see the
 * catalyst-datastore skill, "CREATEDTIME Timezone Behavior"). The correct
 * fix is `parseCatalystTime(timestamp, tzOffsetMinutes)` documented in
 * `.claude/skills/catalyst-datastore/references/datastore-basics.md`, which
 * needs this project's real UTC offset (e.g. IST = +330) to shift the
 * value correctly.
 *
 * That offset is a fact about *this* Catalyst project's configuration that
 * nobody has confirmed yet, and the datastore-basics.md skill is explicit:
 * do NOT invent/guess a timezone. So, as a deliberate, clearly-labeled
 * best-effort placeholder, this function does the minimal thing that
 * produces a parseable ISO 8601 string without asserting any specific
 * offset: it appends a literal `Z` (UTC) designator to the raw Catalyst
 * timestamp string if it doesn't already have a timezone designator, and
 * otherwise leaves it alone. This is very likely WRONG by however many
 * hours this project's timezone is offset from UTC - e.g. if the project
 * is configured for IST (UTC+5:30), every createdAt/updatedAt will read
 * 5.5 hours early.
 *
 * Once the developer confirms the project's real UTC offset, replace this
 * function's body with `parseCatalystTime` from the reference above (or
 * inline its logic here) and pass the real offset in minutes.
 */
function parseCatalystTimeApprox(catalystTimestamp: string): string {
  const hasTimezoneDesignator = /(?:Z|[+-]\d{2}:?\d{2})$/.test(catalystTimestamp);
  const withZ = hasTimezoneDesignator
    ? catalystTimestamp
    : `${catalystTimestamp.replace(" ", "T")}Z`;
  const parsed = new Date(withZ);
  // Fall back to "now" only if Catalyst ever sends something unparseable -
  // this should not happen in practice, but a validated ServiceRequest
  // record needs *some* ISO string for createdAt/updatedAt.
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

/** Converts a raw DataStore row into the app's `ServiceRequest` shape. */
function rowToServiceRequest(row: ICatalystRow): unknown {
  return {
    id: String(row.ROWID),
    referenceNumber: row.referenceNumber,
    subject: row.subject,
    status: row.status,
    priority: row.requestPriority,
    assignedTeam: row.assignedTeam,
    equipmentId: row.equipmentId || undefined,
    customerId: row.customerId || undefined,
    dealerId: row.dealerId || undefined,
    // `requestedAt` is an optional seed-only override for createdAt (see
    // module doc above) - preferred over CREATEDTIME when present, since
    // CREATEDTIME can't be backdated via the SDK.
    createdAt: parseCatalystTimeApprox(row.requestedAt || row.CREATEDTIME),
    updatedAt: parseCatalystTimeApprox(row.MODIFIEDTIME),
    summary: row.summary,
    estimatedValue: row.estimatedValue != null && row.estimatedValue !== "" ? Number(row.estimatedValue) : undefined,
  };
}

/**
 * Lists every row in `ServiceRequests`, paging through
 * `table.getPagedRows()` (the non-deprecated pagination API - see the
 * catalyst-datastore skill) until `more_records` is false. Each row is
 * validated against `serviceRequestSchema`; a row that fails validation is
 * dropped (with a `console.error`) rather than crashing the whole list, per
 * the same "one bad record shouldn't take down the page" principle the
 * existing localStorage store used (see the old service-request-store.ts's
 * `readFromStorage`).
 */
export async function listServiceRequests(app: CatalystApp): Promise<ServiceRequest[]> {
  const table = app.datastore().table(TABLE_NAME);
  const results: ServiceRequest[] = [];
  let nextToken: string | undefined;

  for (;;) {
    const { data, next_token, more_records } = await table.getPagedRows({
      nextToken,
      maxRows: 200,
    });

    for (const row of data) {
      const parsed = serviceRequestSchema.safeParse(rowToServiceRequest(row));
      if (parsed.success) {
        results.push(parsed.data);
      } else {
        console.error(
          `Dropping ServiceRequests row (ROWID=${String(row.ROWID)}) - failed schema validation:`,
          parsed.error.flatten()
        );
      }
    }

    if (!more_records) break;
    nextToken = next_token;
  }

  return results;
}

/** Picks the next "SR-NNNNNN" reference number, continuing the same
 * numbering scheme the old mock store used (see the former
 * `nextReferenceNumber` helper in src/lib/mock-api/index.ts), based on the
 * highest reference number currently in the table. */
function nextReferenceNumber(existing: ServiceRequest[]): string {
  let max = 100000;
  for (const sr of existing) {
    const match = /^SR-(\d+)$/.exec(sr.referenceNumber);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `SR-${max + 1}`;
}

/**
 * Creates a new service request row. `status` always starts as `"new"`;
 * `referenceNumber` is generated from the current highest existing
 * reference number (fetched via `listServiceRequests`, same approach the
 * old mock store used). Writes to the `requestPriority` column (never a
 * `priority` key - see the module doc's mapping table).
 */
export async function createServiceRequestRow(
  app: CatalystApp,
  input: CreateServiceRequestInput
): Promise<ServiceRequest> {
  const table = app.datastore().table(TABLE_NAME);
  const existing = await listServiceRequests(app);
  const referenceNumber = nextReferenceNumber(existing);

  const insertedRow = await table.insertRow({
    referenceNumber,
    subject: input.subject,
    summary: input.summary,
    status: "new" satisfies ServiceRequestStatus,
    requestPriority: input.priority,
    assignedTeam: input.assignedTeam,
    equipmentId: input.equipmentId ?? null,
    customerId: input.customerId ?? null,
    dealerId: input.dealerId ?? null,
    estimatedValue: input.estimatedValue ?? null,
    // `requestedAt` is intentionally never written here - only the seed
    // path backdates a request; a live-created request always gets its
    // real CREATEDTIME.
  });

  return serviceRequestSchema.parse(rowToServiceRequest(insertedRow));
}

export interface SeedServiceRequestInput {
  referenceNumber: string;
  subject: string;
  summary: string;
  status: ServiceRequestStatus;
  priority: ServiceRequestPriority;
  assignedTeam: string;
  equipmentId?: string;
  customerId?: string;
  dealerId?: string;
  estimatedValue?: number;
  /** ISO 8601 string - the fixture's own historical `createdAt`, written to
   * the `requestedAt` override column (see module doc). */
  requestedAt?: string;
}

/**
 * One-time bulk seed, used by `POST /api/service-requests/seed` to give a
 * freshly created (empty) table sample rows so the dashboard charts have
 * something to show. Unlike `createServiceRequestRow`, this accepts an
 * explicit `status` per row (seed fixtures cover every status on purpose,
 * to fill out the status-breakdown chart) rather than forcing "new".
 *
 * Guarded by a row-count check so repeat calls (e.g. clicking the "Load
 * sample data" button twice) never duplicate rows - it's a no-op once the
 * table has *any* rows, seeded or real.
 *
 * CAVEAT: `CREATEDTIME`/`MODIFIEDTIME` are Catalyst system columns the SDK
 * doesn't let a write override - every seeded row still gets "now" as its
 * actual CREATEDTIME/MODIFIEDTIME, not the varied historical dates the
 * original fixture data (src/data/mock-service-requests.ts) was authored
 * with. That's still true and unchanged, and it still means anything that
 * reads CREATEDTIME/MODIFIEDTIME directly (e.g. "Updated" timestamps
 * elsewhere) will show "now" for freshly-seeded rows.
 *
 * However, this is now MITIGATED for chart purposes: each fixture also
 * writes its own historical `createdAt` into the `requestedAt` override
 * column, and `rowToServiceRequest` prefers `requestedAt` over CREATEDTIME
 * when mapping a row's `createdAt` (see module doc). So the weekly
 * request-volume/revenue trend charts, which key off `createdAt`, see the
 * fixtures' real historical spread instead of every seeded row landing in
 * the current week.
 */
export async function seedServiceRequestsIfEmpty(
  app: CatalystApp,
  fixtures: SeedServiceRequestInput[]
): Promise<{ seeded: boolean; insertedCount: number; existingCount: number }> {
  const existing = await listServiceRequests(app);
  if (existing.length > 0) {
    return { seeded: false, insertedCount: 0, existingCount: existing.length };
  }

  const table = app.datastore().table(TABLE_NAME);
  await table.insertRows(
    fixtures.map((f) => ({
      referenceNumber: f.referenceNumber,
      subject: f.subject,
      summary: f.summary,
      status: f.status,
      requestPriority: f.priority,
      assignedTeam: f.assignedTeam,
      equipmentId: f.equipmentId ?? null,
      customerId: f.customerId ?? null,
      dealerId: f.dealerId ?? null,
      estimatedValue: f.estimatedValue ?? null,
      requestedAt: f.requestedAt ?? null,
    }))
  );

  return { seeded: true, insertedCount: fixtures.length, existingCount: 0 };
}

/**
 * Updates a service request's status. Throws a clear `Error` if the row
 * doesn't exist or the update otherwise fails - the SDK doesn't document a
 * dedicated "not found" error type/code for `updateRow` (see
 * node_modules/zcatalyst-sdk-node/lib/utils/error.js's `CatalystError`,
 * which only exposes generic `code`/`message`/`statusCode`), so this
 * inspects the thrown error for the common not-found signals (HTTP 404, or
 * a "not found"/"does not exist" message) and otherwise rethrows the
 * original error wrapped with context.
 */
export async function updateServiceRequestStatusRow(
  app: CatalystApp,
  rowId: string,
  status: ServiceRequestStatus
): Promise<ServiceRequest> {
  const table = app.datastore().table(TABLE_NAME);

  let updatedRow: ICatalystRow;
  try {
    updatedRow = await table.updateRow({ ROWID: rowId, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // The SDK's own error type is loosely typed (`any` value/statusCode) -
    // this narrow, commented cast is the SDK's own looseness, not ours.
    const statusCode = (error as { statusCode?: number })?.statusCode;
    if (statusCode === 404 || /not found|does not exist/i.test(message)) {
      throw new Error(`Service request "${rowId}" was not found.`);
    }
    throw new Error(`Failed to update service request "${rowId}": ${message}`, {
      cause: error,
    });
  }

  return serviceRequestSchema.parse(rowToServiceRequest(updatedRow));
}
