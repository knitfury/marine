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
  mockServiceRequests,
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

/** Runs the given synchronous computation after the standard mock latency,
 * honoring the dev-only `forceError` state. */
async function withMockLatency<T>(compute: () => T): Promise<T> {
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

function scopedServiceRequests(role: UserRole, user: User): ServiceRequest[] {
  if (role === "internal") return mockServiceRequests;
  if (role === "dealer") {
    return mockServiceRequests.filter((sr) => sr.dealerId === user.organizationId);
  }
  return mockServiceRequests.filter((sr) => sr.customerId === user.organizationId);
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
  return withMockLatency(() => {
    if (getMockApiState().forceEmpty) {
      return dashboardSummarySchema.parse({
        openServiceRequests: 0,
        highPriorityRequests: 0,
        activeDealers: 0,
        activeCustomers: 0,
        activeEquipment: 0,
        equipmentInMaintenance: 0,
      });
    }

    const requests = scopedServiceRequests(role, user);
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
  return withMockLatency(() => {
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

    return z.array(dealerSchema).parse(results);
  });
}

export async function getDealerById(id: string): Promise<Dealer | null> {
  return withMockLatency(() => {
    if (getMockApiState().forceEmpty) return null;
    const found = mockDealers.find((d) => d.id === id);
    return found ? dealerSchema.parse(found) : null;
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
  return withMockLatency(() => {
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

    return z.array(customerSchema).parse(results);
  });
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  return withMockLatency(() => {
    if (getMockApiState().forceEmpty) return null;
    const found = mockCustomers.find((c) => c.id === id);
    return found ? customerSchema.parse(found) : null;
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
  return withMockLatency(() => {
    if (getMockApiState().forceEmpty) return [];

    let results = mockServiceRequests;
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
  return withMockLatency(() => {
    if (getMockApiState().forceEmpty) return null;
    const found = mockServiceRequests.find((sr) => sr.id === id);
    return found ? serviceRequestSchema.parse(found) : null;
  });
}
