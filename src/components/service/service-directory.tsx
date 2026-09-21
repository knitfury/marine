"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  PageHeader,
  SearchInput,
  FilterBar,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  type FilterDef,
} from "@/components/shared";
import { ServiceRequestListRow } from "@/components/service/service-request-list-row";
import { RaiseRequestButton } from "@/components/service/raise-request-dialog";
import {
  getCurrentMockUser,
  getCustomers,
  getDealers,
  getEquipment,
  getServiceRequests,
  type ServiceRequestFilters,
} from "@/lib/mock-api";
import { formatServiceRequestPriority, formatServiceRequestStatus } from "@/lib/formatting/status";
import { SERVICE_REQUEST_PRIORITIES, SERVICE_REQUEST_STATUSES } from "@/lib/constants/status";
import { useRoleStore } from "@/stores/role-store";
import type { ServiceRequestPriority, ServiceRequestStatus } from "@/types";

/**
 * Role-authoritative org scoping, mirroring the equipment directory: for
 * dealer/customer roles the user's own organization id always wins over
 * any incoming `customerId`/`dealerId` URL param, so a manually-edited URL
 * can never escape their own scope. Internal users have no inherent scope,
 * so incoming params (e.g. from an equipment detail page's "View all"
 * link, or a dealer/customer detail page) are honored as filters.
 */
function resolveOrgScope(
  role: "internal" | "dealer" | "customer",
  organizationId: string,
  urlCustomerId: string | null,
  urlDealerId: string | null
): { customerId?: string; dealerId?: string } {
  if (role === "dealer") return { dealerId: organizationId };
  if (role === "customer") return { customerId: organizationId };
  return {
    customerId: urlCustomerId ?? undefined,
    dealerId: urlDealerId ?? undefined,
  };
}

export function ServiceDirectory() {
  const role = useRoleStore((state) => state.role);
  const searchParams = useSearchParams();
  const urlCustomerId = searchParams.get("customerId");
  const urlDealerId = searchParams.get("dealerId");
  const urlEquipmentId = searchParams.get("equipmentId");

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<ServiceRequestStatus | undefined>(undefined);
  const [priority, setPriority] = React.useState<ServiceRequestPriority | undefined>(undefined);
  const [assignedTeam, setAssignedTeam] = React.useState<string | undefined>(undefined);

  const userQuery = useQuery({
    queryKey: ["current-user", role],
    queryFn: () => getCurrentMockUser(role),
  });
  const user = userQuery.data;

  const orgScope = user
    ? resolveOrgScope(user.role, user.organizationId, urlCustomerId, urlDealerId)
    : undefined;

  const filters: ServiceRequestFilters = {
    ...orgScope,
    equipmentId: urlEquipmentId ?? undefined,
    search: search || undefined,
    status,
    priority,
    assignedTeam,
  };

  const requestsQuery = useQuery({
    queryKey: ["service-requests", "directory", filters],
    queryFn: () => getServiceRequests(filters),
    enabled: !!user,
  });

  // Role-scoped (but otherwise unfiltered) fetch, used only to derive
  // stable "team" filter options regardless of the other active filters.
  const scopeQuery = useQuery({
    queryKey: ["service-requests", "scope", orgScope],
    queryFn: () => getServiceRequests(orgScope),
    enabled: !!user,
  });

  const isInternal = user?.role === "internal";
  const isDealer = user?.role === "dealer";

  const equipmentMapQuery = useQuery({
    queryKey: ["equipment", "map", orgScope],
    queryFn: () => getEquipment(orgScope),
    enabled: !!user,
  });

  const customerMapQuery = useQuery({
    queryKey: ["customers", "map", isInternal ? "all" : user?.organizationId],
    queryFn: () =>
      isInternal ? getCustomers() : getCustomers({ dealerId: user!.organizationId }),
    enabled: !!user && (isInternal || isDealer),
  });

  const dealerMapQuery = useQuery({
    queryKey: ["dealers", "map", "all"],
    queryFn: () => getDealers(),
    enabled: !!user && isInternal,
  });

  const equipmentNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const eq of equipmentMapQuery.data ?? []) map.set(eq.id, eq.name);
    return map;
  }, [equipmentMapQuery.data]);

  const customerNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const c of customerMapQuery.data ?? []) map.set(c.id, c.name);
    return map;
  }, [customerMapQuery.data]);

  const dealerNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const d of dealerMapQuery.data ?? []) map.set(d.id, d.name);
    return map;
  }, [dealerMapQuery.data]);

  const teamOptions = React.useMemo(() => {
    const teams = new Set((scopeQuery.data ?? []).map((sr) => sr.assignedTeam));
    return [...teams].sort().map((t) => ({ label: t, value: t }));
  }, [scopeQuery.data]);

  const filterDefs: FilterDef[] = [
    {
      key: "status",
      label: "Status",
      options: SERVICE_REQUEST_STATUSES.map((s) => ({
        label: formatServiceRequestStatus(s).label,
        value: s,
      })),
      value: status,
      onChange: (v) => setStatus(v as ServiceRequestStatus | undefined),
    },
    {
      key: "priority",
      label: "Priority",
      options: SERVICE_REQUEST_PRIORITIES.map((p) => ({
        label: formatServiceRequestPriority(p).label,
        value: p,
      })),
      value: priority,
      onChange: (v) => setPriority(v as ServiceRequestPriority | undefined),
    },
    {
      key: "assignedTeam",
      label: "Team",
      options: teamOptions,
      value: assignedTeam,
      onChange: setAssignedTeam,
    },
  ];

  const hasActiveFilters = !!(search || status || priority || assignedTeam);
  const requests = requestsQuery.data ?? [];

  const description =
    user?.role === "internal"
      ? "All service requests across every dealer and customer."
      : "Service requests associated with your account.";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Service Requests"
        description={description}
        action={<RaiseRequestButton />}
      />
      <p className="-mt-4 text-xs text-muted-foreground">
        Raising a request saves it to the shared backend, so everyone sees it after you submit.
        Editing, assigning, and reopening a closed request aren&apos;t available yet.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by subject, reference number, or summary..."
          aria-label="Search service requests"
          className="sm:max-w-sm"
        />
        <FilterBar filters={filterDefs} />
      </div>

      {requestsQuery.isLoading || userQuery.isLoading ? (
        <LoadingSkeleton variant="list" count={6} />
      ) : requestsQuery.isError || userQuery.isError ? (
        <ErrorState
          heading="Couldn't load service requests"
          description="Something went wrong fetching service requests."
          onRetry={() => {
            userQuery.refetch();
            requestsQuery.refetch();
          }}
        />
      ) : requests.length === 0 ? (
        <EmptyState
          heading="No service requests match these filters"
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters."
              : user?.role === "internal"
                ? "Service requests will show up here as they're logged."
                : "You have no service requests on file yet."
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((request) => (
            <ServiceRequestListRow
              key={request.id}
              request={request}
              equipmentName={request.equipmentId ? equipmentNameById.get(request.equipmentId) : undefined}
              customerName={
                (isInternal || isDealer) && request.customerId
                  ? customerNameById.get(request.customerId)
                  : undefined
              }
              dealerName={
                isInternal && request.dealerId ? dealerNameById.get(request.dealerId) : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
