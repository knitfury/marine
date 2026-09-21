/**
 * MarineLink mock API layer.
 * =============================================================================
 * ARCHITECTURAL SEAM - READ BEFORE EXTENDING
 * -----------------------------------------------------------------------------
 * Every function exported from this module is the Phase 1 stand-in for a
 * real network call. It is deliberately shaped like a real API client
 * (async, filterable, returning typed + zod-validated data with artificial
 * latency) so that swapping it for a real backend later is a drop-in
 * replacement at the call site - UI code should only ever import from
 * "@/lib/mock-api", never reach into "@/data" directly.
 *
 * Per the product spec's data-source mapping (see spec section 25), each
 * entity this module serves is expected to eventually be backed by Zoho as
 * follows:
 *   - Dealer            -> a Zoho org / partner record, or a dedicated
 *                           custom module in Zoho CRM.
 *   - Customer           -> Zoho CRM Accounts/Contacts, or a custom module
 *                           if dealer-managed customers need distinct
 *                           fields from direct Marine Travelift accounts.
 *   - Equipment           -> a custom module in Zoho CRM (or Zoho Inventory)
 *                           tracking serialized units against
 *                           customers/dealers.
 *   - ServiceRequest      -> a custom module in Zoho CRM (or Zoho Desk),
 *                           likely backing whatever case/ticket workflow
 *                           the service org standardizes on.
 *   - User / permissions  -> a future auth layer (SSO / Zoho directory
 *                           integration), not modeled by Zoho CRM at all.
 *
 * AUTHORIZATION NOTE: the role/organization filtering done in this module
 * (e.g. getDashboardSummary scoping counts to a dealer's own org) *models*
 * what a real authorization layer should do, so the UI can be built and
 * demoed against believable, restricted data. It does NOT enforce anything -
 * every function here is plain data access. Real enforcement belongs
 * server-side (route handlers / the future backend), gated by real
 * authentication. The pure helpers in "@/lib/permissions" are the
 * equivalent UI-only modeling for view-level checks and carry the same
 * caveat.
 * =============================================================================
 */

import { z } from "zod";
import {
  mockCustomers,
  mockDealers,
  mockEquipment,
  mockInsights,
} from "@/data";
import { getMockUserForRole } from "@/data/mock-users";
import {
  customerSchema,
  dashboardInsightSchema,
  dashboardSummarySchema,
  dealerSchema,
  equipmentSchema,
  serviceRequestSchema,
  userSchema,
} from "@/schemas";
import { OPEN_SERVICE_REQUEST_STATUSES } from "@/lib/constants";
import type {
  Customer,
  CustomerStatus,
  Dealer,
  DealerStatus,
  DashboardInsight,
  DashboardSummary,
  Equipment,
  EquipmentStatus,
  ServiceRequest,
  ServiceRequestPriority,
  ServiceRequestStatus,
  User,
  UserRole,
} from "@/types";
import { delay } from "./delay";
import { getMockApiState, SimulatedNetworkError } from "./mock-state";

export { getMockApiState, setMockApiState, resetMockApiState, SimulatedNetworkError } from "./mock-state";
export type { MockApiState } from "./mock-state";
export { delay } from "./delay";

const HIGH_PRIORITY: ServiceRequestPriority[] = ["high", "urgent"];

/**
 * Fetches every service request from the real backend
 * (`src/app/api/service-requests/route.ts`, backed by Catalyst DataStore -
 * see `src/lib/catalyst/service-requests-table.ts`). A relative URL is
 * correct here: every call site of the functions in this module runs
 * client-side, inside TanStack Query hooks in `"use client"` components
 * (confirmed for all current call sites as of this module's last edit).
 *
 * Throws (rather than returning a fallback) on a non-OK response or a
 * response that fails `serviceRequestSchema` validation, same as every
 * other read in this module - the UI's existing ErrorState/retry handling
 * is what's meant to absorb this.
 */
