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
import { EquipmentCatalogueCard } from "@/components/equipment/equipment-catalogue-card";
import {
  getCurrentMockUser,
  getCustomers,
  getDealers,
  getEquipment,
  type EquipmentFilters,
} from "@/lib/mock-api";
import { formatEquipmentStatus } from "@/lib/formatting/status";
import { EQUIPMENT_STATUSES } from "@/lib/constants/status";
import { useRoleStore } from "@/stores/role-store";
import type { Equipment, EquipmentStatus } from "@/types";

/**
 * Resolves the role-authoritative scoping for equipment queries. For
 * dealer/customer roles the user's own organization id is always used -
 * any incoming `customerId`/`dealerId` URL param is ignored for those roles
 * so a manually-edited URL can never widen access beyond their own org.
 * Internal users have no inherent scope, so an incoming param (e.g. from a
 * dealer/customer detail page's "View all equipment" link) is honored as an
 * additional filter.
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

export function EquipmentDirectory() {
  const role = useRoleStore((state) => state.role);
  const searchParams = useSearchParams();
  const urlCustomerId = searchParams.get("customerId");
  const urlDealerId = searchParams.get("dealerId");

  const [search, setSearch] = React.useState("");
  const [equipmentType, setEquipmentType] = React.useState<string | undefined>(undefined);
  const [status, setStatus] = React.useState<EquipmentStatus | undefined>(undefined);

  const userQuery = useQuery({
    queryKey: ["current-user", role],
    queryFn: () => getCurrentMockUser(role),
  });
  const user = userQuery.data;

  const orgScope = user
    ? resolveOrgScope(user.role, user.organizationId, urlCustomerId, urlDealerId)
    : undefined;

  const filters: EquipmentFilters = {
    ...orgScope,
    search: search || undefined,
    equipmentType,
    status,
  };

  const equipmentQuery = useQuery({
    queryKey: ["equipment", "directory", filters],
    queryFn: () => getEquipment(filters),
    enabled: !!user,
  });

  // A role-scoped (but otherwise unfiltered) fetch, used only to derive
  // stable filter options and, for internal users, associated org context -
  // this way the type filter's options don't shrink as other filters narrow
  // the main result set.
  const scopeQuery = useQuery({
    queryKey: ["equipment", "scope", orgScope],
    queryFn: () => getEquipment(orgScope),
    enabled: !!user,
  });

  const isInternal = user?.role === "internal";
  const isDealer = user?.role === "dealer";

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

  const equipmentTypeOptions = React.useMemo(() => {
    const types = new Set((scopeQuery.data ?? []).map((eq) => eq.equipmentType));
    return [...types].sort().map((t) => ({ label: t, value: t }));
  }, [scopeQuery.data]);

  const filterDefs: FilterDef[] = [
    {
      key: "equipmentType",
      label: "Type",
      options: equipmentTypeOptions,
      value: equipmentType,
      onChange: setEquipmentType,
    },
    {
      key: "status",
      label: "Status",
      options: EQUIPMENT_STATUSES.map((s) => ({
        label: formatEquipmentStatus(s).label,
        value: s,
      })),
      value: status,
      onChange: (v) => setStatus(v as EquipmentStatus | undefined),
    },
  ];

  const hasActiveFilters = !!(search || equipmentType || status);
  const equipment = equipmentQuery.data ?? [];

  const description =
    user?.role === "internal"
      ? "All equipment across every dealer and customer."
      : "Equipment associated with your account.";

  function buildStats(eq: Equipment) {
    const stats = [{ label: "Serial", value: eq.serialNumber }];
    if (isInternal || isDealer) {
      if (eq.customerId) {
        const name = customerNameById.get(eq.customerId);
        if (name) stats.push({ label: "Customer", value: name });
      }
    }
    if (isInternal && eq.dealerId) {
      const name = dealerNameById.get(eq.dealerId);
      if (name) stats.push({ label: "Dealer", value: name });
    }
    return stats;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Equipment" description={description} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, model, or serial number..."
          aria-label="Search equipment"
          className="sm:max-w-sm"
        />
        <FilterBar filters={filterDefs} />
      </div>

      {equipmentQuery.isLoading || userQuery.isLoading ? (
        <LoadingSkeleton variant="cards" count={6} />
      ) : equipmentQuery.isError || userQuery.isError ? (
        <ErrorState
          heading="Couldn't load equipment"
          description="Something went wrong fetching equipment."
          onRetry={() => {
            userQuery.refetch();
            equipmentQuery.refetch();
          }}
        />
      ) : equipment.length === 0 ? (
        <EmptyState
          heading={hasActiveFilters ? "No equipment matches these filters" : "No equipment on file yet"}
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters."
              : user?.role === "internal"
                ? "Equipment will show up here once it's added."
                : "You have no equipment on file yet."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {equipment.map((eq) => (
            <EquipmentCatalogueCard key={eq.id} equipment={eq} stats={buildStats(eq)} />
          ))}
        </div>
      )}
    </div>
  );
}
