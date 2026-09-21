/**
 * Persistent, mutable service-request store.
 * -----------------------------------------------------------------------
 * Phase 1 treated `mockServiceRequests` (src/data/mock-service-requests.ts)
 * as a fixed, read-only array. Phase 2 needs staff to actually raise and
 * update requests, with the result surviving a page reload - this module
 * is the seam that makes that real without a live backend: it keeps a
 * module-level in-memory array (seeded from the static fixture) and mirrors
 * every mutation to `localStorage`, so a reload rehydrates from what was
 * last written instead of resetting to the static fixture.
 *
 * This is intentionally NOT shared, multi-user state - it lives entirely
 * in the visiting browser's `localStorage`, exactly like the role switcher
 * (src/stores/role-store.ts) and theme preference
 * (src/providers/theme-provider.tsx). Two different browsers (or two
 * people) never see each other's writes.
 *
 * SSR-safety: every `localStorage`/`window` access is guarded. On the
 * server this module just operates on an in-memory seeded array with no
 * persistence - the same "module state is process-local, not per-request"
 * caveat already documented on src/lib/mock-api/mock-state.ts applies here,
 * and is harmless because all real mutations in this app are triggered
 * from client components (React Query mutations), never during SSR.
 *
 * Scope: this module owns persistence/state only. Filtering, latency
 * simulation, id/reference-number generation and `forceError` handling all
 * stay in src/lib/mock-api/index.ts, which is the only module that should
 * import from here.
 */

import { mockServiceRequests } from "@/data";
import { serviceRequestSchema } from "@/schemas";
import type { ServiceRequest } from "@/types";

const STORAGE_KEY = "marinelink-service-requests";

let requests: ServiceRequest[] | null = null;

function seedFromFixture(): ServiceRequest[] {
  return mockServiceRequests.map((sr) => serviceRequestSchema.parse(sr));
}

function persistToStorage(list: ServiceRequest[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // localStorage can throw (private browsing, blocked storage, quota
    // exceeded, etc.) - the in-memory array still serves the rest of this
    // session, it just won't survive a reload.
  }
}

/** Reads and validates whatever is currently in localStorage, dropping any
 * record that fails schema validation instead of crashing the app. Returns
 * null when there's nothing stored yet (or it couldn't be read at all). */
function readFromStorage(): ServiceRequest[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const valid: ServiceRequest[] = [];
    for (const item of parsed) {
      const result = serviceRequestSchema.safeParse(item);
      if (result.success) valid.push(result.data);
    }
    return valid;
  } catch {
    return null;
  }
}

/** Lazily initializes the module-level array on first access, hydrating
 * from localStorage on the client (falling back to - and immediately
 * persisting - the static fixture when nothing is stored yet). */
function ensureLoaded(): ServiceRequest[] {
  if (requests) return requests;

  if (typeof window === "undefined") {
    requests = seedFromFixture();
    return requests;
  }

  const stored = readFromStorage();
  if (stored) {
    requests = stored;
  } else {
    requests = seedFromFixture();
    // Persist the seed immediately so the very first load already has
    // something durable, rather than only writing on the first mutation.
    persistToStorage(requests);
  }
  return requests;
}

/** The current live array of service requests, newest-first insertion
 * order for anything created this session. */
export function getServiceRequestsSnapshot(): ServiceRequest[] {
  return ensureLoaded();
}

/** Adds a new, already-validated service request to the store and persists
 * the full array. Internal to mock-api - UI code creates requests via
 * `createServiceRequest` in src/lib/mock-api/index.ts. */
export function addServiceRequestToStore(request: ServiceRequest): ServiceRequest {
  const list = ensureLoaded();
  requests = [request, ...list];
  persistToStorage(requests);
  return request;
}

/** Merges a partial update into the matching service request and persists
 * the full array. Returns null when no request with that id exists.
 * Internal to mock-api - UI code updates status via
 * `updateServiceRequestStatus` in src/lib/mock-api/index.ts. */
export function updateServiceRequestInStore(
  id: string,
  patch: Partial<Omit<ServiceRequest, "id">>
): ServiceRequest | null {
  const list = ensureLoaded();
  const index = list.findIndex((sr) => sr.id === id);
  if (index === -1) return null;

  const updated: ServiceRequest = Object.assign({}, list[index], patch);
  const next = [...list];
  next[index] = updated;
  requests = next;
  persistToStorage(requests);
  return updated;
}
