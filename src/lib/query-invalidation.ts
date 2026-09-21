import type { QueryClient } from "@tanstack/react-query";

/**
 * Query key roots touched by a service-request create or status-update
 * mutation: the service-request lists/details themselves, the dashboard
 * summary/insights that roll up open-request counts, and every dealer/
 * customer query shape used across directories and detail pages (their
 * `openServiceRequestCount` is now derived live from the service-request
 * store - see src/lib/mock-api/index.ts's `withLiveOpenCount` - so any of
 * these can go stale after a mutation). Gathered from the actual
 * `queryKey`s in use across src/components/dashboard, src/components/
 * dealers, src/components/customers, src/components/equipment and
 * src/components/service.
 */
const SERVICE_REQUEST_RELATED_QUERY_ROOTS = [
  "service-requests",
  "service-request",
  "dashboard-summary",
  "dashboard-insights",
  "dealers",
  "dealer",
  "dealer-customers",
  "dealer-equipment",
  "dealer-service-requests",
  "customers",
  "customer",
  "customer-dealer",
  "customer-equipment",
  "customer-service-requests",
] as const;

/**
 * Invalidates every active query whose key is rooted in one of the
 * prefixes above, so a service-request create/status-update mutation is
 * reflected everywhere it's displayed (directories, dashboards, dealer/
 * customer detail pages) without a manual page reload. Shared by the
 * "Raise request" dialog and the service-detail status control so the same
 * list of affected query keys isn't duplicated in both places.
 */
export function invalidateServiceRequestRelatedQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    predicate: (query) => {
      const [root] = query.queryKey;
      return (
        typeof root === "string" &&
        (SERVICE_REQUEST_RELATED_QUERY_ROOTS as readonly string[]).includes(root)
      );
    },
  });
}