async function fetchServiceRequests(): Promise<ServiceRequest[]> {
  const res = await fetch("/api/service-requests");
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, "Failed to fetch service requests"));
  }
  const data: unknown = await res.json();
  return z.array(serviceRequestSchema).parse(data);
}

/** Best-effort extraction of the `{ error: string }` body the API routes
 * return on failure (see src/app/api/service-requests/**), falling back to
 * a generic message keyed off the HTTP status when the body isn't JSON or
 * doesn't have that shape. */
async function extractErrorMessage(res: Response, fallbackPrefix: string): Promise<string> {
  try {
    const body: unknown = await res.json();
    if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
      return body.error;
    }
  } catch {
    // Response body wasn't JSON - fall through to the generic message.
  }
  return `${fallbackPrefix} (HTTP ${res.status}).`;
}

/** Runs the given (possibly async) computation after the standard mock
 * latency, honoring the dev-only `forceError` state. `compute` is allowed
 * to be async so callers can `await` a real network call (e.g.
 * `fetchServiceRequests`) through the same latency/forceError seam every
 * other function in this module already goes through - `forceError` is
 * checked, and short-circuits with `SimulatedNetworkError`, *before*
 * `compute` ever runs, so a real network call is never attempted while the
 * dev toggle is on. */
async function withMockLatency<T>(compute: () => T | Promise<T>): Promise<T> {
  await delay();
  if (getMockApiState().forceError) {
    throw new SimulatedNetworkError();
  }
  return compute();
}

function matchesSearch(haystacks: (string | undefined)[], search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return haystacks.some((h) => h?.toLowerCase().includes(needle));
}

/**
 * `openServiceRequestCount` on the static Dealer/Customer fixtures
 * (src/data/mock-dealers.ts, mock-customers.ts) is computed once at
 * module-load time against the *original* static service-request array -
 * now that service requests are mutable and backed by the real DataStore
 * table (see fetchServiceRequests above), that baked-in count goes stale
 * the moment a request is created or its status changes. These helpers
 * recompute it live from the current backend data instead, so every
 * Dealer/Customer this module serves always reflects reality.
 */
async function liveOpenServiceRequestCountFor(scope: { dealerId?: string; customerId?: string }): Promise<number> {
  const requests = await fetchServiceRequests();
  return requests.filter((sr) => {
    const matchesOrg = scope.dealerId ? sr.dealerId === scope.dealerId : sr.customerId === scope.customerId;
    return matchesOrg && OPEN_SERVICE_REQUEST_STATUSES.includes(sr.status);
  }).length;
}

async function withLiveOpenCount<T extends Dealer | Customer>(record: T, scope: { dealerId?: string; customerId?: string }): Promise<T> {
  return { ...record, openServiceRequestCount: await liveOpenServiceRequestCountFor(scope) };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

/** Returns the seeded mock user for a role (defaults to "internal"). */
export async function getCurrentMockUser(role: UserRole = "internal"): Promise<User> {
  return withMockLatency(() => userSchema.parse(getMockUserForRole(role)));
}

// ---------------------------------------------------------------------------
// Dashboard summary + insights
// ---------------------------------------------------------------------------

async function scopedServiceRequests(role: UserRole, user: User): Promise<ServiceRequest[]> {
  const liveRequests = await fetchServiceRequests();
  if (role === "internal") return liveRequests;
  if (role === "dealer") {
    return liveRequests.filter((sr) => sr.dealerId === user.organizationId);
  }
  return liveRequests.filter((sr) => sr.customerId === user.organizationId);
}

function scopedEquipment(role: UserRole, user: User): Equipment[] {
  if (role === "internal") return mockEquipment;
  if (role === "dealer") {
    return mockEquipment.filter((eq) => eq.dealerId === user.organizationId);
  }
  return mockEquipment.filter((eq) => eq.customerId === user.organizationId);
}

/**
 * Aggregate dashboard counts. Internal users get a company-wide rollup;
 * dealer/customer users get the same shape scoped to their own org.
 */
export async function getDashboardSummary(
  role: UserRole,
  user: User
): Promise<DashboardSummary> {
  return withMockLatency(async () => {
    if (getMockApiState().forceEmpty) {
      return dashboardSummarySchema.parse({
        openServiceRequests: 0,
        highPriorityRequests: 0,
        activeDealers: 0,
        activeCustomers: 0,
        activeEquipment: 0,
        equipmentInMaintenance: 0,
        totalRevenue: 0,
      });
    }

    const requests = await scopedServiceRequests(role, user);
    const equipment = scopedEquipment(role, user);

    const activeDealers =
      role === "internal"
        ? mockDealers.filter((d) => d.status === "active").length
        : role === "dealer"
          ? mockDealers.filter((d) => d.id === user.organizationId && d.status === "active").length
          : 0;

    const activeCustomers =
      role === "internal"
        ? mockCustomers.filter((c) => c.status === "active").length
        : role === "dealer"
          ? mockCustomers.filter((c) => c.dealerId === user.organizationId && c.status === "active").length
          : mockCustomers.filter((c) => c.id === user.organizationId && c.status === "active").length;

    const totalRevenue = requests
      .filter((sr) => sr.status === "resolved" || sr.status === "closed")
      .reduce((sum, sr) => sum + (sr.estimatedValue ?? 0), 0);

    const summary: DashboardSummary = {
      openServiceRequests: requests.filter((sr) =>
        OPEN_SERVICE_REQUEST_STATUSES.includes(sr.status)
      ).length,
      highPriorityRequests: requests.filter((sr) => HIGH_PRIORITY.includes(sr.priority))
        .length,
      activeDealers,
      activeCustomers,
      activeEquipment: equipment.filter((eq) => eq.currentStatus === "active").length,
      equipmentInMaintenance: equipment.filter((eq) => eq.currentStatus === "maintenance")
        .length,
      totalRevenue,
    };

    return dashboardSummarySchema.parse(summary);
  });
}

/** Dashboard insights filtered to what a given role/org should see. */
export async function getDashboardInsights(
  role: UserRole,
  user: User
): Promise<DashboardInsight[]> {
  return withMockLatency(() => {
    if (getMockApiState().forceEmpty) return [];

    let results: DashboardInsight[];
    if (role === "internal") {
      results = mockInsights;
    } else if (role === "dealer") {
      results = mockInsights.filter((i) => i.relatedDealerId === user.organizationId);
    } else {
      results = mockInsights.filter((i) => i.relatedCustomerId === user.organizationId);
    }

    return z.array(dashboardInsightSchema).parse(results);
  });
}

// ---------------------------------------------------------------------------
// Dealers
// ---------------------------------------------------------------------------

export interface DealerFilters {
  search?: string;
  status?: DealerStatus;
  region?: string;
}

/**
 * Returns dealers matching the given filters. This is an internal-only
 * concept in the product (only internal staff browse the full dealer
 * list) - but that is a route/UI-layer guard's job to enforce (see the
 * module-level AUTHORIZATION NOTE above); this function itself is just
 * data access and applies no role check.
 */
export async function getDealers(filters?: DealerFilters): Promise<Dealer[]> {
  return withMockLatency(async () => {
    if (getMockApiState().forceEmpty) return [];

    let results = mockDealers;
    if (filters?.status) {
      results = results.filter((d) => d.status === filters.status);
    }
    if (filters?.region) {
      results = results.filter((d) => d.region === filters.region);
    }
    if (filters?.search) {
      results = results.filter((d) =>
        matchesSearch([d.name, d.region, d.primaryContactName], filters.search!)
      );
    }

    const withCounts = await Promise.all(
      results.map((d) => withLiveOpenCount(d, { dealerId: d.id }))
    );
    return z.array(dealerSchema).parse(withCounts);
  });
}

export async function getDealerById(id: string): Promise<Dealer | null> {
  return withMockLatency(async () => {
    if (getMockApiState().forceEmpty) return null;
    const found = mockDealers.find((d) => d.id === id);
    if (!found) return null;
    return dealerSchema.parse(await withLiveOpenCount(found, { dealerId: found.id }));
  });
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export interface CustomerFilters {
  search?: string;
  status?: CustomerStatus;
  dealerId?: string;
}

export async function getCustomers(filters?: CustomerFilters): Promise<Customer[]> {
  return withMockLatency(async () => {
    if (getMockApiState().forceEmpty) return [];

    let results = mockCustomers;
    if (filters?.status) {
      results = results.filter((c) => c.status === filters.status);
    }
    if (filters?.dealerId) {
      results = results.filter((c) => c.dealerId === filters.dealerId);
    }
    if (filters?.search) {
      results = results.filter((c) =>
        matchesSearch(
          [c.name, c.organizationName, c.primaryContactName],
          filters.search!
        )
      );
    }

    const withCounts = await Promise.all(
      results.map((c) => withLiveOpenCount(c, { customerId: c.id }))
    );
    return z.array(customerSchema).parse(withCounts);
  });
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  return withMockLatency(async () => {
    if (getMockApiState().forceEmpty) return null;
    const found = mockCustomers.find((c) => c.id === id);
    if (!found) return null;
    return customerSchema.parse(await withLiveOpenCount(found, { customerId: found.id }));
  });
}

// ---------------------------------------------------------------------------
// Equipment
// ---------------------------------------------------------------------------

export interface EquipmentFilters {
  search?: string;
  equipmentType?: string;
  status?: EquipmentStatus;
  customerId?: string;
  dealerId?: string;
}

export async function getEquipment(filters?: EquipmentFilters): Promise<Equipment[]> {
  return withMockLatency(() => {
    if (getMockApiState().forceEmpty) return [];

    let results = mockEquipment;
    if (filters?.status) {
      results = results.filter((eq) => eq.currentStatus === filters.status);
    }
    if (filters?.equipmentType) {
      results = results.filter((eq) => eq.equipmentType === filters.equipmentType);
    }
    if (filters?.customerId) {
      results = results.filter((eq) => eq.customerId === filters.customerId);
    }
    if (filters?.dealerId) {
      results = results.filter((eq) => eq.dealerId === filters.dealerId);
    }
    if (filters?.search) {
      results = results.filter((eq) =>
        matchesSearch([eq.name, eq.model, eq.serialNumber, eq.equipmentType], filters.search!)
      );
    }

    return z.array(equipmentSchema).parse(results);
  });
}

export async function getEquipmentById(id: string): Promise<Equipment | null> {
  return withMockLatency(() => {
    if (getMockApiState().forceEmpty) return null;
    const found = mockEquipment.find((eq) => eq.id === id);
    return found ? equipmentSchema.parse(found) : null;
  });
}

// ---------------------------------------------------------------------------
// Service requests
// ---------------------------------------------------------------------------

export interface ServiceRequestFilters {
  search?: string;
  status?: ServiceRequestStatus;
  priority?: ServiceRequestPriority;
  assignedTeam?: string;
  customerId?: string;
  dealerId?: string;
  equipmentId?: string;
}

export async function getServiceRequests(
  filters?: ServiceRequestFilters
): Promise<ServiceRequest[]> {
  return withMockLatency(async () => {
    if (getMockApiState().forceEmpty) return [];

    let results = await fetchServiceRequests();
    if (filters?.status) {
      results = results.filter((sr) => sr.status === filters.status);
    }
    if (filters?.priority) {
      results = results.filter((sr) => sr.priority === filters.priority);
    }
    if (filters?.assignedTeam) {
      results = results.filter((sr) => sr.assignedTeam === filters.assignedTeam);
    }
    if (filters?.customerId) {
      results = results.filter((sr) => sr.customerId === filters.customerId);
    }
    if (filters?.dealerId) {
      results = results.filter((sr) => sr.dealerId === filters.dealerId);
    }
    if (filters?.equipmentId) {
      results = results.filter((sr) => sr.equipmentId === filters.equipmentId);
    }
    if (filters?.search) {
      results = results.filter((sr) =>
        matchesSearch(
          [sr.subject, sr.referenceNumber, sr.summary, sr.assignedTeam],
          filters.search!
        )
      );
    }

    return z.array(serviceRequestSchema).parse(results);
  });
}

export async function getServiceRequestById(id: string): Promise<ServiceRequest | null> {
  return withMockLatency(async () => {
    if (getMockApiState().forceEmpty) return null;
    const found = (await fetchServiceRequests()).find((sr) => sr.id === id);
    return found ? serviceRequestSchema.parse(found) : null;
  });
}

// ---------------------------------------------------------------------------
// Service requests - mutations
// ---------------------------------------------------------------------------
//
// These are the app's real, working CRUD: they call the real backend
// (src/app/api/service-requests/**), backed by a Catalyst DataStore table
// (src/lib/catalyst/service-requests-table.ts) - not an in-memory fixture
// or localStorage. Writes are visible to every client, not just the
// browser that made them. They go through the same `withMockLatency`/
// `forceError` seam as every read above, so loading states and
// simulated-failure dev tooling behave identically for writes; `forceError`
// short-circuits inside `withMockLatency` *before* the network call below
// ever runs (see that function's doc comment), so the dev toggle works
// without needing a live backend.

export interface CreateServiceRequestInput {
  subject: string;
  summary: string;
  priority: ServiceRequestPriority;
  assignedTeam: string;
  equipmentId?: string;
  customerId?: string;
  dealerId?: string;
  estimatedValue?: number;
}

/** Raises a new service request via the real API (`POST /api/
 * service-requests`). Always starts as status "new"; `referenceNumber` is
 * assigned server-side (see createServiceRequestRow in
 * src/lib/catalyst/service-requests-table.ts). */
export async function createServiceRequest(
  input: CreateServiceRequestInput
): Promise<ServiceRequest> {
  return withMockLatency(async () => {
    const res = await fetch("/api/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, "Failed to create service request"));
    }
    const data: unknown = await res.json();
    return serviceRequestSchema.parse(data);
  });
}

/** One-time sample-data loader for a freshly created (empty) DataStore
 * table, via the real API (`POST /api/service-requests/seed`) - see
 * src/lib/catalyst/service-requests-table.ts's seedServiceRequestsIfEmpty
 * for the no-op-if-not-empty guard and the CREATEDTIME caveat. Surfaced by
 * the "Load sample data" button in service-directory.tsx. */
export async function seedSampleServiceRequests(): Promise<{
  seeded: boolean;
  insertedCount: number;
  existingCount: number;
}> {
  return withMockLatency(async () => {
    const res = await fetch("/api/service-requests/seed", { method: "POST" });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, "Failed to load sample data"));
    }
    const data: unknown = await res.json();
    return z
      .object({
        seeded: z.boolean(),
        insertedCount: z.number(),
        existingCount: z.number(),
      })
      .parse(data);
  });
}

/** Advances (or closes) a service request's status via the real API
 * (`PATCH /api/service-requests/:rowId`). Throws when no request with that
 * id exists. */
export async function updateServiceRequestStatus(
  id: string,
  status: ServiceRequestStatus
): Promise<ServiceRequest> {
  return withMockLatency(async () => {
    const res = await fetch(`/api/service-requests/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      throw new Error(
        await extractErrorMessage(res, `Failed to update service request "${id}"`)
      );
    }
    const data: unknown = await res.json();
    return serviceRequestSchema.parse(data);
  });
}
